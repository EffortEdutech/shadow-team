import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Agent,
  AgentRun,
  MarketingCampaign,
  MarketingChannel,
  MarketingContentDraft,
  Product,
  SalesFollowup,
} from "@/lib/types";

type CampaignRow = Pick<
  MarketingCampaign,
  "id" | "product_id" | "name" | "status" | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

type DraftRow = Pick<
  MarketingContentDraft,
  | "id"
  | "product_id"
  | "channel_id"
  | "campaign_id"
  | "title"
  | "content_type"
  | "status"
  | "planned_for"
  | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
  marketing_channels: Pick<MarketingChannel, "channel_name" | "channel_key"> | null;
  marketing_campaigns: Pick<MarketingCampaign, "name"> | null;
};

type FollowupRow = Pick<
  SalesFollowup,
  "id" | "product_id" | "campaign_id" | "status" | "priority" | "created_at"
> & {
  products: Pick<Product, "name" | "slug"> | null;
  marketing_campaigns: Pick<MarketingCampaign, "name"> | null;
};

type MarketingAgentRun = Pick<
  AgentRun,
  "id" | "product_id" | "confidence" | "risk_level" | "human_required" | "status" | "created_at"
> & {
  agents: Pick<Agent, "name"> | null;
  products: Pick<Product, "name" | "slug"> | null;
};

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function statusTone(status: string) {
  if (status === "approved" || status === "active" || status === "completed") {
    return "success";
  }

  if (
    status === "archived" ||
    status === "paused" ||
    status === "failed" ||
    status === "urgent" ||
    status === "high"
  ) {
    return "danger";
  }

  return "warning";
}

function riskTone(risk: string) {
  if (risk === "high" || risk === "critical") return "danger";
  if (risk === "medium") return "warning";
  return "success";
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

function label(value: string) {
  return value.replaceAll("_", " ");
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
    </section>
  );
}

