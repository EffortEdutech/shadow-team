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

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type: normalizedSenderType,
    sender_id: userId,
    content,
    visibility,
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
