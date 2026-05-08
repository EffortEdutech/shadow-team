"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getSignedInUserId() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return { supabase, userId: user.id };
}

export async function createKnowledgeSource(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const productId = readString(formData, "productId") || null;
  const sourceType = readString(formData, "sourceType");
  const sourceTitle = readString(formData, "sourceTitle");
  const sourcePath = readString(formData, "sourcePath") || null;
  const status = readString(formData, "status") || "draft";
  const version = readString(formData, "version") || "v0.1";
  const chunkText = readString(formData, "chunkText");

  if (!sourceType || !sourceTitle || !chunkText) {
    throw new Error("Source type, title, and knowledge text are required.");
  }

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .insert({
      product_id: productId,
      source_type: sourceType,
      source_title: sourceTitle,
      source_path: sourcePath,
      status,
      version,
      metadata_json: {
        created_from: "admin_knowledge_mvp",
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert({
    source_id: source.id,
    chunk_text: chunkText,
    metadata_json: {
      chunk_type: "manual_entry",
    },
  });

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "knowledge_source_created",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      source_type: sourceType,
      status,
    },
  });

  revalidatePath("/knowledge");
}

export async function updateKnowledgeSourceStatus(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const sourceId = readString(formData, "sourceId");
  const productId = readString(formData, "productId") || null;
  const status = readString(formData, "status");

  if (!sourceId || !status) {
    throw new Error("Source and status are required.");
  }

  const { error } = await supabase
    .from("knowledge_sources")
    .update({ status })
    .eq("id", sourceId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "knowledge_source_status_changed",
    entity_type: "knowledge_source",
    entity_id: sourceId,
    metadata_json: { status },
  });

  revalidatePath("/knowledge");
}
