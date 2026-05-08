import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ConnectorPayload = z.object({
  externalConversationId: z.string().trim().optional(),
  subject: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(8000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  channel: z.enum(["web", "app", "api", "other"]).default("app"),
  contact: z.object({
    externalId: z.string().trim().optional(),
    name: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
  }),
  context: z
    .object({
      userId: z.string().trim().optional(),
      claimId: z.string().trim().optional(),
      page: z.string().trim().optional(),
      plan: z.string().trim().optional(),
      sourceUrl: z.string().trim().optional(),
    })
    .catchall(z.string().or(z.number()).or(z.boolean()).or(z.null()))
    .optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function verifyConnectorSecret(request: NextRequest) {
  const expectedSecret = process.env.MYEXPENSIO_CONNECTOR_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const token =
    getBearerToken(request) ?? request.headers.get("x-shadow-team-secret");

  return token === expectedSecret;
}

export async function POST(request: NextRequest) {
  if (!verifyConnectorSecret(request)) {
    return unauthorized();
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 500 },
    );
  }

  let payload: z.infer<typeof ConnectorPayload>;

  try {
    payload = ConnectorPayload.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid connector payload.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", "myexpensio")
    .single<{ id: string }>();

  if (productError || !product) {
    return NextResponse.json(
      { error: productError?.message ?? "MyExpensio product not found." },
      { status: 500 },
    );
  }

  const contactExternalId =
    payload.contact.externalId ??
    payload.context?.userId?.toString() ??
    payload.contact.email ??
    payload.contact.phone ??
    null;

  const { data: existingContact } = contactExternalId
    ? await supabase
        .from("contact_profiles")
        .select("id")
        .eq("external_id", contactExternalId)
        .maybeSingle<{ id: string }>()
    : { data: null };

  const contactRecord = {
    external_id: contactExternalId,
    name: payload.contact.name ?? null,
    email: payload.contact.email ?? null,
    phone: payload.contact.phone ?? null,
    company_name: payload.contact.companyName ?? null,
    primary_product_id: product.id,
    metadata_json: {
      connector: "myexpensio",
      context: payload.context ?? {},
    },
  };

  const contactResult = existingContact
    ? await supabase
        .from("contact_profiles")
        .update(contactRecord)
        .eq("id", existingContact.id)
        .select("id")
        .single<{ id: string }>()
    : await supabase
        .from("contact_profiles")
        .insert(contactRecord)
        .select("id")
        .single<{ id: string }>();

  if (contactResult.error) {
    return NextResponse.json(
      { error: contactResult.error.message },
      { status: 500 },
    );
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      product_id: product.id,
      channel: payload.channel,
      contact_profile_id: contactResult.data.id,
      status: "open",
      priority: payload.priority,
      ai_status: "not_started",
      subject: payload.subject,
      last_message_preview: payload.message.slice(0, 160),
      last_message_at: new Date().toISOString(),
      metadata_json: {
        connector: "myexpensio",
        external_conversation_id: payload.externalConversationId ?? null,
        context: payload.context ?? {},
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (conversationError) {
    return NextResponse.json(
      { error: conversationError.message },
      { status: 500 },
    );
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_type: "user",
    content: payload.message,
    visibility: "external",
    channel_message_id: payload.externalConversationId ?? null,
    metadata_json: {
      connector: "myexpensio",
      context: payload.context ?? {},
    },
  });

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  await supabase.from("audit_events").insert({
    product_id: product.id,
    actor_type: "system",
    event_type: "connector_conversation_created",
    entity_type: "conversation",
    entity_id: conversation.id,
    metadata_json: {
      connector: "myexpensio",
      external_conversation_id: payload.externalConversationId ?? null,
    },
  });

  return NextResponse.json(
    {
      conversationId: conversation.id,
      contactProfileId: contactResult.data.id,
      status: "created",
    },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json({
    connector: "myexpensio",
    status: "ready",
  });
}

