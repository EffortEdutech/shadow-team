import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Agent,
  AgentRun,
  Conversation,
  KnowledgeSource,
  Message,
  Product,
  Ticket,
  WorkItemReview,
} from "@/lib/types";

type ConversationBrief = Pick<
  Conversation,
  "id" | "subject" | "status" | "priority" | "last_message_at" | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type TicketBrief = Pick<
  Ticket,
  "id" | "summary" | "status" | "priority" | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type ApprovalBrief = Pick<
  KnowledgeSource,
  "id" | "source_title" | "source_type" | "status" | "metadata_json" | "updated_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type AgentRunBrief = Pick<
  AgentRun,
  "id" | "risk_level" | "confidence" | "human_required" | "status" | "created_at"
> & {
  agents: Pick<Agent, "name"> | null;
  products: Pick<Product, "name" | "slug"> | null;
};

type FailedDeliveryBrief = Pick<
  Message,
  "id" | "conversation_id" | "content" | "metadata_json" | "created_at"
> & {
  conversations: Pick<Conversation, "subject" | "priority" | "status"> | null;
};

const aiCreatedFrom = new Set([
  "knowledge_curator_agent",
  "qa_checklist_agent",
  "product_manager_agent",
  "management_report_agent",
  "release_readiness_agent",
]);

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function badgeTone(value: string) {
  if (
    value === "urgent" ||
    value === "high" ||
    value === "critical" ||
    value === "failed" ||
    value === "escalated"
  ) {
    return "danger";
  }

  if (value === "medium" || value === "draft" || value === "pending") {
    return "warning";
  }

  return "neutral";
}

function sourceLabel(value: string) {
  return value.replaceAll("_", " ");
}

