import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { KnowledgeChunk, KnowledgeSource, Product } from "@/lib/types";
import { updateApprovalStatus } from "./actions";

const aiCreatedFrom = new Set([
  "knowledge_curator_agent",
  "qa_checklist_agent",
  "product_manager_agent",
  "management_report_agent",
]);

type ApprovalRow = KnowledgeSource & {
  products: Pick<Product, "name" | "slug"> | null;
  knowledge_chunks: KnowledgeChunk[];
};

function statusTone(status: string) {
  if (status === "approved") return "success";
  if (status === "archived") return "danger";
  return "warning";
}

function createdFromLabel(value: unknown) {
  return typeof value === "string" ? value.replaceAll("_", " ") : "ai draft";
}

function sourceTypeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("knowledge_sources")
    .select(
      "id, product_id, source_type, source_title, source_path, status, version, metadata_json, created_at, updated_at, products(name, slug), knowledge_chunks(id, source_id, chunk_text, embedding_ref, metadata_json, created_at)",
    )
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<ApprovalRow[]>();

  const aiDrafts = (data ?? []).filter((source) =>
    aiCreatedFrom.has(String(source.metadata_json.created_from ?? "")),
  );
  const filtered = status
    ? aiDrafts.filter((source) => source.status === status)
    : aiDrafts;
  const counts = aiDrafts.reduce(
    (acc, source) => {
      acc.total += 1;
      acc[source.status] = (acc[source.status] ?? 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Review AI-created draft knowledge, QA checklists, backlog suggestions, and management reports before they become approved operating assets."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Total", counts.total ?? 0, "/approvals"],
          ["Draft", counts.draft ?? 0, "/approvals?status=draft"],
          ["Approved", counts.approved ?? 0, "/approvals?status=approved"],
          ["Archived", counts.archived ?? 0, "/approvals?status=archived"],
        ].map(([label, value, href]) => (
          <a
            key={label}
            href={String(href)}
            className="rounded-lg border border-border bg-panel p-4 shadow-sm hover:border-accent"
          >
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
          </a>
        ))}
      </div>

      {error ? (
        <StateCard
          title="Unable to load approvals"
          description={error.message}
          tone="danger"
        />
      ) : filtered.length === 0 ? (
        <StateCard
          title="No approval items"
          description="AI-created draft outputs will appear here after agents create them."
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((source) => {
            const chunkText = source.knowledge_chunks
              .map((chunk) => chunk.chunk_text)
              .join("\n\n");

            return (
              <section
                key={source.id}
                className="rounded-lg border border-border bg-panel shadow-sm"
              >
                <div className="border-b border-border p-5">
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
                        <Badge>
                          {createdFromLabel(source.metadata_json.created_from)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {source.products?.name ?? "Company-wide"} -{" "}
                        {formatDate(source.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-md border border-border bg-panel-strong p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {chunkText || "No draft text found."}
                    </p>
                  </div>

                  <form action={updateApprovalStatus} className="space-y-3">
                    <input type="hidden" name="sourceId" value={source.id} />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Decision
                      </span>
                      <select
                        name="decision"
                        defaultValue={source.status}
                        className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                      >
                        <option value="draft">Keep draft</option>
                        <option value="approved">Approve</option>
                        <option value="archived">Reject / archive</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Approval notes
                      </span>
                      <textarea
                        name="notes"
                        rows={5}
                        className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                        placeholder="Why approve, reject, or keep as draft?"
                      />
                    </label>

                    <button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
                    >
                      Save decision
                    </button>
                  </form>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
