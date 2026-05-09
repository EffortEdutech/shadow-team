import Link from "next/link";
import { CalendarDays, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MarketingCampaign,
  MarketingChannel,
  MarketingContentDraft,
  Product,
} from "@/lib/types";

type CalendarDraft = MarketingContentDraft & {
  products: Pick<Product, "name" | "slug"> | null;
  marketing_campaigns: Pick<MarketingCampaign, "id" | "name" | "status"> | null;
  marketing_channels: Pick<MarketingChannel, "id" | "channel_name" | "channel_key"> | null;
};

type CalendarCampaign = MarketingCampaign & {
  products: Pick<Product, "name" | "slug"> | null;
};

function statusTone(status: string) {
  if (status === "approved" || status === "active" || status === "completed") {
    return "success";
  }

  if (status === "archived" || status === "paused" || status === "retired") {
    return "danger";
  }

  return "warning";
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function dateKey(value: string | null) {
  if (!value) return "Unscheduled";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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

function buildHref(params: Record<string, string>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `/marketing/calendar?${query}` : "/marketing/calendar";
}

export default async function MarketingCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    channel?: string;
    status?: string;
  }>;
}) {
  const { product = "", channel = "", status = "" } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [productsResult, channelsResult, campaignsResult, draftsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
        .order("priority", { ascending: true })
        .returns<Product[]>(),
      supabase
        .from("marketing_channels")
        .select(
          "id, channel_key, channel_name, status, metadata_json, created_at, updated_at",
        )
        .order("channel_name", { ascending: true })
        .returns<MarketingChannel[]>(),
      supabase
        .from("marketing_campaigns")
        .select(
          "id, product_id, name, objective, audience, status, starts_on, ends_on, owner_user_id, metadata_json, created_at, updated_at, products(name, slug)",
        )
        .order("starts_on", { ascending: true, nullsFirst: false })
        .limit(60)
        .returns<CalendarCampaign[]>(),
      supabase
        .from("marketing_content_drafts")
        .select(
          "id, product_id, campaign_id, channel_id, title, content_body, content_type, status, planned_for, created_by, approved_by, approved_at, metadata_json, created_at, updated_at, products(name, slug), marketing_campaigns(id, name, status), marketing_channels(id, channel_name, channel_key)",
        )
        .order("planned_for", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(120)
        .returns<CalendarDraft[]>(),
    ]);

  const loadError =
    productsResult.error ??
    channelsResult.error ??
    campaignsResult.error ??
    draftsResult.error;

  const products = productsResult.data ?? [];
  const channels = channelsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const drafts = (draftsResult.data ?? []).filter((draft) => {
    const productMatch = product ? draft.product_id === product : true;
    const channelMatch = channel ? draft.channel_id === channel : true;
    const statusMatch = status ? draft.status === status : true;

    return productMatch && channelMatch && statusMatch;
  });
  const filteredCampaigns = campaigns.filter((campaign) =>
    product ? campaign.product_id === product : true,
  );
  const groupedDrafts = drafts.reduce<Record<string, CalendarDraft[]>>(
    (acc, draft) => {
      const key = dateKey(draft.planned_for);
      acc[key] = acc[key] ?? [];
      acc[key].push(draft);
      return acc;
    },
    {},
  );
  const approvedCount = drafts.filter((draft) => draft.status === "approved").length;
  const unscheduledCount = drafts.filter((draft) => !draft.planned_for).length;

  return (
    <>
      <PageHeader
        title="Campaign Calendar"
        description="Planned marketing content by product, channel, date, campaign, and approval status."
      />

      {loadError ? (
        <StateCard
          title="Unable to load campaign calendar"
          description={loadError.message}
          tone="danger"
        />
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/marketing"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-medium hover:bg-panel-strong"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          Marketing workspace
        </Link>
      </div>

      <section className="mb-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="size-4 text-muted" aria-hidden="true" />
          <h2 className="text-base font-semibold">Filters</h2>
        </div>
        <form className="grid gap-3 md:grid-cols-4" action="/marketing/calendar">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Product
            </span>
            <select
              name="product"
              defaultValue={product}
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">All products</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Channel
            </span>
            <select
              name="channel"
              defaultValue={channel}
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">All channels</option>
              {channels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.channel_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Status
            </span>
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Apply
            </button>
            <Link
              href="/marketing/calendar"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium hover:bg-panel-strong"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Visible drafts", drafts.length],
          ["Approved", approvedCount],
          ["Unscheduled", unscheduledCount],
          ["Campaigns", filteredCampaigns.length],
        ].map(([title, value]) => (
          <section
            key={title}
            className="rounded-lg border border-border bg-panel p-5 shadow-sm"
          >
            <p className="text-sm text-muted">{title}</p>
            <p className="mt-3 font-mono text-3xl font-semibold">{value}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Content Schedule</h2>
            <p className="mt-1 text-sm text-muted">
              Drafts grouped by planned date. Unscheduled drafts stay visible.
            </p>
          </div>
          {drafts.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No content found"
                description="Create or generate marketing drafts, then return to the calendar."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {Object.entries(groupedDrafts).map(([group, items]) => (
                <section key={group} className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{group}</h3>
                    <Badge>{items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((draft) => (
                      <article
                        key={draft.id}
                        className="rounded-md border border-border bg-panel-strong p-4"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={statusTone(draft.status)}>
                            {draft.status}
                          </Badge>
                          <Badge>{label(draft.content_type)}</Badge>
                          <Badge>
                            {draft.marketing_channels?.channel_name ?? "No channel"}
                          </Badge>
                          <Badge>{draft.products?.slug ?? "unknown"}</Badge>
                        </div>
                        <h4 className="mt-3 text-sm font-medium">{draft.title}</h4>
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                          {draft.content_body}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                          <span>
                            Campaign: {draft.marketing_campaigns?.name ?? "None"}
                          </span>
                          <span>Planned: {formatDate(draft.planned_for)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-panel shadow-sm">
            <div className="border-b border-border bg-panel-strong px-5 py-4">
              <h2 className="text-base font-semibold">Campaigns</h2>
            </div>
            {filteredCampaigns.length === 0 ? (
              <div className="p-5">
                <StateCard
                  title="No campaigns"
                  description="Draft campaigns will appear here after creation."
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredCampaigns.map((campaign) => (
                  <article key={campaign.id} className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusTone(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge>{campaign.products?.slug ?? "unknown"}</Badge>
                    </div>
                    <h3 className="mt-3 text-sm font-medium">{campaign.name}</h3>
                    <p className="mt-1 text-sm text-muted">{campaign.objective}</p>
                    <p className="mt-2 text-xs text-muted">
                      {campaign.starts_on ?? "No start"} -{" "}
                      {campaign.ends_on ?? "No end"}
                    </p>
                    <Link
                      href={buildHref({
                        product: campaign.product_id ?? "",
                        channel,
                        status,
                      })}
                      className="mt-3 inline-flex text-sm font-medium text-accent-strong"
                    >
                      Filter this product
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <h2 className="text-base font-semibold">Calendar Rule</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This page is planning visibility only. Content remains draft,
              review, approved, published, or archived according to its source
              workflow. Social posting connectors are not active yet.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
