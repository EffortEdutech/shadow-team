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

const KnowledgeCuratorDraft = z.object({
  title: z.string().min(1).max(180),
  sourceType: z.enum(["faq", "sop", "policy", "user_guide", "knowledge_gap"]),
  problemSummary: z.string().min(1),
  draftKnowledge: z.string().min(1),
  suggestedStatus: z.enum(["draft"]),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
  sourceReasoning: z.string().min(1),
});

function formatConversationSignals(
  conversations: Array<{
    subject: string | null;
    status: string;
    priority: string;
    products: { slug: string } | null;
    messages: Array<{
      sender_type: string;
      visibility: string;
      content: string;
      created_at: string;
    }>;
  }>,
) {
  return conversations
    .map((conversation) => {
      const messages = conversation.messages
        .map(
          (message) =>
            `[${message.created_at}] ${message.sender_type}/${message.visibility}: ${message.content.slice(0, 900)}`,
        )
        .join("\n");

      return [
        `Product: ${conversation.products?.slug ?? "unknown"}`,
        `Subject: ${conversation.subject ?? "Untitled"}`,
        `Status/Priority: ${conversation.status}/${conversation.priority}`,
        messages,
      ].join("\n");
    })
    .join("\n\n---\n\n");
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

export async function generateKnowledgeCuratorDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const productId = readString(formData, "productId") || null;
  const focus = readString(formData, "focus") || "repeated support issues";

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    productResult,
    conversationsResult,
    knowledgeResult,
    agentResult,
  ] = await Promise.all([
    productId
      ? supabase
          .from("products")
          .select("id, name, slug, risk_level")
          .eq("id", productId)
          .single<{
            id: string;
            name: string;
            slug: string;
            risk_level: string;
          }>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("conversations")
      .select(
        "subject, status, priority, products(slug), messages(sender_type, visibility, content, created_at)",
      )
      .match(productId ? { product_id: productId } : {})
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(12)
      .returns<
        Array<{
          subject: string | null;
          status: string;
          priority: string;
          products: { slug: string } | null;
          messages: Array<{
            sender_type: string;
            visibility: string;
            content: string;
            created_at: string;
          }>;
        }>
      >(),
    supabase
      .from("knowledge_sources")
      .select("source_title, source_type, status")
      .or(productId ? `product_id.eq.${productId},product_id.is.null` : "product_id.is.null")
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<Array<{ source_title: string; source_type: string; status: string }>>(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Knowledge Curator Agent")
      .maybeSingle<{ id: string }>(),
  ]);

  if (productResult.error) {
    throw new Error(productResult.error.message);
  }

  if (conversationsResult.error) {
    throw new Error(conversationsResult.error.message);
  }

  if (knowledgeResult.error) {
    throw new Error(knowledgeResult.error.message);
  }

  const product = productResult.data;
  const conversations = conversationsResult.data ?? [];
  const existingKnowledge = knowledgeResult.data ?? [];
  const conversationSignals = formatConversationSignals(conversations);
  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Knowledge Curator Agent. Your job is to propose draft knowledge entries from repeated support signals. Never approve or publish knowledge. Avoid legal, financial, religious, tax, certification, contract, refund, or claim decisions. If the topic is sensitive, create a draft that explains what facts to collect and when to escalate.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            focus,
            product,
            existingKnowledge,
            recentConversationSignals: conversationSignals,
            outputRules: {
              title: "Write a short title for a draft knowledge source.",
              draftKnowledge:
                "Write a clear draft FAQ/SOP/knowledge-gap note for human review. Include safe wording and escalation boundaries.",
              suggestedStatus: "Always return draft.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(
        KnowledgeCuratorDraft,
        "knowledge_curator_draft",
      ),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("Knowledge Curator Agent did not return a parsed draft.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentResult.data?.id ?? null,
      product_id: productId,
      input_json: {
        model,
        focus,
        product_slug: product?.slug ?? null,
        conversation_count: conversations.length,
        existing_knowledge_count: existingKnowledge.length,
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

  const sourceText = [
    `Problem summary: ${parsed.problemSummary}`,
    "",
    parsed.draftKnowledge,
    "",
    `Curator reasoning: ${parsed.sourceReasoning}`,
    "Status: draft only. Human approval required before use as approved knowledge.",
  ].join("\n");

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .insert({
      product_id: productId,
      source_type: parsed.sourceType,
      source_title: parsed.title,
      source_path: null,
      status: "draft",
      version: "v0.1",
      metadata_json: {
        created_from: "knowledge_curator_agent",
        agent_run_id: agentRun.id,
        focus,
        human_approval_required: parsed.humanApprovalRequired,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert({
    source_id: source.id,
    chunk_text: sourceText,
    metadata_json: {
      chunk_type: "agent_draft",
      agent_run_id: agentRun.id,
    },
  });

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_draft_knowledge_source",
    input_json: {
      focus,
      product_id: productId,
      conversation_count: conversations.length,
    },
    output_json: {
      knowledge_source_id: source.id,
      title: parsed.title,
      source_type: parsed.sourceType,
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "ai",
    event_type: "knowledge_curator_draft_created",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "knowledge_curator_requested",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      focus,
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
