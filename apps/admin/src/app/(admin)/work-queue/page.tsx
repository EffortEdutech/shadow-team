import Link from "next/link";
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
import { markWorkItemReviewed } from "./actions";

type ConversationWorkItem = Pick<
  Conversation,
  | "id"
  | "product_id"
  | "subject"
  | "status"
  | "priority"
  | "last_message_at"
  | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type TicketWorkItem = Pick<
  Ticket,
  | "id"
  | "product_id"
  | "category"
  | "status"
  | "priority"
  | "summary"
  | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type ApprovalWorkItem = Pick<
  KnowledgeSource,
  | "id"
  | "product_id"
  | "source_title"
  | "source_type"
  | "status"
  | "metadata_json"
  | "updated_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type AgentRunWorkItem = Pick<
  AgentRun,
  | "id"
  | "product_id"
  | "risk_level"
  | "confidence"
  | "human_required"
  | "status"
  | "created_at"
> & {
  agents: Pick<Agent, "name"> | null;
  products: Pick<Product, "name" | "slug"> | null;
};

type DeliveryWorkItem = Pick<
  Message,
  "id" | "conversation_id" | "content" | "metadata_json" | "created_at"
> & {
  conversations: Pick<
    Conversation,
    "product_id" | "subject" | "priority" | "status"
  > | null;
};

const aiCreatedFrom = new Set([
  "knowledge_curator_agent",
  "qa_checklist_agent",
  "product_manager_agent",
  "management_report_agent",
  "release_readiness_agent",
]);

function priorityTone(value: string) {
  if (value === "urgent" || value === "high" || value === "critical") {
    return "danger";
  }
  if (value === "medium" || value === "pending" || value === "draft") {
    return "warning";
  }
  return "neutral";
}

