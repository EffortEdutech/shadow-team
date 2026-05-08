import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContactProfile,
  AgentRun,
  Conversation,
  Message,
  Product,
  ProductProfile,
  Ticket,
} from "@/lib/types";
import {
  addConversationMessage,
  assignConversationToSelf,
  createManualConversation,
  createTicketFromConversation,
  generateAiDraft,
  updateConversationStatus,
} from "./actions";

type ConversationRow = Conversation & {
  products: Pick<Product, "name" | "slug" | "risk_level"> | null;
  contact_profiles: ContactProfile | null;
};

function formatDate(value: string | null) {
  if (!value) return "No activity";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: Conversation["status"] | Ticket["status"]) {
  if (status === "open") return "success";
  if (status === "pending") return "warning";
  if (status === "escalated") return "danger";
  return "neutral";
}

function priorityTone(priority: Conversation["priority"] | Ticket["priority"]) {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "normal") return "neutral";
  return "success";
}

function senderTone(senderType: Message["sender_type"]) {
  if (senderType === "ai") return "neutral";
  if (senderType === "human") return "success";
  if (senderType === "note") return "warning";
  return "neutral";
}

function contactLabel(contact: ContactProfile | null) {
  return contact?.name || contact?.email || contact?.phone || "Unknown contact";
}

function ConversationCreateForm({ products }: { products: Product[] }) {
  return (
    <details className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold">
        Create manual conversation
      </summary>
      <form action={createManualConversation} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Product
          </span>
          <select
            name="productId"
            required
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Subject
          </span>
          <input
            name="subject"
            required
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            placeholder="User needs help with onboarding"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Contact name
            </span>
            <input
              name="contactName"
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              placeholder="Customer name"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Email
            </span>
            <input
              name="contactEmail"
              type="email"
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              placeholder="user@example.com"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Phone
            </span>
            <input
              name="contactPhone"
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              placeholder="+60..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Company
            </span>
            <input
              name="companyName"
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              placeholder="Optional"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Priority
          </span>
          <select
            name="priority"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            defaultValue="normal"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            First message
          </span>
          <textarea
            name="message"
            required
            rows={4}
            className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
            placeholder="Paste or type the user's first message..."
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          Create conversation
        </button>
      </form>
    </details>
  );
}