function Breakdown({
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
          {rows.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{label(name)}</span>
              <span className="font-mono text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function MarketingAnalyticsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [
    campaignsResult,
    draftsResult,
    followupsResult,
    agentRunsResult,
  ] = await Promise.all([
    supabase
      .from("marketing_campaigns")
      .select("id, product_id, name, status, created_at, products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<CampaignRow[]>(),
    supabase
      .from("marketing_content_drafts")
      .select(
        "id, product_id, channel_id, campaign_id, title, content_type, status, planned_for, created_at, products(name, slug), marketing_channels(channel_name, channel_key), marketing_campaigns(name)",
      )
      .order("created_at", { ascending: false })
      .limit(300)
      .returns<DraftRow[]>(),
    supabase
      .from("sales_followups")
      .select(
        "id, product_id, campaign_id, status, priority, created_at, products(name, slug), marketing_campaigns(name)",
      )
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<FollowupRow[]>(),
    supabase
      .from("agent_runs")
      .select(
        "id, product_id, confidence, risk_level, human_required, status, created_at, agents(name), products(name, slug)",
      )
      .in("agents.name", [
        "Product Marketing Agent",
        "Social Media Content Agent",
        "Sales Follow-up Agent",
      ])
      .order("created_at", { ascending: false })
      .limit(80)
      .returns<MarketingAgentRun[]>(),
  ]);

  const loadError =
    campaignsResult.error ??
    draftsResult.error ??
    followupsResult.error ??
    agentRunsResult.error;

  const campaigns = campaignsResult.data ?? [];
  const drafts = draftsResult.data ?? [];
  const followups = followupsResult.data ?? [];
  const agentRuns = (agentRunsResult.data ?? []).filter((run) =>
    [
      "Product Marketing Agent",
      "Social Media Content Agent",
      "Sales Follow-up Agent",
    ].includes(run.agents?.name ?? ""),
  );

  const campaignStatus = countBy(campaigns, (item) => item.status);
  const draftStatus = countBy(drafts, (item) => item.status);
  const contentType = countBy(drafts, (item) => item.content_type);
  const channelBreakdown = countBy(
    drafts,
    (item) => item.marketing_channels?.channel_name ?? "No channel",
  );
  const followupStatus = countBy(followups, (item) => item.status);
  const productActivity = countBy(
    [...campaigns, ...drafts, ...followups],
    (item) => item.products?.slug ?? "unknown",
  );
  const unscheduledDrafts = drafts.filter((draft) => !draft.planned_for);
  const reviewNeededDrafts = drafts.filter((draft) =>
    ["draft", "review"].includes(draft.status),
  );
  const highPriorityFollowups = followups.filter((followup) =>
    ["high", "urgent"].includes(followup.priority),
  );
  const connectorReadyDrafts = drafts.filter(
    (draft) => draft.status === "approved" && draft.planned_for && draft.channel_id,
  );
  const readinessBlockers =
    unscheduledDrafts.length + reviewNeededDrafts.length + highPriorityFollowups.length;

  return (
    <>
      <PageHeader
        title="Marketing Analytics"
        description="Growth activity dashboard for campaigns, content drafts, channels, follow-ups, and marketing agent runs."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/marketing"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-panel px-3 text-sm font-medium hover:bg-panel-strong"
        >
          Marketing workspace
        </Link>
        <Link
          href="/marketing/calendar"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-panel px-3 text-sm font-medium hover:bg-panel-strong"
        >
          Campaign Calendar
        </Link>
        <Link
          href="/marketing/follow-ups"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-panel px-3 text-sm font-medium hover:bg-panel-strong"
        >
          Sales Follow-ups
        </Link>
      </div>

      {loadError ? (
        <StateCard
          title="Unable to load marketing analytics"
          description={loadError.message}
          tone="danger"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Campaigns" value={campaigns.length} />
        <StatCard
          label="Content Drafts"
          value={drafts.length}
          helper={`${draftStatus.approved ?? 0} approved`}
        />
        <StatCard
          label="Sales Follow-ups"
          value={followups.length}
          helper={`${highPriorityFollowups.length} high priority`}
        />
        <StatCard
          label="Marketing AI Runs"
          value={agentRuns.length}
          helper={`${agentRuns.filter((run) => run.human_required).length} need review`}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unscheduled Drafts"
          value={unscheduledDrafts.length}
          helper="Need planned date before calendar execution"
        />
        <StatCard
          label="Review Needed"
          value={reviewNeededDrafts.length}
          helper="Draft or review status"
        />
        <StatCard
          label="Connector-Ready"
          value={connectorReadyDrafts.length}
          helper="Approved, scheduled, and channel selected"
        />
        <StatCard
          label="Readiness Blockers"
          value={readinessBlockers}
          helper="Before any future social connector"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <Breakdown title="Campaign Status" rows={Object.entries(campaignStatus)} />
        <Breakdown title="Content Status" rows={Object.entries(draftStatus)} />
        <Breakdown title="Channel Mix" rows={Object.entries(channelBreakdown)} />
        <Breakdown title="Follow-up Status" rows={Object.entries(followupStatus)} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Breakdown title="Content Types" rows={Object.entries(contentType)} />
        <Breakdown title="Product Activity" rows={Object.entries(productActivity)} />
        <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
          <h2 className="text-base font-semibold">Social Connector Prep</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Future posting connectors should only pull approved, scheduled,
            channel-specific content. This panel shows whether the content base is
            ready for that future outbox.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Approved + scheduled</span>
              <span className="font-mono text-sm font-semibold">
                {connectorReadyDrafts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Needs scheduling</span>
              <span className="font-mono text-sm font-semibold">
                {unscheduledDrafts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Needs approval</span>
              <span className="font-mono text-sm font-semibold">
                {reviewNeededDrafts.length}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Recent Marketing Drafts</h2>
          </div>
          {drafts.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No drafts yet"
                description="Generate social drafts or create manual content from Marketing."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {drafts.slice(0, 8).map((draft) => (
                <article key={draft.id} className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(draft.status)}>{draft.status}</Badge>
                    <Badge>{label(draft.content_type)}</Badge>
                    <Badge>{draft.marketing_channels?.channel_name ?? "No channel"}</Badge>
                    <Badge>{draft.products?.slug ?? "unknown"}</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-medium">{draft.title}</h3>
                  <p className="mt-1 text-xs text-muted">
                    Campaign: {draft.marketing_campaigns?.name ?? "None"} - planned{" "}
                    {formatDate(draft.planned_for)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Recent Marketing AI Runs</h2>
          </div>
          {agentRuns.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No marketing AI runs"
                description="Social and follow-up agent runs will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {agentRuns.slice(0, 8).map((run) => (
                <article key={run.id} className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{run.agents?.name ?? "Unknown agent"}</Badge>
                    <Badge tone={riskTone(run.risk_level)}>{run.risk_level}</Badge>
                    <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                    <Badge>{run.products?.slug ?? "unknown"}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {run.confidence === null
                      ? "confidence n/a"
                      : `${Math.round(run.confidence * 100)}% confidence`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(run.created_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
