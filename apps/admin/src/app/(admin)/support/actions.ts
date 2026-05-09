"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

async function logAuditEvent(input: {
  productId?: string | null;
  actorId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, string | null>;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("audit_events").insert({
    product_id: input.productId ?? null,
    actor_type: "human",
    actor_id: input.actorId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata_json: input.metadata ?? {},
  });
}

const SupportTriageDraft = z.object({
  productSlug: z.string(),
  intent: z.string(),
  category: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  humanRequired: z.boolean(),
  recommendedStatus: z.enum(["open", "pending", "escalated", "closed"]),
  escalationReason: z.string(),
  draftReply: z.string(),
  internalSummary: z.string(),
});

function formatMessagesForPrompt(
  messages: Array<{
    sender_type: string;
    visibility: string;
    content: string;
    created_at: string;
  }>,
) {
  return messages
    .map(
      (message) =>
        `[${message.created_at}] ${message.sender_type}/${message.visibility}: ${message.content}`,
    )
    .join("\n\n");
}

export async function generateAiDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const conversationId = readString(formData, "conversationId");

  if (!conversationId) {
    throw new Error("Conversation is required.");
  }

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select(
      "id, product_id, subject, status, priority, channel, products(name, slug, risk_level), contact_profiles(name, email, phone, company_name)",
    )
    .eq("id", conversationId)
    .single<{
      id: string;
      product_id: string | null;
      subject: string | null;
      status: string;
      priority: string;
      channel: string;
      products: { name: string; slug: string; risk_level: string } | null;
      contact_profiles: {
        name: string | null;
        email: string | null;
        phone: string | null;
        company_name: string | null;
      } | null;
    }>();

  if (conversationError || !conversation) {
    throw new Error(conversationError?.message ?? "Conversation not found.");
  }

  const [
    messagesResult,
    profileResult,
    agentsResult,
    knowledgeSourcesResult,
  ] = await Promise.all([
    supabase
      .from("messages")
      .select("sender_type, visibility, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          sender_type: string;
          visibility: string;
          content: string;
          created_at: string;
        }>
      >(),
    conversation.product_id
      ? supabase
          .from("product_profiles")
          .select(
            "support_categories, restricted_actions, escalation_rules, metadata_json",
          )
          .eq("product_id", conversation.product_id)
          .single<{
            support_categories: string[];
            restricted_actions: string[];
            escalation_rules: string[];
            metadata_json: Record<string, unknown>;
          }>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Support Triage Agent")
      .maybeSingle<{ id: string }>(),
    supabase
      .from("knowledge_sources")
      .select(
        "id, product_id, source_title, source_type, version, knowledge_chunks(id, chunk_text)",
      )
      .eq("status", "approved")
      .or(
        conversation.product_id
          ? `product_id.eq.${conversation.product_id},product_id.is.null`
          : "product_id.is.null",
      )
      .order("updated_at", { ascending: false })
      .limit(8)
      .returns<
        Array<{
          id: string;
          product_id: string | null;
          source_title: string;
          source_type: string;
          version: string;
          knowledge_chunks: Array<{ id: string; chunk_text: string }>;
        }>
      >(),
  ]);

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  if (knowledgeSourcesResult.error) {
    throw new Error(knowledgeSourcesResult.error.message);
  }

  const profile = profileResult.data;
  const transcript = formatMessagesForPrompt(messagesResult.data ?? []);
  const model = getOpenAIModel();
  const approvedKnowledge = (knowledgeSourcesResult.data ?? []).flatMap(
    (source) =>
      source.knowledge_chunks.slice(0, 2).map((chunk) => ({
        sourceId: source.id,
        chunkId: chunk.id,
        title: source.source_title,
        type: source.source_type,
        version: source.version,
        scope: source.product_id ? "product" : "company",
        text: chunk.chunk_text.slice(0, 1800),
      })),
  );

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Support Triage Agent. Classify the conversation and draft a safe human-reviewed support reply. Do not make final legal, financial, certification, refund, claim, contract, religious, tax, or production decisions. If the case touches restricted actions or escalation rules, set humanRequired true and recommend escalated status.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            conversation: {
              subject: conversation.subject,
              status: conversation.status,
              priority: conversation.priority,
              channel: conversation.channel,
            },
            product: conversation.products,
            contact: conversation.contact_profiles,
            productProfile: profile,
            approvedKnowledge,
            transcript,
            outputInstructions: {
              draftReply:
                "Write a concise reply the human agent can review and send. If high risk, acknowledge, collect facts, and avoid final decisions.",
              internalSummary:
                "Summarize why you selected the category, risk, escalation decision, and whether approved knowledge was used. If no approved knowledge is relevant, say so.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(SupportTriageDraft, "support_triage_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("AI did not return a parsed support draft.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentsResult.data?.id ?? null,
      product_id: conversation.product_id,
      conversation_id: conversationId,
      input_json: {
        model,
        product_slug: conversation.products?.slug ?? null,
        message_count: messagesResult.data?.length ?? 0,
        approved_knowledge_count: approvedKnowledge.length,
      },
      output_json: parsed,
      confidence: parsed.confidence,
      risk_level: parsed.riskLevel,
      human_required: parsed.humanRequired,
      status: "completed",
    })
    .select("id")
    .single<{ id: string }>();

  if (agentRunError) {
    throw new Error(agentRunError.message);
  }

  const draftContent = [
    `AI draft (${parsed.riskLevel} risk, ${Math.round(parsed.confidence * 100)}% confidence)`,
    "",
    parsed.draftReply,
    "",
    `Internal summary: ${parsed.internalSummary}`,
    parsed.escalationReason
      ? `Escalation reason: ${parsed.escalationReason}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "ai",
    content: draftContent,
    visibility: "internal",
    metadata_json: {
      agent_run_id: agentRun.id,
      category: parsed.category,
      intent: parsed.intent,
      risk_level: parsed.riskLevel,
      human_required: parsed.humanRequired,
      recommended_status: parsed.recommendedStatus,
    },
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  await supabase
    .from("conversations")
    .update({
      ai_status: parsed.humanRequired ? "waiting_human" : "drafted",
      status:
        parsed.recommendedStatus === "escalated"
          ? "escalated"
          : conversation.status,
    })
    .eq("id", conversationId);

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "draft_support_reply",
    input_json: {
      conversation_id: conversationId,
      product_slug: conversation.products?.slug ?? null,
    },
    output_json: parsed,
    status: "completed",
  });

  if (approvedKnowledge.length > 0) {
    await supabase.from("knowledge_citations").insert(
      approvedKnowledge.map((item) => ({
        agent_run_id: agentRun.id,
        source_id: item.sourceId,
        chunk_id: item.chunkId,
        used_for: "support_triage_draft_context",
      })),
    );
  }

  await supabase.from("audit_events").insert({
    product_id: conversation.product_id,
    actor_type: "ai",
    event_type: "ai_draft_generated",
    entity_type: "conversation",
    entity_id: conversationId,
    metadata_json: {
      agent_run_id: agentRun.id,
      risk_level: parsed.riskLevel,
      category: parsed.category,
      human_required: parsed.humanRequired,
    },
  });

  await logAuditEvent({
    productId: conversation.product_id,
    actorId: userId,
    eventType: "ai_draft_requested",
    entityType: "conversation",
    entityId: conversationId,
  });

  revalidatePath("/support");
  redirect(`/support?conversation=${conversationId}`);
}

export async function createManualConversation(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const productId = readString(formData, "productId");
  const subject = readString(formData, "subject");
  const contactName = readString(formData, "contactName");
  const contactEmail = readString(formData, "contactEmail");
  const contactPhone = readString(formData, "contactPhone");
  const companyName = readString(formData, "companyName");
  const message = readString(formData, "message");
  const priority = readString(formData, "priority") || "normal";

  if (!productId || !subject || !message) {
    throw new Error("Product, subject, and message are required.");
  }

  const { data: contact, error: contactError } = await supabase
    .from("contact_profiles")
    .insert({
      external_id: contactEmail || contactPhone || contactName || null,
      name: contactName || null,
      email: contactEmail || null,
      phone: contactPhone || null,
      company_name: companyName || null,
      primary_product_id: productId,
    })
    .select("id")
    .single<{ id: string }>();

  if (contactError) {
    throw new Error(contactError.message);
  }

  const preview = message.slice(0, 160);
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      product_id: productId,
      channel: "manual",
      contact_profile_id: contact.id,
      status: "open",
      priority,
      assigned_to: userId,
      subject,
      last_message_preview: preview,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_type: "user",
    content: message,
    visibility: "external",
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  await logAuditEvent({
    productId,
    actorId: userId,
    eventType: "conversation_created",
    entityType: "conversation",
    entityId: conversation.id,
  });

  revalidatePath("/support");
  redirect(`/support?conversation=${conversation.id}`);
}

export async function addConversationMessage(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const conversationId = readString(formData, "conversationId");
  const productId = readString(formData, "productId") || null;
  const content = readString(formData, "content");
  const senderType = readString(formData, "senderType");
  const visibility = senderType === "note" ? "internal" : "external";

  if (!conversationId || !content) {
    throw new Error("Conversation and message are required.");
  }

  const normalizedSenderType = senderType === "note" ? "note" : "human";
  const { data: conversation } = await supabase
    .from("conversations")
    .select("metadata_json")
    .eq("id", conversationId)
    .maybeSingle<{ metadata_json: Record<string, unknown> | null }>();
  const connector =
    typeof conversation?.metadata_json?.connector === "string"
      ? conversation.metadata_json.connector
      : null;

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type: normalizedSenderType,
    sender_id: userId,
    content,
    visibility,
    metadata_json:
      normalizedSenderType === "human"
        ? {
            connector_outbox: true,
            connector,
            delivery_status: "pending",
          }
        : {
            internal_note: true,
          },
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  await supabase
    .from("conversations")
    .update({
      last_message_preview: content.slice(0, 160),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  await logAuditEvent({
    productId,
    actorId: userId,
    eventType: normalizedSenderType === "note" ? "internal_note_added" : "human_reply_added",
    entityType: "conversation",
    entityId: conversationId,
  });

  revalidatePath("/support");
  redirect(`/support?conversation=${conversationId}`);
}

export async function updateConversationStatus(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const conversationId = readString(formData, "conversationId");
  const productId = readString(formData, "productId") || null;
  const status = readString(formData, "status");

  if (!conversationId || !status) {
    throw new Error("Conversation and status are required.");
  }

  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }

  await logAuditEvent({
    productId,
    actorId: userId,
    eventType: "conversation_status_changed",
    entityType: "conversation",
    entityId: conversationId,
    metadata: { status },
  });

  revalidatePath("/support");
  redirect(`/support?conversation=${conversationId}`);
}

export async function assignConversationToSelf(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const conversationId = readString(formData, "conversationId");
  const productId = readString(formData, "productId") || null;

  if (!conversationId) {
    throw new Error("Conversation is required.");
  }

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_to: userId })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }

  await logAuditEvent({
    productId,
    actorId: userId,
    eventType: "conversation_assigned_to_self",
    entityType: "conversation",
    entityId: conversationId,
  });

  revalidatePath("/support");
  redirect(`/support?conversation=${conversationId}`);
}

export async function createTicketFromConversation(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();

  const conversationId = readString(formData, "conversationId");
  const productId = readString(formData, "productId");
  const category = readString(formData, "category") || "unknown";
  const priority = readString(formData, "priority") || "normal";
  const summary = readString(formData, "summary");

  if (!conversationId || !productId || !summary) {
    throw new Error("Conversation, product, and summary are required.");
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      conversation_id: conversationId,
      product_id: productId,
      category,
      priority,
      status: "open",
      assigned_to: userId,
      summary,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("ticket_events").insert({
    ticket_id: ticket.id,
    event_type: "ticket_created_from_conversation",
    actor_type: "human",
    actor_id: userId,
    metadata_json: { conversation_id: conversationId, category },
  });

  await logAuditEvent({
    productId,
    actorId: userId,
    eventType: "ticket_created",
    entityType: "ticket",
    entityId: ticket.id,
    metadata: { conversation_id: conversationId },
  });

  revalidatePath("/support");
  revalidatePath("/tickets");
  redirect(`/support?conversation=${conversationId}`);
}
