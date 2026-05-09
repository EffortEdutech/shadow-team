"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const workItemTypes = new Set([
  "conversation",
  "approval",
  "release_readiness",
  "delivery",
  "agent_run",
  "ticket",
]);

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

export async function markWorkItemReviewed(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const itemType = readString(formData, "itemType");
  const itemId = readString(formData, "itemId");
  const productId = readString(formData, "productId") || null;
  const itemLabel = readString(formData, "itemLabel");
  const sourcePath = readString(formData, "sourcePath");
  const note = readString(formData, "note");

  if (!workItemTypes.has(itemType) || !itemId || !itemLabel || !sourcePath) {
    throw new Error("Valid work item details are required.");
  }

  const reviewedAt = new Date();
  const reviewDate = reviewedAt.toISOString().slice(0, 10);

  const { error } = await supabase.from("work_item_reviews").upsert(
    {
      item_type: itemType,
      item_id: itemId,
      product_id: productId,
      item_label: itemLabel,
      source_path: sourcePath,
      owner_user_id: userId,
      reviewed_by: userId,
      reviewed_at: reviewedAt.toISOString(),
      review_date: reviewDate,
      note: note || null,
      metadata_json: {
        action: "reviewed_today",
      },
    },
    {
      onConflict: "item_type,item_id,review_date",
    },
  );

  if (error) {
    if (
      error.message.includes("work_item_reviews") &&
      error.message.includes("schema cache")
    ) {
      throw new Error(
        "Sprint 19 database table is not ready yet. Run supabase/sprint_19_work_item_reviews.sql in Supabase SQL Editor, then refresh this page.",
      );
    }

    throw new Error(error.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "work_item_reviewed_today",
    entity_type: itemType,
    entity_id: itemId,
    metadata_json: {
      item_label: itemLabel,
      source_path: sourcePath,
      note: note || null,
    },
  });

  revalidatePath("/work-queue");
  revalidatePath("/dashboard");
}
