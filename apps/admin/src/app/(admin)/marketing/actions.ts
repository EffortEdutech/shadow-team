"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readLines(formData: FormData, key: string) {
  return readString(formData, key)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function isMissingMarketingTable(error: { message: string }) {
  return (
    error.message.includes("marketing_") &&
    error.message.includes("schema cache")
  );
}

export async function saveMarketingProfile(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const productId = readString(formData, "productId");
  const positioningStatement = readString(formData, "positioningStatement");
  const brandVoice = readString(formData, "brandVoice");
  const approvalOwner = readString(formData, "approvalOwner");
  const targetAudiences = readLines(formData, "targetAudiences");
  const valuePropositions = readLines(formData, "valuePropositions");
  const restrictedClaims = readLines(formData, "restrictedClaims");

  if (!productId) {
    throw new Error("Product is required.");
  }

  const { error } = await supabase.from("marketing_profiles").upsert(
    {
      product_id: productId,
      target_audiences: targetAudiences,
      positioning_statement: positioningStatement || null,
      value_propositions: valuePropositions,
      brand_voice: brandVoice || null,
      restricted_claims: restrictedClaims,
      approval_owner: approvalOwner || null,
      metadata_json: {
        updated_by: userId,
        draft_only: true,
      },
    },
    { onConflict: "product_id" },
  );

  if (error) {
    if (isMissingMarketingTable(error)) {
      throw new Error(
        "Sprint 20 marketing tables are not ready yet. Run supabase/sprint_20_marketing_foundation.sql in Supabase SQL Editor, then refresh this page.",
      );
    }

    throw new Error(error.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "marketing_profile_saved",
    entity_type: "marketing_profile",
    metadata_json: {
      target_audience_count: targetAudiences.length,
      value_proposition_count: valuePropositions.length,
      restricted_claim_count: restrictedClaims.length,
    },
  });

  revalidatePath("/marketing");
}

export async function createMarketingCampaign(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const productId = readString(formData, "productId");
  const name = readString(formData, "name");
  const objective = readString(formData, "objective");
  const audience = readString(formData, "audience");
  const startsOn = readString(formData, "startsOn");
  const endsOn = readString(formData, "endsOn");

  if (!productId || !name || !objective) {
    throw new Error("Product, campaign name, and objective are required.");
  }

  const { data: campaign, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      product_id: productId,
      name,
      objective,
      audience: audience || null,
      status: "draft",
      starts_on: startsOn || null,
      ends_on: endsOn || null,
      owner_user_id: userId,
      metadata_json: {
        draft_only: true,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    if (isMissingMarketingTable(error)) {
      throw new Error(
        "Sprint 20 marketing tables are not ready yet. Run supabase/sprint_20_marketing_foundation.sql in Supabase SQL Editor, then refresh this page.",
      );
    }

    throw new Error(error.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "marketing_campaign_created",
    entity_type: "marketing_campaign",
    entity_id: campaign.id,
    metadata_json: {
      name,
      objective,
      status: "draft",
    },
  });

  revalidatePath("/marketing");
}

export async function createMarketingContentDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const productId = readString(formData, "productId");
  const campaignId = readString(formData, "campaignId") || null;
  const channelId = readString(formData, "channelId") || null;
  const title = readString(formData, "title");
  const contentBody = readString(formData, "contentBody");
  const contentType = readString(formData, "contentType") || "social_post";
  const plannedFor = readString(formData, "plannedFor");

  if (!productId || !title || !contentBody) {
    throw new Error("Product, title, and draft content are required.");
  }

  const { data: draft, error } = await supabase
    .from("marketing_content_drafts")
    .insert({
      product_id: productId,
      campaign_id: campaignId,
      channel_id: channelId,
      title,
      content_body: contentBody,
      content_type: contentType,
      status: "draft",
      planned_for: plannedFor ? new Date(plannedFor).toISOString() : null,
      created_by: userId,
      metadata_json: {
        draft_only: true,
        requires_approval_before_publishing: true,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    if (isMissingMarketingTable(error)) {
      throw new Error(
        "Sprint 20 marketing tables are not ready yet. Run supabase/sprint_20_marketing_foundation.sql in Supabase SQL Editor, then refresh this page.",
      );
    }

    throw new Error(error.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "marketing_content_draft_created",
    entity_type: "marketing_content_draft",
    entity_id: draft.id,
    metadata_json: {
      title,
      content_type: contentType,
      status: "draft",
    },
  });

  revalidatePath("/marketing");
}
