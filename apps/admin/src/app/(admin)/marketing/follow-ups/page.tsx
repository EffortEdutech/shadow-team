import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MarketingCampaign,
  Product,
  SalesFollowup,
  SalesFollowupDraft,
} from "@/lib/types";
import { createSalesFollowup, generateSalesFollowupDraft } from "./actions";

type FollowupRow = SalesFollowup & {
  products: Pick<Product, "name" | "slug"> | null;
  marketing_campaigns: Pick<MarketingCampaign, "name" | "status"> | null;
  sales_followup_drafts: Array<Pick<SalesFollowupDraft, "id" | "subject" | "body" | "status" | "created_at" | "metadata_json">>;
};

type CampaignRow = Pick<
  MarketingCampaign,
  "id" | "product_id" | "name" | "status"
> & {
  products: Pick<Product, "name" | "slug"> | null;
};

function statusTone(status: string) {
  if (status === "approved" || status === "sent" || status === "closed") {
    return "success";
  }
  if (status === "urgent" || status === "high" || status === "archived") {
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-medium text-muted">{children}</span>
  );
}

export default async function SalesFollowupsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [productsResult, campaignsResult, followupsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
      .order("priority", { ascending: true })
      .returns<Product[]>(),
    supabase
      .from("marketing_campaigns")
      .select("id, product_id, name, status, products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<CampaignRow[]>(),
    supabase
      .from("sales_followups")
      .select(
        "id, product_id, campaign_id, contact_name, contact_email, company_name, lead_source, product_interest, status, priority, next_follow_up_on, owner_user_id, metadata_json, created_at, updated_at, products(name, slug), marketing_campaigns(name, status), sales_followup_drafts(id, subject, body, status, created_at, metadata_json)",
      )
      .order("created_at", { ascending: false })
      .limit(60)
      .returns<FollowupRow[]>(),
  ]);

  const loadError =
    productsResult.error ?? campaignsResult.error ?? followupsResult.error;
  const products = productsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const followups = followupsResult.data ?? [];
  const defaultProductId = products[0]?.id ?? "";
  const draftedCount = followups.filter((item) => item.status === "drafted").length;
  const openCount = followups.filter((item) =>
    ["new", "drafted", "review", "approved"].includes(item.status),
  ).length;
  const urgentCount = followups.filter((item) =>
    ["high", "urgent"].includes(item.priority),
  ).length;

  return (
    <>
      <PageHeader
        title="Sales Follow-ups"
        description="Campaign-aware follow-up tracking and AI draft replies for human review before sending."
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
      </div>

      {loadError ? (
        <StateCard
          title="Sales follow-up workflow is not ready"
          description="Run supabase/sprint_23_sales_followup_workflow.sql in Supabase SQL Editor, then refresh this page."
          tone="warning"
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Open follow-ups", openCount],
          ["AI drafted", draftedCount],
          ["High priority", urgentCount],
          ["Total", followups.length],
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

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-panel p-5 shadow-sm">
          <h2 className="text-base font-semibold">Create Follow-up</h2>
          <p className="mt-1 text-sm text-muted">
            Track a lead or contact from a campaign. No message is sent.
          </p>
          <form action={createSalesFollowup} className="mt-4 space-y-3">
            <label className="block">
              <FieldLabel>Product</FieldLabel>
              <select
                name="productId"
                defaultValue={defaultProductId}
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <FieldLabel>Campaign</FieldLabel>
              <select
                name="campaignId"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">No campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <FieldLabel>Contact name</FieldLabel>
              <input
                name="contactName"
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="Jessmin"
              />
            </label>
            <label className="block">
              <FieldLabel>Contact email</FieldLabel>
              <input
                name="contactEmail"
                type="email"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="jessmin@example.com"
              />
            </label>
            <label className="block">
              <FieldLabel>Company</FieldLabel>
              <input
                name="companyName"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="Example Sdn Bhd"
              />
            </label>
            <label className="block">
              <FieldLabel>Lead source</FieldLabel>
              <input
                name="leadSource"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="LinkedIn comment / demo form / referral"
              />
            </label>
            <label className="block">
              <FieldLabel>Product interest</FieldLabel>
              <textarea
                name="productInterest"
                required
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                placeholder="Interested in payment/expense tracking for SME finance team."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Priority</FieldLabel>
                <select
                  name="priority"
                  defaultValue="normal"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="block">
                <FieldLabel>Next follow-up</FieldLabel>
                <input
                  name="nextFollowUpOn"
                  type="date"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <FieldLabel>Context</FieldLabel>
              <textarea
                name="context"
                rows={4}
                className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                placeholder="What happened? What did they ask? What should the follow-up be careful about?"
              />
            </label>
            <button
              type="submit"
              disabled={products.length === 0}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              {products.length === 0 ? "Products required" : "Create follow-up"}
            </button>
          </form>
        </aside>

        <section className="rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Follow-up Queue</h2>
            <p className="mt-1 text-sm text-muted">
              Draft messages are internal until a human sends them elsewhere.
            </p>
          </div>
          {followups.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No follow-ups yet"
                description="Create the first campaign-aware follow-up from the form."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {followups.map((followup) => {
                const latestDraft = [...followup.sales_followup_drafts].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )[0];

                return (
                  <article key={followup.id} className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusTone(followup.status)}>
                        {followup.status}
                      </Badge>
                      <Badge tone={statusTone(followup.priority)}>
                        {followup.priority}
                      </Badge>
                      <Badge>{followup.products?.slug ?? "unknown"}</Badge>
                      <Badge>
                        {followup.marketing_campaigns?.name ?? "No campaign"}
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-sm font-medium">
                      {followup.contact_name}
                      {followup.company_name ? ` - ${followup.company_name}` : ""}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {followup.product_interest}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Source: {followup.lead_source ?? "Not set"} - next follow-up{" "}
                      {followup.next_follow_up_on ?? "not scheduled"}
                    </p>

                    {latestDraft ? (
                      <div className="mt-4 rounded-md border border-border bg-panel-strong p-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={statusTone(latestDraft.status)}>
                            {latestDraft.status}
                          </Badge>
                          {typeof latestDraft.metadata_json.lead_temperature ===
                          "string" ? (
                            <Badge>{latestDraft.metadata_json.lead_temperature}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-medium">
                          {latestDraft.subject}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                          {latestDraft.body}
                        </p>
                      </div>
                    ) : null}

                    <form
                      action={generateSalesFollowupDraft}
                      className="mt-4 rounded-md border border-border bg-panel-strong p-3"
                    >
                      <input type="hidden" name="followupId" value={followup.id} />
                      <input
                        type="hidden"
                        name="productId"
                        value={followup.product_id ?? ""}
                      />
                      <label className="block">
                        <FieldLabel>Drafting notes</FieldLabel>
                        <input
                          name="notes"
                          className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
                          placeholder="Optional: mention demo, answer question, keep it short"
                        />
                      </label>
                      <button
                        type="submit"
                        className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-strong"
                      >
                        Generate AI follow-up draft
                      </button>
                    </form>

                    <p className="mt-3 text-xs text-muted">
                      Created {formatDate(followup.created_at)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