function MessageComposer({
  conversation,
}: {
  conversation: ConversationRow;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <form action={addConversationMessage} className="space-y-3">
        <input type="hidden" name="conversationId" value={conversation.id} />
        <input
          type="hidden"
          name="productId"
          value={conversation.product_id ?? ""}
        />
        <input type="hidden" name="senderType" value="human" />
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Reply as human</span>
          <textarea
            name="content"
            required
            rows={4}
            className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
            placeholder="Write a reply..."
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          Add reply
        </button>
      </form>

      <form action={addConversationMessage} className="mt-4 space-y-3">
        <input type="hidden" name="conversationId" value={conversation.id} />
        <input
          type="hidden"
          name="productId"
          value={conversation.product_id ?? ""}
        />
        <input type="hidden" name="senderType" value="note" />
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Internal note</span>
          <textarea
            name="content"
            required
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
            placeholder="Add context for the team..."
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
        >
          Add note
        </button>
      </form>
    </section>
  );
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation: selectedConversationId } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [productsResult, conversationsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
      .order("priority", { ascending: true })
      .returns<Product[]>(),
    supabase
      .from("conversations")
      .select(
        "id, product_id, channel, contact_profile_id, status, priority, assigned_to, ai_status, subject, last_message_preview, created_at, updated_at, last_message_at, products(name, slug, risk_level), contact_profiles(id, external_id, name, email, phone, company_name)",
      )
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<ConversationRow[]>(),
  ]);

  const products = productsResult.data ?? [];
  const conversations = conversationsResult.data ?? [];
  const activeConversation =
    conversations.find((item) => item.id === selectedConversationId) ??
    conversations[0] ??
    null;

  const [messagesResult, ticketsResult, profileResult, agentRunsResult] = activeConversation
    ? await Promise.all([
        supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_type, sender_id, content, visibility, created_at",
          )
          .eq("conversation_id", activeConversation.id)
          .order("created_at", { ascending: true })
          .returns<Message[]>(),
        supabase
          .from("tickets")
          .select(
            "id, conversation_id, product_id, category, status, priority, assigned_to, summary, created_at",
          )
          .eq("conversation_id", activeConversation.id)
          .order("created_at", { ascending: false })
          .returns<Ticket[]>(),
        activeConversation.product_id
          ? supabase
              .from("product_profiles")
              .select(
                "product_id, target_users, support_categories, restricted_actions, escalation_rules, billing_model, metadata_json",
              )
              .eq("product_id", activeConversation.product_id)
              .single<ProductProfile>()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("agent_runs")
          .select(
            "id, product_id, conversation_id, confidence, risk_level, human_required, status, output_json, created_at",
          )
          .eq("conversation_id", activeConversation.id)
          .order("created_at", { ascending: false })
          .limit(5)
          .returns<AgentRun[]>(),
      ])
    : [
        { data: [] as Message[], error: null },
        { data: [] as Ticket[], error: null },
        { data: null as ProductProfile | null, error: null },
        { data: [] as AgentRun[], error: null },
      ];

  const messages = messagesResult.data ?? [];
  const tickets = ticketsResult.data ?? [];
  const profile = profileResult.data;
  const agentRuns = agentRunsResult.data ?? [];
  const latestAgentRun = agentRuns[0] ?? null;

  return (
    <>
      <PageHeader
        title="Support Inbox"
        description="Manual support control center for conversations, human replies, internal notes, status, and ticket creation."
      />

      {conversationsResult.error ? (
        <StateCard
          title="Unable to load conversations"
          description={conversationsResult.error.message}
          tone="danger"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ConversationCreateForm products={products} />

          <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
            <div className="border-b border-border bg-panel-strong px-4 py-3">
              <h2 className="text-sm font-semibold">Conversations</h2>
            </div>
            {conversations.length === 0 ? (
              <div className="p-4">
                <StateCard
                  title="No conversations yet"
                  description="Create a manual conversation to start testing the support workflow."
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conversation) => {
                  const active = conversation.id === activeConversation?.id;

                  return (
                    <Link
                      key={conversation.id}
                      href={`/support?conversation=${conversation.id}`}
                      className={`block p-4 transition ${
                        active
                          ? "bg-accent/10"
                          : "hover:bg-panel-strong"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {conversation.subject ?? "Untitled conversation"}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {contactLabel(conversation.contact_profiles)}
                          </p>
                        </div>
                        <Badge tone={statusTone(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">
                        {conversation.last_message_preview ?? "No messages"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{conversation.products?.slug ?? "unknown"}</Badge>
                        <Badge tone={priorityTone(conversation.priority)}>
                          {conversation.priority}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted">
                        {formatDate(conversation.last_message_at)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="min-h-[640px] rounded-lg border border-border bg-panel shadow-sm">
          {activeConversation ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {activeConversation.subject}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {activeConversation.products?.name ?? "Unknown product"} -
                      {activeConversation.channel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(activeConversation.status)}>
                      {activeConversation.status}
                    </Badge>
                    <Badge tone={priorityTone(activeConversation.priority)}>
                      {activeConversation.priority}
                    </Badge>
                    <Badge>{activeConversation.ai_status}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 p-5">
                {messages.length === 0 ? (
                  <StateCard
                    title="No messages"
                    description="This conversation has no message records yet."
                  />
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`rounded-lg border p-4 ${
                        message.sender_type === "human"
                          ? "ml-auto max-w-[85%] border-accent/25 bg-accent/5"
                          : message.sender_type === "note"
                            ? "border-warning/25 bg-warning/5"
                            : "mr-auto max-w-[85%] border-border bg-panel-strong"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge tone={senderTone(message.sender_type)}>
                          {message.sender_type}
                        </Badge>
                        <span className="text-xs text-muted">
                          {message.visibility}
                        </span>
                        <span className="text-xs text-muted">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <div className="border-t border-border p-5">
                <MessageComposer conversation={activeConversation} />
              </div>
            </div>
          ) : (
            <div className="p-5">
              <StateCard
                title="Select or create a conversation"
                description="The message thread and composer will appear here."
              />
            </div>
          )}
        </section>

        <div className="space-y-4">
          {activeConversation ? (
            <>
              <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
                <div className="mb-5 rounded-md border border-accent/20 bg-accent/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold">AI Triage</h2>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        Generate a draft classification and reply. Human review
                        is still required before sending.
                      </p>
                    </div>
                    <form action={generateAiDraft}>
                      <input
                        type="hidden"
                        name="conversationId"
                        value={activeConversation.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
                      >
                        Generate AI draft
                      </button>
                    </form>
                  </div>

                  {latestAgentRun ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone={statusTone(latestAgentRun.status === "completed" ? "open" : "pending")}>
                        {latestAgentRun.status}
                      </Badge>
                      <Badge tone={priorityTone(latestAgentRun.risk_level === "critical" ? "urgent" : latestAgentRun.risk_level === "high" ? "high" : "normal")}>
                        {latestAgentRun.risk_level}
                      </Badge>
                      <Badge>
                        {latestAgentRun.confidence === null
                          ? "confidence n/a"
                          : `${Math.round(latestAgentRun.confidence * 100)}% confidence`}
                      </Badge>
                      <Badge>
                        {latestAgentRun.human_required
                          ? "human required"
                          : "human review"}
                      </Badge>
                    </div>
                  ) : null}
                </div>

                <h2 className="text-base font-semibold">Contact</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted">Name</p>
                    <p>{contactLabel(activeConversation.contact_profiles)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">Email</p>
                    <p className="break-all font-mono text-xs">
                      {activeConversation.contact_profiles?.email ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">Phone</p>
                    <p className="font-mono text-xs">
                      {activeConversation.contact_profiles?.phone ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">Company</p>
                    <p>{activeConversation.contact_profiles?.company_name ?? "-"}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
                <h2 className="text-base font-semibold">Workflow</h2>
                <div className="mt-4 grid gap-3">
                  <form action={updateConversationStatus} className="space-y-2">
                    <input
                      type="hidden"
                      name="conversationId"
                      value={activeConversation.id}
                    />
                    <input
                      type="hidden"
                      name="productId"
                      value={activeConversation.product_id ?? ""}
                    />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Status
                      </span>
                      <select
                        name="status"
                        defaultValue={activeConversation.status}
                        className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="escalated">Escalated</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-white px-3 text-sm font-semibold hover:border-accent hover:text-accent"
                    >
                      Update status
                    </button>
                  </form>

                  <form action={assignConversationToSelf}>
                    <input
                      type="hidden"
                      name="conversationId"
                      value={activeConversation.id}
                    />
                    <input
                      type="hidden"
                      name="productId"
                      value={activeConversation.product_id ?? ""}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-white px-3 text-sm font-semibold hover:border-accent hover:text-accent"
                    >
                      Assign to me
                    </button>
                  </form>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
                <h2 className="text-base font-semibold">Create Ticket</h2>
                <form action={createTicketFromConversation} className="mt-4 space-y-3">
                  <input
                    type="hidden"
                    name="conversationId"
                    value={activeConversation.id}
                  />
                  <input
                    type="hidden"
                    name="productId"
                    value={activeConversation.product_id ?? ""}
                  />
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Category
                    </span>
                    <select
                      name="category"
                      className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                      defaultValue="unknown"
                    >
                      <option value="unknown">unknown</option>
                      {profile?.support_categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Priority
                    </span>
                    <select
                      name="priority"
                      className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                      defaultValue={activeConversation.priority}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Summary
                    </span>
                    <textarea
                      name="summary"
                      required
                      rows={3}
                      className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                      defaultValue={activeConversation.subject ?? ""}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!activeConversation.product_id}
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create ticket
                  </button>
                </form>

                <div className="mt-4 space-y-2">
                  {tickets.length === 0 ? (
                    <p className="text-sm text-muted">No tickets yet.</p>
                  ) : (
                    tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-md border border-border bg-panel-strong p-3"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={statusTone(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge tone={priorityTone(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge>{ticket.category}</Badge>
                        </div>
                        <p className="mt-2 text-sm">{ticket.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
                <h2 className="text-base font-semibold">Product Guardrails</h2>
                {profile ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted">
                        Restricted Actions
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.restricted_actions.map((item) => (
                          <Badge key={item} tone="danger">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted">
                        Escalation Rules
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.escalation_rules.map((item) => (
                          <Badge key={item} tone="warning">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Product profile not found.
                  </p>
                )}
              </section>
            </>
          ) : (
            <StateCard
              title="No active conversation"
              description="Select a conversation to see contact details and workflow actions."
            />
          )}
        </div>
      </div>
    </>
  );
}
