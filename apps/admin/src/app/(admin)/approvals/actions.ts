"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function updateApprovalStatus(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const sourceId = readString(formData, "sourceId");
  const decision = readString(formData, "decision");
  const notes = readString(formData, "notes");

  if (!sourceId || !["approved", "archived", "draft"].includes(decision)) {
    throw new Error("Source and valid approval decision are required.");
  }

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .select("id, product_id, status, metadata_json")
    .eq("id", sourceId)
    .single<{
      id: string;
      product_id: string | null;
      status: string;
      metadata_json: Record<string, unknown>;
    }>();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Approval item not found.");
  }

  const decidedAt = new Date().toISOString();
  const approvalStatus =
    decision === "approved"
      ? "approved"
      : decision === "archived"
        ? "rejected"
        : "needs_revision";

  const metadata = {
    ...source.metadata_json,
    approval_status: approvalStatus,
    approval_decided_at: decidedAt,
    approval_decided_by: userId,
    approval_notes: notes || null,
  };

  const { error: updateError } = await supabase
    .from("knowledge_sources")
    .update({
      status: decision,
      metadata_json: metadata,
    })
    .eq("id", source.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await supabase.from("audit_events").insert({
    product_id: source.product_id,
    actor_type: "human",
    actor_id: userId,
    event_type: "approval_decision_recorded",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      previous_status: source.status,
      new_status: decision,
      approval_status: approvalStatus,
      notes: notes || null,
    },
  });

  revalidatePath("/approvals");
  revalidatePath("/knowledge");
  revalidatePath("/agents");
  redirect(`/approvals?status=${decision}`);
}
