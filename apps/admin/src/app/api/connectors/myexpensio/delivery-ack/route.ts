import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DeliveryAckPayload = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  status: z.enum(["delivered", "failed"]),
  deliveredAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "deliveredAt must be an ISO timestamp.",
    })
    .optional(),
  externalDeliveryId: z.string().trim().max(180).optional(),
  errorMessage: z.string().trim().max(1000).optional(),
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

  const payloadResult = DeliveryAckPayload.safeParse(await request.json());

  if (!payloadResult.success) {
    return NextResponse.json(
      {
        error: "Invalid delivery acknowledgement payload.",
        details: payloadResult.error.message,
      },
      { status: 400 },
    );
  }

  const payload = payloadResult.data;

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

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, product_id, metadata_json")
    .eq("id", payload.conversationId)
    .eq("product_id", product.id)
    .eq("metadata_json->>connector", "myexpensio")
    .single<{
      id: string;
      product_id: string | null;
      metadata_json: Record<string, unknown> | null;
    }>();

  if (conversationError || !conversation) {
    return NextResponse.json(
      { error: conversationError?.message ?? "Conversation not found." },
      { status: 404 },
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_type, visibility, metadata_json")
    .eq("id", payload.messageId)
    .eq("conversation_id", conversation.id)
    .eq("sender_type", "human")
    .eq("visibility", "external")
    .single<{
      id: string;
      conversation_id: string;
      sender_type: string;
      visibility: string;
      metadata_json: Record<string, unknown> | null;
    }>();

  if (messageError || !message) {
    return NextResponse.json(
      { error: messageError?.message ?? "Human reply not found." },
      { status: 404 },
    );
  }

  const acknowledgedAt = new Date().toISOString();
  const deliveredAt =
    payload.status === "delivered"
      ? payload.deliveredAt ?? acknowledgedAt
      : null;
  const metadata = {
    ...(message.metadata_json ?? {}),
    connector_outbox: true,
    connector: "myexpensio",
    delivery_status: payload.status,
    delivery_acknowledged_at: acknowledgedAt,
    delivered_at: deliveredAt,
    external_delivery_id: payload.externalDeliveryId ?? null,
    delivery_error:
      payload.status === "failed" ? payload.errorMessage ?? "failed" : null,
  };

  const { error: updateError } = await supabase
    .from("messages")
    .update({
      metadata_json: metadata,
      channel_message_id: payload.externalDeliveryId ?? null,
    })
    .eq("id", message.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("audit_events").insert({
    product_id: product.id,
    actor_type: "system",
    event_type: "connector_delivery_acknowledged",
    entity_type: "message",
    entity_id: message.id,
    metadata_json: {
      connector: "myexpensio",
      conversation_id: conversation.id,
      delivery_status: payload.status,
      external_delivery_id: payload.externalDeliveryId ?? null,
    },
  });

  return NextResponse.json({
    status: "acknowledged",
    connector: "myexpensio",
    conversationId: conversation.id,
    messageId: message.id,
    deliveryStatus: payload.status,
    deliveredAt,
    acknowledgedAt,
    externalDeliveryId: payload.externalDeliveryId ?? null,
  });
}
