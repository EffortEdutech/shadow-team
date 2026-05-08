import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AgentRun, Conversation, Message, Product, Ticket } from "@/lib/types";

type ProductCount = {
  id: string;
  name: string;
  slug: string;
  conversations: number;
  tickets: number;
  agentRuns: number;
  approvedKnowledge: number;
};

type ConversationRow = Pick<
  Conversation,
  "id" | "subject" | "status" | "priority" | "last_message_at" | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type AgentRunRow = Pick<
  AgentRun,
  "id" | "risk_level" | "confidence" | "human_required" | "status" | "created_at" | "output_json"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function percent(value: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function statusTone(status: string) {
  if (status === "open" || status === "completed" || status === "approved") {
    return "success";
  }
  if (status === "pending" || status === "draft") return "warning";
  if (status === "escalated" || status === "failed") return "danger";
  return "neutral";
}

function riskTone(risk: string) {
  if (risk === "high" || risk === "critical") return "danger";
  if (risk === "medium") return "warning";
  return "success";
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
    </section>
  );
}

function SimpleBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{label}</span>
              <span className="font-mono text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [
    productsResult,
    conversationsResult,
    messagesResult,
    ticketsResult,
    agentRunsResult,
    knowledgeSourcesResult,
    citationsResult,
    recentEscalationsResult,
    recentAgentRunsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
      .order("priority", { ascending: true })
      .returns<Product[]>(),
    supabase
      .from("conversations")
      .select("id, product_id, status, priority, ai_status, created_at")
      .returns<Pick<Conversation, "id" | "product_id" | "status" | "priority" | "ai_status" | "created_at">[]>(),
    supabase
      .from("messages")
      .select("id, sender_type, visibility, created_at")
      .returns<Pick<Message, "id" | "sender_type" | "visibility" | "created_at">[]>(),
    supabase
      .from("tickets")
      .select("id, product_id, category, status, priority, created_at")
      .returns<Pick<Ticket, "id" | "product_id" | "category" | "status" | "priority" | "created_at">[]>(),
    supabase
      .from("agent_runs")
      .select("id, product_id, confidence, risk_level, human_required, status, created_at")
      .returns<Pick<AgentRun, "id" | "product_id" | "confidence" | "risk_level" | "human_required" | "status" | "created_at">[]>(),
    supabase
      .from("knowledge_sources")
      .select("id, product_id, status, source_type, created_at")
      .returns<Array<{ id: string; product_id: string | null; status: string; source_type: string; created_at: string }>>(),
    supabase
      .from("knowledge_citations")
      .select("id, agent_run_id, source_id, created_at")
      .returns<Array<{ id: string; agent_run_id: string; source_id: string | null; created_at: string }>>(),
    supabase
      .from("conversations")
      .select("id, subject, status, priority, last_message_at, created_at, products(name, slug)")
      .in("status", ["escalated", "open"])
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(8)
      .returns<ConversationRow[]>(),
    supabase
      .from("agent_runs")
      .select("id, risk_level, confidence, human_required, status, output_json, created_at, products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<AgentRunRow[]>(),
  ]);

  const loadError =
    productsResult.error ??
    conversationsResult.error ??
    messagesResult.error ??
    ticketsResult.error ??
    agentRunsResult.error ??
    knowledgeSourcesResult.error ??
    citationsResult.error ??
    recentEscalationsResult.error ??
    recentAgentRunsResult.error;

  if (loadError) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Live support, AI, and knowledge performance from operational tables."
        />
        <StateCard
          title="Unable to load analytics"
          description={loadError.message}
          tone="danger"
        />
      </>
    );
  }

  const products = productsResult.data ?? [];
  const conversations = conversationsResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const tickets = ticketsResult.data ?? [];
  const agentRuns = agentRunsResult.data ?? [];
  const knowledgeSources = knowledgeSourcesResult.data ?? [];
  const citations = citationsResult.data ?? [];
  const recentEscalations = recentEscalationsResult.data ?? [];
  const recentAgentRuns = recentAgentRunsResult.data ?? [];

  const conversationStatus = countBy(conversations.map((item) => item.status));
  const ticketStatus = countBy(tickets.map((item) => item.status));
  const messageSender = countBy(messages.map((item) => item.sender_type));
  const ticketCategory = countBy(tickets.map((item) => item.category));
  const aiRisk = countBy(agentRuns.map((item) => item.risk_level));
  const knowledgeStatus = countBy(knowledgeSources.map((item) => item.status));

  const averageConfidence =
    agentRuns.length === 0
      ? 0
      : agentRuns.reduce((sum, run) => sum + Number(run.confidence ?? 0), 0) /
        agentRuns.length;

  const humanRequiredCount = agentRuns.filter((run) => run.human_required).length;
  const knowledgeGroundedRuns = new Set(citations.map((item) => item.agent_run_id))
    .size;

  const productCounts: ProductCount[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    conversations: conversations.filter((item) => item.product_id === product.id)
      .length,
    tickets: tickets.filter((item) => item.product_id === product.id).length,
    agentRuns: agentRuns.filter((item) => item.product_id === product.id).length,
    approvedKnowledge: knowledgeSources.filter(
      (item) => item.product_id === product.id && item.status === "approved",
    ).length,
  }));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Live management dashboard for support volume, AI triage, tickets, and knowledge usage."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Conversations"
          value={conversations.length}
          helper={`${conversationStatus.open ?? 0} open, ${conversationStatus.escalated ?? 0} escalated`}
        />
        <StatCard
          label="Tickets"
          value={tickets.length}
          helper={`${ticketStatus.open ?? 0} open`}
        />
        <StatCard
          label="AI Draft Runs"
          value={agentRuns.length}
          helper={`${percent(humanRequiredCount, agentRuns.length)} human required`}
        />
        <StatCard
          label="Knowledge Grounded Runs"
          value={knowledgeGroundedRuns}
          helper={`${citations.length} citations`}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Human Replies" value={messageSender.human ?? 0} />
        <StatCard label="Internal Notes" value={messageSender.note ?? 0} />
        <StatCard label="AI Messages" value={messageSender.ai ?? 0} />
        <StatCard
          label="Avg AI Confidence"
          value={`${Math.round(averageConfidence * 100)}%`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <SimpleBreakdown
          title="Conversation Status"
          rows={Object.entries(conversationStatus)}
        />
        <SimpleBreakdown title="Ticket Categories" rows={Object.entries(ticketCategory)} />
        <SimpleBreakdown title="AI Risk Levels" rows={Object.entries(aiRisk)} />
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
        <div className="border-b border-border bg-panel-strong px-5 py-4">
          <h2 className="text-base font-semibold">Product Health</h2>
          <p className="mt-1 text-sm text-muted">
            Support, ticket, AI, and approved knowledge coverage by product.
          </p>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Conversations</th>
              <th className="px-4 py-3 font-semibold">Tickets</th>
              <th className="px-4 py-3 font-semibold">AI Runs</th>
              <th className="px-4 py-3 font-semibold">Approved Knowledge</th>
            </tr>
          </thead>
          <tbody>
            {productCounts.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-4">
                  <Link
                    className="font-medium text-accent-strong underline-offset-4 hover:underline"
                    href={`/products/${product.slug}`}
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {product.slug}
                  </p>
                </td>
                <td className="px-4 py-4 font-mono">{product.conversations}</td>
                <td className="px-4 py-4 font-mono">{product.tickets}</td>
                <td className="px-4 py-4 font-mono">{product.agentRuns}</td>
                <td className="px-4 py-4 font-mono">
                  {product.approvedKnowledge}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Recent Escalations</h2>
          </div>
          {recentEscalations.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No active escalations"
                description="Escalated or open conversations will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentEscalations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/support?conversation=${conversation.id}`}
                  className="block p-4 hover:bg-panel-strong"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(conversation.status)}>
                      {conversation.status}
                    </Badge>
                    <Badge tone={conversation.priority === "high" || conversation.priority === "urgent" ? "danger" : "neutral"}>
                      {conversation.priority}
                    </Badge>
                    <Badge>{conversation.products?.slug ?? "unknown"}</Badge>
                  </div>
                  <p className="mt-3 font-medium">
                    {conversation.subject ?? "Untitled conversation"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(conversation.last_message_at ?? conversation.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Recent AI Runs</h2>
          </div>
          {recentAgentRuns.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No AI runs"
                description="Generate AI drafts from Support Inbox to populate this panel."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentAgentRuns.map((run) => (
                <div key={run.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{run.products?.slug ?? "unknown"}</Badge>
                    <Badge tone={riskTone(run.risk_level)}>{run.risk_level}</Badge>
                    <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                    <Badge>
                      {run.confidence === null
                        ? "confidence n/a"
                        : `${Math.round(run.confidence * 100)}%`}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {run.human_required ? "Human review required" : "Human review"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(run.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SimpleBreakdown
          title="Knowledge Status"
          rows={Object.entries(knowledgeStatus)}
        />
        <StatCard
          label="Approved Knowledge Sources"
          value={knowledgeStatus.approved ?? 0}
          helper="Used by AI draft grounding when product/company scope matches"
        />
      </div>
    </>
  );
}
