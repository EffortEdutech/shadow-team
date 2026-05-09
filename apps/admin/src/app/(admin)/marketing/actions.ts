"use server";

import { revalidatePath } from "next/cache";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
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

const SocialMediaDraft = z.object({
  campaignAngle: z.string().min(1),
  safetyNotes: z.array(z.string()).min(1),
  drafts: z
    .array(
      z.object({
        channelKey: z.string().min(1),
        title: z.string().min(1).max(160),
        contentType: z.enum([
          "social_post",
          "email",
          "blog_outline",
          "short_video_script",
          "ad_copy",
          "community_update",
        ]),
        body: z.string().min(1).max(2500),
        targetAudience: z.string().min(1),
        callToAction: z.string().min(1),
        humanReviewNotes: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
});

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

export async function generateSocialMediaDrafts(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const productId = readString(formData, "productId");
  const campaignId = readString(formData, "campaignId") || null;
  const channelIds = formData
    .getAll("channelIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const contentGoal = readString(formData, "contentGoal");
  const audience = readString(formData, "audience");
  const notes = readString(formData, "notes");

  if (!productId || channelIds.length === 0 || !contentGoal) {
    throw new Error("Product, at least one channel, and content goal are required.");
  }

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    productResult,
    productProfileResult,
    marketingProfileResult,
    campaignResult,
    channelsResult,
    recentDraftsResult,
    recentConversationsResult,
    productMarketingAgentResult,
    socialAgentResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, risk_level, first_ai_use_case")
      .eq("id", productId)
      .single<{
        id: string;
        name: string;
        slug: string;
        risk_level: string;
        first_ai_use_case: string | null;
      }>(),
    supabase
      .from("product_profiles")
      .select(
        "target_users, support_categories, restricted_actions, escalation_rules, metadata_json",
      )
      .eq("product_id", productId)
      .maybeSingle<{
        target_users: string[];
        support_categories: string[];
        restricted_actions: string[];
        escalation_rules: string[];
        metadata_json: Record<string, unknown>;
      }>(),
    supabase
      .from("marketing_profiles")
      .select(
        "target_audiences, positioning_statement, value_propositions, brand_voice, restricted_claims, approval_owner, metadata_json",
      )
      .eq("product_id", productId)
      .maybeSingle<{
        target_audiences: string[];
        positioning_statement: string | null;
        value_propositions: string[];
        brand_voice: string | null;
        restricted_claims: string[];
        approval_owner: string | null;
        metadata_json: Record<string, unknown>;
      }>(),
    campaignId
      ? supabase
          .from("marketing_campaigns")
          .select("id, name, objective, audience, status, starts_on, ends_on")
          .eq("id", campaignId)
          .single<{
            id: string;
            name: string;
            objective: string;
            audience: string | null;
            status: string;
            starts_on: string | null;
            ends_on: string | null;
          }>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("marketing_channels")
      .select("id, channel_key, channel_name, status")
      .in("id", channelIds)
      .returns<
        Array<{
          id: string;
          channel_key: string;
          channel_name: string;
          status: string;
        }>
      >(),
    supabase
      .from("marketing_content_drafts")
      .select("title, content_type, status, content_body, created_at, marketing_channels(channel_name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<
        Array<{
          title: string;
          content_type: string;
          status: string;
          content_body: string;
          created_at: string;
          marketing_channels: { channel_name: string } | null;
        }>
      >(),
    supabase
      .from("conversations")
      .select("subject, status, priority, last_message_preview, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<
        Array<{
          subject: string | null;
          status: string;
          priority: string;
          last_message_preview: string | null;
          created_at: string;
        }>
      >(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Product Marketing Agent")
      .maybeSingle<{ id: string }>(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Social Media Content Agent")
      .maybeSingle<{ id: string }>(),
  ]);

  for (const result of [
    productResult,
    productProfileResult,
    marketingProfileResult,
    campaignResult,
    channelsResult,
    recentDraftsResult,
    recentConversationsResult,
  ]) {
    if (result.error) {
      if (isMissingMarketingTable(result.error)) {
        throw new Error(
          "Sprint 20/21 marketing tables are not ready. Run the Sprint 20 and Sprint 21 SQL files in Supabase SQL Editor, then refresh this page.",
        );
      }

      throw new Error(result.error.message);
    }
  }

  if (!productResult.data) {
    throw new Error("Product not found.");
  }

  if (!marketingProfileResult.data) {
    throw new Error("Create the product marketing profile before generating AI social drafts.");
  }

  const channels = channelsResult.data ?? [];
  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Product Marketing Agent and Social Media Content Agent. Draft channel-specific marketing content for human approval. Do not publish anything, send messages, invent product facts, make legal/financial/certification claims, mention private customer data, promise pricing, or claim official outcomes. Use only provided product and marketing context. Every draft must be safe, factual, and review-ready.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            product: productResult.data,
            productProfile: productProfileResult.data,
            marketingProfile: marketingProfileResult.data,
            campaign: campaignResult.data,
            channels,
            contentGoal,
            requestedAudience: audience,
            notes,
            recentDrafts: recentDraftsResult.data ?? [],
            recentSupportSignals: recentConversationsResult.data ?? [],
            outputRules: {
              channelKey:
                "Use one of the provided channel_key values exactly.",
              body: "Write draft content suitable for the selected channel. No private customer data. No unsupported claims.",
              humanApprovalRequired: "Always true.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(SocialMediaDraft, "social_media_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("Social Media Content Agent did not return parsed drafts.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: socialAgentResult.data?.id ?? productMarketingAgentResult.data?.id ?? null,
      product_id: productId,
      input_json: {
        model,
        product_slug: productResult.data.slug,
        campaign_id: campaignId,
        channel_count: channels.length,
        content_goal: contentGoal,
        audience,
        recent_draft_count: recentDraftsResult.data?.length ?? 0,
        recent_support_signal_count: recentConversationsResult.data?.length ?? 0,
      },
      output_json: parsed,
      confidence: parsed.confidence,
      risk_level: parsed.riskLevel,
      human_required: true,
      status: "completed",
    })
    .select("id")
    .single<{ id: string }>();

  if (agentRunError) {
    throw new Error(agentRunError.message);
  }

  const channelByKey = new Map(channels.map((channel) => [channel.channel_key, channel]));
  const draftRows = parsed.drafts.map((draft) => {
    const channel = channelByKey.get(draft.channelKey) ?? channels[0] ?? null;

    return {
      product_id: productId,
      campaign_id: campaignId,
      channel_id: channel?.id ?? null,
      title: draft.title,
      content_body: draft.body,
      content_type: draft.contentType,
      status: "draft",
      created_by: userId,
      metadata_json: {
        created_from: "social_media_content_agent",
        agent_run_id: agentRun.id,
        campaign_angle: parsed.campaignAngle,
        target_audience: draft.targetAudience,
        call_to_action: draft.callToAction,
        human_review_notes: draft.humanReviewNotes,
        safety_notes: parsed.safetyNotes,
        human_approval_required: parsed.humanApprovalRequired,
        draft_only: true,
      },
    };
  });

  const { data: insertedDrafts, error: draftError } = await supabase
    .from("marketing_content_drafts")
    .insert(draftRows)
    .select("id, title")
    .returns<Array<{ id: string; title: string }>>();

  if (draftError) {
    throw new Error(draftError.message);
  }

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_social_media_content_drafts",
    input_json: {
      product_id: productId,
      campaign_id: campaignId,
      channel_ids: channelIds,
      content_goal: contentGoal,
    },
    output_json: {
      draft_count: insertedDrafts?.length ?? 0,
      draft_ids: (insertedDrafts ?? []).map((draft) => draft.id),
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "ai",
    event_type: "social_media_drafts_created",
    entity_type: "marketing_content_draft",
    entity_id: insertedDrafts?.[0]?.id ?? null,
    metadata_json: {
      agent_run_id: agentRun.id,
      draft_count: insertedDrafts?.length ?? 0,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
      campaign_id: campaignId,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "social_media_drafts_requested",
    entity_type: "marketing_content_draft",
    entity_id: insertedDrafts?.[0]?.id ?? null,
    metadata_json: {
      agent_run_id: agentRun.id,
      content_goal: contentGoal,
      channel_count: channels.length,
    },
  });

  revalidatePath("/marketing");
  revalidatePath("/agents");
}
