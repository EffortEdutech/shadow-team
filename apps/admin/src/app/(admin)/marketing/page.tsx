import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MarketingCampaign,
  MarketingChannel,
  MarketingContentDraft,
  MarketingProfile,
  Product,
} from "@/lib/types";
import {
  createMarketingCampaign,
  createMarketingContentDraft,
  generateSocialMediaDrafts,
  saveMarketingProfile,
} from "./actions";

type MarketingProfileRow = MarketingProfile & {
  products: Pick<Product, "name" | "slug"> | null;
};

type MarketingCampaignRow = MarketingCampaign & {
  products: Pick<Product, "name" | "slug"> | null;
};

type MarketingContentDraftRow = MarketingContentDraft & {
  products: Pick<Product, "name" | "slug"> | null;
  marketing_campaigns: Pick<MarketingCampaign, "name"> | null;
  marketing_channels: Pick<MarketingChannel, "channel_name"> | null;
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

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function lines(values: string[]) {
  return values.join("\n");
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-medium text-muted">{children}</span>
  );
}

export default async function MarketingPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [
    productsResult,
    profilesResult,
    channelsResult,
    campaignsResult,
    draftsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
      .order("priority", { ascending: true })
      .returns<Product[]>(),
    supabase
      .from("marketing_profiles")
      .select(
        "id, product_id, target_audiences, positioning_statement, value_propositions, brand_voice, restricted_claims, approval_owner, metadata_json, created_at, updated_at, products(name, slug)",
      )
      .order("updated_at", { ascending: false })
      .returns<MarketingProfileRow[]>(),
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
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<MarketingCampaignRow[]>(),
    supabase
      .from("marketing_content_drafts")
      .select(
        "id, product_id, campaign_id, channel_id, title, content_body, content_type, status, planned_for, created_by, approved_by, approved_at, metadata_json, created_at, updated_at, products(name, slug), marketing_campaigns(name), marketing_channels(channel_name)",
      )
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<MarketingContentDraftRow[]>(),
  ]);

  const loadError =
    productsResult.error ??
    profilesResult.error ??
    channelsResult.error ??
    campaignsResult.error ??
    draftsResult.error;

  const products = productsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const channels = channelsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const drafts = draftsResult.data ?? [];
  const defaultProductId = products[0]?.id ?? "";
  const profileProductIds = new Set(profiles.map((profile) => profile.product_id));
  const draftCountByStatus = drafts.reduce<Record<string, number>>((acc, draft) => {
    acc[draft.status] = (acc[draft.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Marketing"
        description="Draft-only product marketing foundation for positioning, campaigns, social content, and human-approved publishing later."
      />

      {loadError ? (
        <StateCard
          title="Marketing foundation is not ready"
          description="Run supabase/sprint_20_marketing_foundation.sql in Supabase SQL Editor, then refresh this page."
          tone="warning"
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Marketing profiles", profiles.length],
          ["Campaigns", campaigns.length],
          ["Draft content", drafts.length],
          ["Approved drafts", draftCountByStatus.approved ?? 0],
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Marketing Profiles</h2>
            <p className="mt-1 text-sm text-muted">
              Product positioning and public-claim boundaries before social work.
            </p>
          </div>
          {products.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No products"
                description="Seed products before creating marketing profiles."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {products.map((product) => {
                const profile = profiles.find(
                  (item) => item.product_id === product.id,
                );

                return (
                  <details
                    key={product.id}
                    className="group px-5 py-4"
                    open={!profile && product.id === defaultProductId}
                  >
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          <Badge>{product.slug}</Badge>
                          {profileProductIds.has(product.id) ? (
                            <Badge tone="success">profile ready</Badge>
                          ) : (
                            <Badge tone="warning">profile needed</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {profile?.positioning_statement ??
                            "No positioning statement yet."}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-accent-strong">
                        Edit
                      </span>
                    </summary>

                    <form action={saveMarketingProfile} className="mt-4 grid gap-4">
                      <input type="hidden" name="productId" value={product.id} />
                      <label className="block">
                        <FieldLabel>Target audiences, one per line</FieldLabel>
                        <textarea
                          name="targetAudiences"
                          rows={3}
                          defaultValue={lines(profile?.target_audiences ?? [])}
                          className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                          placeholder="SME owners&#10;Finance admins&#10;Startup founders"
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>Positioning statement</FieldLabel>
                        <textarea
                          name="positioningStatement"
                          rows={3}
                          defaultValue={profile?.positioning_statement ?? ""}
                          className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                          placeholder="For [audience], [product] helps [outcome] without [pain]."
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>Value propositions, one per line</FieldLabel>
                        <textarea
                          name="valuePropositions"
                          rows={4}
                          defaultValue={lines(profile?.value_propositions ?? [])}
                          className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                          placeholder="Reduce manual admin&#10;Respond faster to customers&#10;Create better records"
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>Brand voice</FieldLabel>
                        <input
                          name="brandVoice"
                          defaultValue={profile?.brand_voice ?? ""}
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                          placeholder="Clear, useful, practical, trustworthy"
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>Restricted public claims, one per line</FieldLabel>
                        <textarea
                          name="restrictedClaims"
                          rows={3}
                          defaultValue={lines(profile?.restricted_claims ?? [])}
                          className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                          placeholder="Do not promise refunds&#10;Do not imply legal advice&#10;Do not mention customer data"
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>Approval owner</FieldLabel>
                        <input
                          name="approvalOwner"
                          defaultValue={profile?.approval_owner ?? ""}
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                          placeholder="Kamal / product owner / marketing owner"
                        />
                      </label>
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
                      >
                        Save marketing profile
                      </button>
                    </form>
                  </details>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <h2 className="text-base font-semibold">AI Social Drafts</h2>
            <p className="mt-1 text-sm text-muted">
              Generate channel-specific drafts from approved operating context.
              Draft only.
            </p>
            <form action={generateSocialMediaDrafts} className="mt-4 space-y-3">
              <label className="block">
                <FieldLabel>Product</FieldLabel>
                <select
                  name="productId"
                  defaultValue={defaultProductId}
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
              <div>
                <FieldLabel>Channels</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {channels.map((channel) => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="channelIds"
                        value={channel.id}
                        defaultChecked={["linkedin", "facebook"].includes(
                          channel.channel_key,
                        )}
                        className="size-4"
                      />
                      {channel.channel_name}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block">
                <FieldLabel>Content goal</FieldLabel>
                <textarea
                  name="contentGoal"
                  rows={3}
                  className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                  placeholder="Create awareness posts that explain why SMEs need cleaner expense and payment records."
                />
              </label>
              <label className="block">
                <FieldLabel>Audience</FieldLabel>
                <input
                  name="audience"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  placeholder="SME owners and finance admins"
                />
              </label>
              <label className="block">
                <FieldLabel>Extra notes</FieldLabel>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                  placeholder="Mention practical admin relief. Avoid refund, tax, or payment guarantee claims."
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Generate AI social drafts
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <h2 className="text-base font-semibold">Create Campaign</h2>
            <p className="mt-1 text-sm text-muted">
              Draft campaign only. No public publishing.
            </p>
            <form action={createMarketingCampaign} className="mt-4 space-y-3">
              <label className="block">
                <FieldLabel>Product</FieldLabel>
                <select
                  name="productId"
                  defaultValue={defaultProductId}
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
                <FieldLabel>Campaign name</FieldLabel>
                <input
                  name="name"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  placeholder="MyExpensio payment confidence campaign"
                />
              </label>
              <label className="block">
                <FieldLabel>Objective</FieldLabel>
                <textarea
                  name="objective"
                  rows={3}
                  className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                  placeholder="Educate users, build trust, and generate qualified demo requests."
                />
              </label>
              <label className="block">
                <FieldLabel>Audience</FieldLabel>
                <input
                  name="audience"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  placeholder="SME finance admins"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>Starts on</FieldLabel>
                  <input
                    type="date"
                    name="startsOn"
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <FieldLabel>Ends on</FieldLabel>
                  <input
                    type="date"
                    name="endsOn"
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Create draft campaign
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <h2 className="text-base font-semibold">Create Content Draft</h2>
            <p className="mt-1 text-sm text-muted">
              Human-approved social/content draft. Publishing is out of scope.
            </p>
            <form action={createMarketingContentDraft} className="mt-4 space-y-3">
              <label className="block">
                <FieldLabel>Product</FieldLabel>
                <select
                  name="productId"
                  defaultValue={defaultProductId}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>Channel</FieldLabel>
                  <select
                    name="channelId"
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  >
                    <option value="">No channel</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.channel_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <FieldLabel>Type</FieldLabel>
                  <select
                    name="contentType"
                    defaultValue="social_post"
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  >
                    <option value="social_post">Social post</option>
                    <option value="email">Email</option>
                    <option value="blog_outline">Blog outline</option>
                    <option value="short_video_script">Short video script</option>
                    <option value="ad_copy">Ad copy</option>
                    <option value="community_update">Community update</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <FieldLabel>Title</FieldLabel>
                <input
                  name="title"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  placeholder="Why payment records fail silently"
                />
              </label>
              <label className="block">
                <FieldLabel>Draft content</FieldLabel>
                <textarea
                  name="contentBody"
                  rows={6}
                  className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                  placeholder="Write the human-reviewed draft here. Keep claims factual and avoid sensitive customer data."
                />
              </label>
              <label className="block">
                <FieldLabel>Planned for</FieldLabel>
                <input
                  type="datetime-local"
                  name="plannedFor"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Create draft content
              </button>
            </form>
          </section>
        </aside>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Recent Campaigns</h2>
          </div>
          {campaigns.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No campaigns yet"
                description="Draft campaigns will appear here after creation."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((campaign) => (
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
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-panel shadow-sm">
          <div className="border-b border-border bg-panel-strong px-5 py-4">
            <h2 className="text-base font-semibold">Recent Content Drafts</h2>
          </div>
          {drafts.length === 0 ? (
            <div className="p-5">
              <StateCard
                title="No content drafts yet"
                description="Social and marketing drafts will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {drafts.map((draft) => (
                <article key={draft.id} className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(draft.status)}>{draft.status}</Badge>
                    <Badge>{label(draft.content_type)}</Badge>
                    <Badge>{draft.marketing_channels?.channel_name ?? "No channel"}</Badge>
                    <Badge>{draft.products?.slug ?? "unknown"}</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-medium">{draft.title}</h3>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                    {draft.content_body}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {draft.marketing_campaigns?.name ?? "No campaign"} - planned{" "}
                    {formatDate(draft.planned_for)}
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
