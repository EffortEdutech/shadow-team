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

function isMissingSalesTable(error: { message: string }) {
  return (
    (error.message.includes("sales_followups") ||
      error.message.includes("sales_followup_drafts")) &&
    error.message.includes("schema cache")
  );
}

const SalesFollowupDraftSchema = z.object({
  subject: z.string().min(1).max(160),
  body: z.string().min(1).max(3500),
  summary: z.string().min(1),
  leadTemperature: z.enum(["cold", "warm", "hot", "unknown"]),
  recommendedNextStep: z.string().min(1),
  safetyNotes: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
});

export async function createSalesFollowup(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const productId = readString(formData, "productId");
  const campaignId = readString(formData, "campaignId") || null;
  const contactName = readString(formData, "contactName");
  const contactEmail = readString(formData, "contactEmail");
  const companyName = readString(formData, "companyName");
  const leadSource = readString(formData, "leadSource");
  const productInterest = readString(formData, "productInterest");
  const priority = readString(formData, "priority") || "normal";
  const nextFollowUpOn = readString(formData, "nextFollowUpOn");
  const context = readString(formData, "context");

  if (!productId || !contactName || !productInterest) {
    throw new Error("Product, contact name, and product interest are required.");
  }

  const { data: followup, error } = await supabase
    .from("sales_followups")
    .insert({
      product_id: productId,
      campaign_id: campaignId,
      contact_name: contactName,
      contact_email: contactEmail || null,
      company_name: companyName || null,
      lead_source: leadSource || null,
      product_interest: productInterest,
      status: "new",
      priority,
      next_follow_up_on: nextFollowUpOn || null,
      owner_user_id: userId,
      metadata_json: {
        context,
        draft_only: true,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    if (isMissingSalesTable(error)) {
      throw new Error(
        "Sprint 23 sales follow-up tables are not ready yet. Run supabase/sprint_23_sales_followup_workflow.sql in Supabase SQL Editor, then refresh this page.",
      );
    }

    throw new Error(error.message);
  }

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "sales_followup_created",
    entity_type: "sales_followup",
    entity_id: followup.id,
    metadata_json: {
      campaign_id: campaignId,
      priority,
      lead_source: leadSource || null,
    },
  });

  revalidatePath("/marketing/follow-ups");
}

export async function generateSalesFollowupDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const followupId = readString(formData, "followupId");
  const notes = readString(formData, "notes");

  if (!followupId) {
    throw new Error("Follow-up is required.");
  }

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    followupResult,
    agentResult,
    recentDraftsResult,
    recentContentResult,
  ] = await Promise.all([
    supabase
      .from("sales_followups")
      .select(
        "id, product_id, campaign_id, contact_name, contact_email, company_name, lead_source, product_interest, status, priority, next_follow_up_on, metadata_json, products(name, slug, risk_level, first_ai_use_case), marketing_campaigns(name, objective, audience, status)",
      )
      .eq("id", followupId)
      .single<{
        id: string;
        product_id: string | null;
        campaign_id: string | null;
        contact_name: string;
        contact_email: string | null;
        company_name: string | null;
        lead_source: string | null;
        product_interest: string;
        status: string;
        priority: string;
        next_follow_up_on: string | null;
        metadata_json: Record<string, unknown>;
        products: {
          name: string;
          slug: string;
          risk_level: string;
          first_ai_use_case: string | null;
        } | null;
        marketing_campaigns: {
          name: string;
          objective: string;
          audience: string | null;
          status: string;
        } | null;
      }>(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Sales Follow-up Agent")
      .maybeSingle<{ id: string }>(),
    supabase
      .from("sales_followup_drafts")
      .select("subject, body, status, created_at")
      .eq("followup_id", followupId)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<
        Array<{
          subject: string;
          body: string;
          status: string;
          created_at: string;
        }>
      >(),
    supabase
      .from("marketing_content_drafts")
      .select("title, content_body, content_type, status, marketing_channels(channel_name)")
      .eq("product_id", readString(formData, "productId") || "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<
        Array<{
          title: string;
          content_body: string;
          content_type: string;
          status: string;
          marketing_channels: { channel_name: string } | null;
        }>
      >(),
  ]);

  for (const result of [
    followupResult,
    agentResult,
    recentDraftsResult,
    recentContentResult,
  ]) {
    if (result.error) {
      if (isMissingSalesTable(result.error)) {
        throw new Error(
          "Sprint 23 sales follow-up tables are not ready yet. Run supabase/sprint_23_sales_followup_workflow.sql in Supabase SQL Editor, then refresh this page.",
        );
      }

      throw new Error(result.error.message);
    }
  }

  if (!followupResult.data) {
    throw new Error("Follow-up not found.");
  }

  const followup = followupResult.data;
  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Sales Follow-up Agent. Draft concise sales follow-up messages for human review. Do not send emails, make pricing commitments, guarantee outcomes, offer discounts, claim refunds, or imply legal/financial advice. Use the provided product and campaign context only. If the product is high risk, keep the message careful and discovery-focused.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            followup,
            notes,
            recentFollowupDrafts: recentDraftsResult.data ?? [],
            recentMarketingContent: recentContentResult.data ?? [],
            outputRules: {
              subject: "Write an email-style subject line.",
              body: "Write a human-reviewed follow-up draft. Keep it helpful, direct, and non-pushy.",
              humanApprovalRequired: "Always true.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(SalesFollowupDraftSchema, "sales_followup_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("Sales Follow-up Agent did not return a parsed draft.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentResult.data?.id ?? null,
      product_id: followup.product_id,
      input_json: {
        model,
        followup_id: followup.id,
        product_slug: followup.products?.slug ?? null,
        campaign_name: followup.marketing_campaigns?.name ?? null,
        lead_source: followup.lead_source,
        product_interest: followup.product_interest,
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

  const { data: draft, error: draftError } = await supabase
    .from("sales_followup_drafts")
    .insert({
      followup_id: followup.id,
      product_id: followup.product_id,
      subject: parsed.subject,
      body: parsed.body,
      status: "draft",
      agent_run_id: agentRun.id,
      created_by: userId,
      metadata_json: {
        created_from: "sales_followup_agent",
        summary: parsed.summary,
        lead_temperature: parsed.leadTemperature,
        recommended_next_step: parsed.recommendedNextStep,
        safety_notes: parsed.safetyNotes,
        human_approval_required: parsed.humanApprovalRequired,
        draft_only: true,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (draftError) {
    throw new Error(draftError.message);
  }

  await supabase
    .from("sales_followups")
    .update({ status: "drafted" })
    .eq("id", followup.id);

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_sales_followup_draft",
    input_json: {
      followup_id: followup.id,
      notes,
    },
    output_json: {
      draft_id: draft.id,
      subject: parsed.subject,
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: followup.product_id,
    actor_type: "ai",
    event_type: "sales_followup_draft_created",
    entity_type: "sales_followup_draft",
    entity_id: draft.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      followup_id: followup.id,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: followup.product_id,
    actor_type: "human",
    actor_id: userId,
    event_type: "sales_followup_draft_requested",
    entity_type: "sales_followup",
    entity_id: followup.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      notes,
    },
  });

  revalidatePath("/marketing/follow-ups");
  revalidatePath("/agents");
}
