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

const OutboxQuery = z
  .object({
    conversationId: z.string().uuid().optional(),
    externalConversationId: z.string().trim().min(1).optional(),
    since: z
      .preprocess(
        (value) =>
          typeof value === "string" && value.trim() === "" ? undefined : value,
        z
          .string()
          .trim()
          .refine((value) => !Number.isNaN(Date.parse(value)), {
            message:
              "since must be an ISO timestamp. URL-encode cursor values before sending them.",
          })
          .optional(),
      )
      .optional(),
  })
  .refine((query) => query.conversationId || query.externalConversationId, {
    message: "conversationId or externalConversationId is required.",
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
      outboxUrl: `/api/connectors/myexpensio/conversations?conversationId=${conversation.id}`,
      status: "created",
    },
    { status: 201 },
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hasOutboxQuery =
    searchParams.has("conversationId") ||
    searchParams.has("externalConversationId");

  if (!hasOutboxQuery) {
    return NextResponse.json({
      connector: "myexpensio",
      status: "ready",
      outbox:
        "Use ?conversationId=<uuid> or ?externalConversationId=<id> with connector authentication to pull human replies.",
    });
  }

  if (!verifyConnectorSecret(request)) {
    return unauthorized();
  }

  const queryResult = OutboxQuery.safeParse({
    conversationId: searchParams.get("conversationId") ?? undefined,
    externalConversationId:
      searchParams.get("externalConversationId") ?? undefined,
    since: searchParams.get("since") ?? undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        error: "Invalid outbox query.",
        details: queryResult.error.message,
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 500 },
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

  let conversationQuery = supabase
    .from("conversations")
    .select(
      "id, product_id, status, priority, ai_status, subject, last_message_at, updated_at, metadata_json",
    )
    .eq("product_id", product.id)
    .eq("metadata_json->>connector", "myexpensio")
    .limit(1);

  if (queryResult.data.conversationId) {
    conversationQuery = conversationQuery.eq(
      "id",
      queryResult.data.conversationId,
    );
  } else if (queryResult.data.externalConversationId) {
    conversationQuery = conversationQuery.eq(
      "metadata_json->>external_conversation_id",
      queryResult.data.externalConversationId,
    );
  }

  const { data: conversations, error: conversationError } =
    await conversationQuery.returns<
      Array<{
        id: string;
        status: string;
        priority: string;
        ai_status: string;
        subject: string | null;
        last_message_at: string | null;
        updated_at: string | null;
        metadata_json: Record<string, unknown> | null;
      }>
    >();

  if (conversationError) {
    return NextResponse.json(
      { error: conversationError.message },
      { status: 500 },
    );
  }

  const conversation = conversations?.[0];

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  let messagesQuery = supabase
    .from("messages")
    .select("id, content, created_at, channel_message_id")
    .eq("conversation_id", conversation.id)
    .eq("sender_type", "human")
    .eq("visibility", "external")
    .order("created_at", { ascending: true });

  if (queryResult.data.since) {
    messagesQuery = messagesQuery.gt("created_at", queryResult.data.since);
  }

  const { data: messages, error: messagesError } =
    await messagesQuery.returns<
      Array<{
        id: string;
        content: string;
        created_at: string;
        channel_message_id: string | null;
      }>
    >();

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  const externalConversationId =
    typeof conversation.metadata_json?.external_conversation_id === "string"
      ? conversation.metadata_json.external_conversation_id
      : queryResult.data.externalConversationId ?? null;

  const safeMessages = (messages ?? []).map((message) => ({
    id: message.id,
    type: "human_reply",
    content: message.content,
    createdAt: message.created_at,
    cursor: message.created_at,
    channelMessageId: message.channel_message_id,
  }));

  return NextResponse.json({
    connector: "myexpensio",
    conversationId: conversation.id,
    externalConversationId,
    status: conversation.status,
    priority: conversation.priority,
    aiStatus: conversation.ai_status,
    subject: conversation.subject,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    messages: safeMessages,
    nextCursor: safeMessages.at(-1)?.cursor ?? queryResult.data.since ?? null,
  });
}

export async function HEAD() {
  return NextResponse.json({
    connector: "myexpensio",
    status: "ready",
  });
}