function statusTone(value: string) {
  if (value === "open" || value === "completed" || value === "approved") {
    return "success";
  }
  if (value === "escalated" || value === "failed" || value === "archived") {
    return "danger";
  }
  return "warning";
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sourceTypeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function reviewKey(itemType: string, itemId: string) {
  return `${itemType}:${itemId}`;
}

function ReviewControl({
  itemType,
  itemId,
  productId,
  itemLabel,
  sourcePath,
  review,
  currentUserId,
}: {
  itemType: WorkItemReview["item_type"];
  itemId: string;
  productId: string | null;
  itemLabel: string;
  sourcePath: string;
  review?: WorkItemReview;
  currentUserId?: string | null;
}) {
  const reviewedByYou = review?.reviewed_by === currentUserId;

  return (
    <form
      action={markWorkItemReviewed}
      className="mt-4 rounded-md border border-border bg-panel-strong p-3"
    >
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input type="hidden" name="itemLabel" value={itemLabel} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {review?.reviewed_at ? (
            <Badge tone="success">
              {reviewedByYou ? "reviewed by you today" : "reviewed today"}
            </Badge>
          ) : (
            <Badge tone="warning">not reviewed today</Badge>
          )}
          {review?.owner_user_id ? (
            <Badge>
              {review.owner_user_id === currentUserId ? "owned by you" : "owned"}
            </Badge>
          ) : (
            <Badge>unowned</Badge>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          {review?.reviewed_at ? "Update review note" : "Mark reviewed today"}
        </button>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-muted">
          Operator note
        </span>
        <input
          name="note"
          defaultValue={review?.note ?? ""}
          className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
          placeholder="Optional handoff note for today's review"
        />
      </label>
    </form>
  );
}

function QueueSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-panel-strong px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <Badge>{count}</Badge>
      </div>
      {count === 0 ? (
        <div className="p-5">
          <StateCard
            title="Clear"
            description="No work items in this queue right now."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">{children}</div>
      )}
    </section>
  );
}

export default async function WorkQueuePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    conversationsResult,
    approvalsResult,
    releaseReadinessResult,
    deliveryResult,
    agentRunsResult,
    ticketsResult,
    reviewsResult,
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select(
        "id, product_id, subject, status, priority, last_message_at, created_at, products(name, slug)",
      )
      .in("status", ["open", "escalated"])
      .in("priority", ["high", "urgent"])
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(20)
      .returns<ConversationWorkItem[]>(),
    supabase
      .from("knowledge_sources")
      .select(
        "id, product_id, source_title, source_type, status, metadata_json, updated_at, products(name, slug)",
      )
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<ApprovalWorkItem[]>(),
    supabase
      .from("knowledge_sources")
      .select(
        "id, product_id, source_title, source_type, status, metadata_json, updated_at, products(name, slug)",
      )
      .eq("source_type", "release_readiness")
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<ApprovalWorkItem[]>(),
    supabase
      .from("messages")
      .select(
        "id, conversation_id, content, metadata_json, created_at, conversations(product_id, subject, priority, status)",
      )
      .eq("sender_type", "human")
      .eq("visibility", "external")
      .eq("metadata_json->>delivery_status", "failed")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<DeliveryWorkItem[]>(),
    supabase
      .from("agent_runs")
      .select(
        "id, product_id, risk_level, confidence, human_required, status, created_at, agents(name), products(name, slug)",
      )
      .eq("human_required", true)
      .in("risk_level", ["high", "critical"])
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<AgentRunWorkItem[]>(),
    supabase
      .from("tickets")
      .select(
        "id, product_id, category, status, priority, summary, created_at, products(name, slug)",
      )
      .in("status", ["open", "pending", "escalated"])
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<TicketWorkItem[]>(),
    supabase
      .from("work_item_reviews")
      .select("*")
      .eq("review_date", today)
      .limit(500)
      .returns<WorkItemReview[]>(),
  ]);

  const loadError =
    conversationsResult.error ??
    approvalsResult.error ??
    releaseReadinessResult.error ??
    deliveryResult.error ??
    agentRunsResult.error ??
    ticketsResult.error ??
    reviewsResult.error;

  const approvals = (approvalsResult.data ?? []).filter((item) =>
    aiCreatedFrom.has(String(item.metadata_json.created_from ?? "")),
  );
  const releaseReadiness = releaseReadinessResult.data ?? [];
  const reviewsByItem = new Map(
    (reviewsResult.data ?? []).map((review) => [
      reviewKey(review.item_type, review.item_id),
      review,
    ]),
  );
  const totalCount =
    (conversationsResult.data?.length ?? 0) +
    approvals.length +
    releaseReadiness.length +
    (deliveryResult.data?.length ?? 0) +
    (agentRunsResult.data?.length ?? 0) +
    (ticketsResult.data?.length ?? 0);
  const reviewedTodayCount = reviewsByItem.size;

  return (
    <>
      <PageHeader
        title="Work Queue"
        description="Daily command center for human-required support, approvals, release gates, connector delivery issues, AI review, and tickets."
      />

      {loadError ? (
        <StateCard
          title="Unable to load work queue"
          description={loadError.message}
          tone="danger"
        />
      ) : null}

      <section className="mb-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Open human work items</p>
            <p className="mt-2 font-mono text-4xl font-semibold">{totalCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Reviewed today</p>
            <p className="mt-2 font-mono text-4xl font-semibold">
              {reviewedTodayCount}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueueSection
          title="High-Priority Support"
          count={conversationsResult.data?.length ?? 0}
        >
          {(conversationsResult.data ?? []).map((item) => (
            <div key={item.id} className="px-5 py-4">
              <Link href={`/support?conversation=${item.id}`} className="block">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">
                  {item.subject ?? "Untitled conversation"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(item.last_message_at ?? item.created_at)}
                </p>
              </Link>
              <ReviewControl
                itemType="conversation"
                itemId={item.id}
                productId={item.product_id}
                itemLabel={item.subject ?? "Untitled conversation"}
                sourcePath={`/support?conversation=${item.id}`}
                review={reviewsByItem.get(reviewKey("conversation", item.id))}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </QueueSection>

        <QueueSection title="Pending Approvals" count={approvals.length}>
          {approvals.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <Link href="/approvals?status=draft" className="block">
                <div className="flex flex-wrap gap-2">
                  <Badge>{sourceTypeLabel(item.source_type)}</Badge>
                  <Badge>{item.products?.slug ?? "company-wide"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{item.source_title}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(item.updated_at)}
                </p>
              </Link>
              <ReviewControl
                itemType="approval"
                itemId={item.id}
                productId={item.product_id}
                itemLabel={item.source_title}
                sourcePath="/approvals?status=draft"
                review={reviewsByItem.get(reviewKey("approval", item.id))}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </QueueSection>

        <QueueSection title="Release Readiness" count={releaseReadiness.length}>
          {releaseReadiness.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <Link href="/approvals?status=draft" className="block">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">release gate</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{item.source_title}</p>
                <p className="mt-1 text-xs text-muted">
                  {typeof item.metadata_json.readiness_decision === "string"
                    ? item.metadata_json.readiness_decision
                    : "draft readiness"}
                </p>
              </Link>
              <ReviewControl
                itemType="release_readiness"
                itemId={item.id}
                productId={item.product_id}
                itemLabel={item.source_title}
                sourcePath="/approvals?status=draft"
                review={reviewsByItem.get(reviewKey("release_readiness", item.id))}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </QueueSection>

        <QueueSection
          title="Failed Connector Deliveries"
          count={deliveryResult.data?.length ?? 0}
        >
          {(deliveryResult.data ?? []).map((item) => (
            <div key={item.id} className="px-5 py-4">
              <Link
                href={`/support?conversation=${item.conversation_id}`}
                className="block"
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
              <ReviewControl
                itemType="delivery"
                itemId={item.id}
                productId={item.conversations?.product_id ?? null}
                itemLabel={item.conversations?.subject ?? "Connector delivery"}
                sourcePath={`/support?conversation=${item.conversation_id}`}
                review={reviewsByItem.get(reviewKey("delivery", item.id))}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </QueueSection>

        <QueueSection
          title="High-Risk AI Review"
          count={agentRunsResult.data?.length ?? 0}
        >
          {(agentRunsResult.data ?? []).map((item) => (
            <div key={item.id} className="px-5 py-4">
              <Link href="/agents" className="block">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={priorityTone(item.risk_level)}>{item.risk_level}</Badge>
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
              <ReviewControl
                itemType="agent_run"
                itemId={item.id}
                productId={item.product_id}
                itemLabel={item.agents?.name ?? "Unknown agent"}
                sourcePath="/agents"
                review={reviewsByItem.get(reviewKey("agent_run", item.id))}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </QueueSection>

        <QueueSection title="Open Tickets" count={ticketsResult.data?.length ?? 0}>
          {(ticketsResult.data ?? []).map((item) => (
            <div key={item.id} className="px-5 py-4">
              <Link href="/tickets" className="block">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  <Badge>{item.products?.slug ?? "unknown"}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{item.summary}</p>
                <p className="mt-1 text-xs text-muted">{item.category}</p>
              </Link>
              <ReviewControl
                itemType="ticket"
                itemId={item.id}
                productId={item.product_id}
                itemLabel={item.summary}
                sourcePath="/tickets"
                review={reviewsByItem.get(reviewKey("ticket", item.id))}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </QueueSection>
      </div>
    </>
  );
}