function BriefMetric({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const toneClassName = {
    neutral: "border-border bg-panel",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-danger/30 bg-danger/5",
    success: "border-accent/30 bg-accent/5",
  }[tone];

  return (
    <Link
      href={href}
      className={`rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-panel-strong ${toneClassName}`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold">{value}</p>
    </Link>
  );
}

function BriefPanel({
  title,
  description,
  href,
  children,
}: {
  title: string;
  description: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-panel-strong px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-medium transition hover:bg-background"
        >
          Open
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="p-5">
      <StateCard title="Clear" description={message} />
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const since24Hours = new Date(now);
  since24Hours.setHours(since24Hours.getHours() - 24);
  const staleBefore = new Date(now);
  staleBefore.setHours(staleBefore.getHours() - 48);

  const [
    conversationsResult,
    staleConversationsResult,
    approvalsResult,
    releaseReadinessResult,
    failedDeliveriesResult,
    agentRunsResult,
    ticketsResult,
    todayRunsResult,
    productCountResult,
    reviewedTodayResult,
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select(
        "id, subject, status, priority, last_message_at, created_at, products(name, slug)",
      )
      .in("status", ["open", "escalated"])
      .in("priority", ["high", "urgent"])
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(5)
      .returns<ConversationBrief[]>(),
    supabase
      .from("conversations")
      .select(
        "id, subject, status, priority, last_message_at, created_at, products(name, slug)",
      )
      .in("status", ["open", "pending", "escalated"])
      .lt("last_message_at", staleBefore.toISOString())
      .order("last_message_at", { ascending: true, nullsFirst: false })
      .limit(5)
      .returns<ConversationBrief[]>(),
    supabase
      .from("knowledge_sources")
      .select(
        "id, source_title, source_type, status, metadata_json, updated_at, products(name, slug)",
      )
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<ApprovalBrief[]>(),
    supabase
      .from("knowledge_sources")
      .select(
        "id, source_title, source_type, status, metadata_json, updated_at, products(name, slug)",
      )
      .eq("source_type", "release_readiness")
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(5)
      .returns<ApprovalBrief[]>(),
    supabase
      .from("messages")
      .select(
        "id, conversation_id, content, metadata_json, created_at, conversations(subject, priority, status)",
      )
      .eq("sender_type", "human")
      .eq("visibility", "external")
      .eq("metadata_json->>delivery_status", "failed")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<FailedDeliveryBrief[]>(),
    supabase
      .from("agent_runs")
      .select(
        "id, risk_level, confidence, human_required, status, created_at, agents(name), products(name, slug)",
      )
      .eq("human_required", true)
      .in("risk_level", ["high", "critical"])
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<AgentRunBrief[]>(),
    supabase
      .from("tickets")
      .select("id, summary, status, priority, created_at, products(name, slug)")
      .in("status", ["open", "pending", "escalated"])
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<TicketBrief[]>(),
    supabase
      .from("agent_runs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24Hours.toISOString()),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("work_item_reviews")
      .select("*", { count: "exact", head: true })
      .eq("review_date", today)
      .returns<WorkItemReview[]>(),
  ]);

  const loadError =
    conversationsResult.error ??
    staleConversationsResult.error ??
    approvalsResult.error ??
    releaseReadinessResult.error ??
    failedDeliveriesResult.error ??
    agentRunsResult.error ??
    ticketsResult.error ??
    todayRunsResult.error ??
    productCountResult.error ??
    reviewedTodayResult.error;

  const approvals = (approvalsResult.data ?? []).filter((item) =>
    aiCreatedFrom.has(String(item.metadata_json.created_from ?? "")),
  );
  const highPriorityConversations = conversationsResult.data ?? [];
  const staleConversations = staleConversationsResult.data ?? [];
  const releaseReadiness = releaseReadinessResult.data ?? [];
  const failedDeliveries = failedDeliveriesResult.data ?? [];
  const highRiskRuns = agentRunsResult.data ?? [];
  const openTickets = ticketsResult.data ?? [];
  const totalAttentionCount =
    highPriorityConversations.length +
    staleConversations.length +
    approvals.length +
    releaseReadiness.length +
    failedDeliveries.length +
    highRiskRuns.length +
    openTickets.length;

  const topRisks = [
    failedDeliveries.length > 0
      ? {
          label: "Failed connector deliveries need acknowledgement or retry.",
          href: "/work-queue",
          tone: "danger" as const,
        }
      : null,
    releaseReadiness.length > 0
      ? {
          label: "Release readiness drafts are waiting for human decision.",
          href: "/approvals?status=draft",
          tone: "warning" as const,
        }
      : null,
    staleConversations.length > 0
      ? {
          label: "Some open conversations are older than 48 hours.",
          href: "/support",
          tone: "warning" as const,
        }
      : null,
    highRiskRuns.length > 0
      ? {
          label: "High-risk AI outputs require human review.",
          href: "/agents",
          tone: "danger" as const,
        }
      : null,
  ].filter(
    (
      risk,
    ): risk is {
      label: string;
      href: string;
      tone: "warning" | "danger";
    } => Boolean(risk),
  );

  return (
    <>
      <PageHeader
        title="Daily Brief"
        description="Operator dashboard for today's human attention, stale work, release gates, failed deliveries, and AI review."
      />

      {loadError ? (
        <StateCard
          title="Unable to load daily brief"
          description={loadError.message}
          tone="danger"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <BriefMetric
          label="Needs attention"
          value={totalAttentionCount}
          href="/work-queue"
          tone={totalAttentionCount > 0 ? "warning" : "success"}
        />
        <BriefMetric
          label="High-priority support"
          value={highPriorityConversations.length}
          href="/work-queue"
          tone={highPriorityConversations.length > 0 ? "danger" : "success"}
        />
        <BriefMetric
          label="Pending approvals"
          value={approvals.length}
          href="/approvals?status=draft"
          tone={approvals.length > 0 ? "warning" : "success"}
        />
        <BriefMetric
          label="AI runs last 24h"
          value={todayRunsResult.count ?? 0}
          href="/agents"
        />
        <BriefMetric
          label="Reviewed today"
          value={reviewedTodayResult.count ?? 0}
          href="/work-queue"
          tone={(reviewedTodayResult.count ?? 0) > 0 ? "success" : "neutral"}
        />
      </div>

      <section className="mt-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Morning Readout</h2>
            <p className="mt-1 text-sm text-muted">
              {productCountResult.count ?? 0} products monitored. Brief generated{" "}
              {formatDate(now.toISOString())}.{" "}
              {reviewedTodayResult.count ?? 0} work items reviewed today.
            </p>
          </div>
          <Badge tone={totalAttentionCount > 0 ? "warning" : "success"}>
            {totalAttentionCount > 0 ? "Review needed" : "Clear"}
          </Badge>
        </div>

        {topRisks.length === 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-accent/25 bg-accent/5 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 text-accent-strong" aria-hidden="true" />
            <div>
              <p className="font-medium">No urgent blockers found.</p>
              <p className="mt-1 text-muted">
                The daily brief is clear. Continue normal product monitoring.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {topRisks.map((risk) => (
              <Link
                key={risk.label}
                href={risk.href}
                className={`flex items-start gap-3 rounded-lg border p-4 text-sm transition hover:bg-panel-strong ${
                  risk.tone === "danger"
                    ? "border-danger/30 bg-danger/5"
                    : "border-warning/30 bg-warning/5"
                }`}
              >
                {risk.tone === "danger" ? (
                  <AlertTriangle className="mt-0.5 size-5 text-danger" aria-hidden="true" />
                ) : (
                  <Clock3 className="mt-0.5 size-5 text-warning" aria-hidden="true" />
                )}
                <span className="font-medium">{risk.label}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <BriefPanel
          title="Priority Support"
          description="High or urgent conversations currently open."
          href="/work-queue"
        >
          {highPriorityConversations.length === 0 ? (
            <EmptyPanel message="No high-priority support conversations right now." />
          ) : (
            highPriorityConversations.map((item) => (
              <Link
                key={item.id}
                href={`/support?conversation=${item.id}`}
                className="block px-5 py-4 hover:bg-panel-strong"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone={badgeTone(item.priority)}>{item.priority}</Badge>
                  <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">
                  {item.subject ?? "Untitled conversation"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Last activity {formatDate(item.last_message_at ?? item.created_at)}
                </p>
              </Link>
            ))
          )}
        </BriefPanel>

        <BriefPanel
          title="Approval Decisions"
          description="AI-created drafts waiting for a human decision."
          href="/approvals?status=draft"
        >
          {approvals.length === 0 ? (
            <EmptyPanel message="No AI-created drafts are waiting for approval." />
          ) : (
            approvals.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href="/approvals?status=draft"
                className="block px-5 py-4 hover:bg-panel-strong"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">{sourceLabel(item.source_type)}</Badge>
                  <Badge>{item.products?.slug ?? "company-wide"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{item.source_title}</p>
                <p className="mt-1 text-xs text-muted">
                  Updated {formatDate(item.updated_at)}
                </p>
              </Link>
            ))
          )}
        </BriefPanel>

        <BriefPanel
          title="Release Gate"
          description="Draft release readiness reports awaiting owner review."
          href="/approvals?status=draft"
        >
          {releaseReadiness.length === 0 ? (
            <EmptyPanel message="No release readiness drafts are waiting." />
          ) : (
            releaseReadiness.map((item) => (
              <Link
                key={item.id}
                href="/approvals?status=draft"
                className="block px-5 py-4 hover:bg-panel-strong"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">release readiness</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{item.source_title}</p>
                <p className="mt-1 text-xs text-muted">
                  {typeof item.metadata_json.readiness_decision === "string"
                    ? item.metadata_json.readiness_decision
                    : "draft decision"}
                </p>
              </Link>
            ))
          )}
        </BriefPanel>

        <BriefPanel
          title="Delivery And AI Review"
          description="Connector failures and high-risk AI outputs."
          href="/work-queue"
        >
          {failedDeliveries.length === 0 && highRiskRuns.length === 0 ? (
            <EmptyPanel message="No failed deliveries or high-risk AI reviews." />
          ) : (
            <>
              {failedDeliveries.map((item) => (
                <Link
                  key={item.id}
                  href={`/support?conversation=${item.conversation_id}`}
                  className="block px-5 py-4 hover:bg-panel-strong"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="danger">delivery failed</Badge>
                    <Badge>{item.conversations?.priority ?? "priority n/a"}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {item.conversations?.subject ?? "Connector delivery"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {typeof item.metadata_json.delivery_error === "string"
                      ? item.metadata_json.delivery_error
                      : item.content}
                  </p>
                </Link>
              ))}
              {highRiskRuns.map((item) => (
                <Link
                  key={item.id}
                  href="/agents"
                  className="block px-5 py-4 hover:bg-panel-strong"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={badgeTone(item.risk_level)}>
                      {item.risk_level}
                    </Badge>
                    <Badge>{item.status}</Badge>
                    <Badge>{item.products?.slug ?? "unknown"}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {item.agents?.name ?? "Unknown agent"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {item.confidence === null
                      ? "confidence n/a"
                      : `${Math.round(item.confidence * 100)}% confidence`}
                  </p>
                </Link>
              ))}
            </>
          )}
        </BriefPanel>

        <BriefPanel
          title="Stale Conversations"
          description="Open support work with no activity for more than 48 hours."
          href="/support"
        >
          {staleConversations.length === 0 ? (
            <EmptyPanel message="No stale conversations older than 48 hours." />
          ) : (
            staleConversations.map((item) => (
              <Link
                key={item.id}
                href={`/support?conversation=${item.id}`}
                className="block px-5 py-4 hover:bg-panel-strong"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone={badgeTone(item.priority)}>{item.priority}</Badge>
                  <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">
                  {item.subject ?? "Untitled conversation"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Last activity {formatDate(item.last_message_at ?? item.created_at)}
                </p>
              </Link>
            ))
          )}
        </BriefPanel>

        <BriefPanel
          title="Open Tickets"
          description="Operational support tickets that still need ownership."
          href="/tickets"
        >
          {openTickets.length === 0 ? (
            <EmptyPanel message="No open tickets need attention right now." />
          ) : (
            openTickets.map((item) => (
              <Link
                key={item.id}
                href="/tickets"
                className="block px-5 py-4 hover:bg-panel-strong"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone={badgeTone(item.priority)}>{item.priority}</Badge>
                  <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{item.summary}</p>
                <p className="mt-1 text-xs text-muted">
                  Created {formatDate(item.created_at)}
                </p>
              </Link>
            ))
          )}
        </BriefPanel>
      </div>
    </>
  );
}
