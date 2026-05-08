import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { KnowledgeChunk, KnowledgeSource, Product } from "@/lib/types";
import {
  createKnowledgeSource,
  updateKnowledgeSourceStatus,
} from "./actions";

type KnowledgeSourceRow = KnowledgeSource & {
  products: Pick<Product, "name" | "slug" | "risk_level"> | null;
  knowledge_chunks: KnowledgeChunk[];
};

function statusTone(status: KnowledgeSource["status"]) {
  if (status === "approved") return "success";
  if (status === "archived") return "neutral";
  return "warning";
}

function sourceTypeLabel(type: string) {
  return type.replaceAll("_", " ");
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; status?: string }>;
}) {
  const { product: productFilter, status: statusFilter } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const productsResult = await supabase
    .from("products")
    .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
    .order("priority", { ascending: true })
    .returns<Product[]>();

  const products = productsResult.data ?? [];
  const selectedProduct = products.find(
    (product) => product.slug === productFilter,
  );

  let query = supabase
    .from("knowledge_sources")
    .select(
      "id, product_id, source_type, source_title, source_path, status, version, metadata_json, created_at, updated_at, products(name, slug, risk_level), knowledge_chunks(id, source_id, chunk_text, embedding_ref, metadata_json, created_at)",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (selectedProduct) {
    query = query.eq("product_id", selectedProduct.id);
  }

  if (statusFilter && ["draft", "approved", "archived"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data: sources, error } = await query.returns<KnowledgeSourceRow[]>();

  const counts = (sources ?? []).reduce(
    (acc, source) => {
      acc.total += 1;
      acc[source.status] += 1;
      return acc;
    },
    { total: 0, draft: 0, approved: 0, archived: 0 },
  );

  return (
    <>
      <PageHeader
        title="Knowledge"
        description="Create and approve product-specific FAQs, SOPs, policies, and support notes for AI draft grounding."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Total", counts.total],
          ["Draft", counts.draft],
          ["Approved", counts.approved],
          ["Archived", counts.archived],
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-lg border border-border bg-panel p-4 shadow-sm"
          >
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
          <h2 className="text-base font-semibold">Add Knowledge Source</h2>
          <form action={createKnowledgeSource} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Product
              </span>
              <select
                name="productId"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">Company-wide</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Source type
                </span>
                <select
                  name="sourceType"
                  required
                  defaultValue="faq"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                >
                  <option value="faq">FAQ</option>
                  <option value="sop">SOP</option>
                  <option value="policy">Policy</option>
                  <option value="user_guide">User guide</option>
                  <option value="admin_guide">Admin guide</option>
                  <option value="knowledge_gap">Knowledge gap</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue="draft"
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Title
              </span>
              <input
                name="sourceTitle"
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="Payment failed troubleshooting"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Source path
              </span>
              <input
                name="sourcePath"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="docs/myexpensio/payment-failed.md"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Version
              </span>
              <input
                name="version"
                defaultValue="v0.1"
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Knowledge text
              </span>
              <textarea
                name="chunkText"
                required
                rows={10}
                className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                placeholder="Write the approved answer, SOP, checklist, or policy here..."
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Save knowledge
            </button>
          </form>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-panel p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <a
                href="/knowledge"
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium hover:border-accent hover:text-accent"
              >
                All
              </a>
              {products.map((product) => (
                <a
                  key={product.id}
                  href={`/knowledge?product=${product.slug}`}
                  className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium hover:border-accent hover:text-accent"
                >
                  {product.slug}
                </a>
              ))}
            </div>
          </section>

          {error ? (
            <StateCard
              title="Unable to load knowledge"
              description={error.message}
              tone="danger"
            />
          ) : (sources ?? []).length === 0 ? (
            <StateCard
              title="No knowledge sources yet"
              description="Add a draft or approved FAQ/SOP to start grounding AI replies."
            />
          ) : (
            <div className="grid gap-4">
              {(sources ?? []).map((source) => (
                <section
                  key={source.id}
                  className="rounded-lg border border-border bg-panel p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold">
                          {source.source_title}
                        </h2>
                        <Badge tone={statusTone(source.status)}>
                          {source.status}
                        </Badge>
                        <Badge>{sourceTypeLabel(source.source_type)}</Badge>
                        <Badge>{source.version}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {source.products?.name ?? "Company-wide"}
                      </p>
                      {source.source_path ? (
                        <p className="mt-1 break-all font-mono text-xs text-muted">
                          {source.source_path}
                        </p>
                      ) : null}
                    </div>

                    <form action={updateKnowledgeSourceStatus} className="flex gap-2">
                      <input type="hidden" name="sourceId" value={source.id} />
                      <input
                        type="hidden"
                        name="productId"
                        value={source.product_id ?? ""}
                      />
                      <select
                        name="status"
                        defaultValue={source.status}
                        className="h-9 rounded-md border border-border bg-white px-2 text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm font-semibold hover:border-accent hover:text-accent"
                      >
                        Update
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 space-y-3">
                    {source.knowledge_chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="rounded-md border border-border bg-panel-strong p-4"
                      >
                        <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                          {chunk.chunk_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
