import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

function riskTone(risk: Product["risk_level"]) {
  if (risk === "high" || risk === "critical") return "danger";
  if (risk === "medium" || risk === "varies") return "warning";
  return "success";
}

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
    .order("priority", { ascending: true })
    .returns<Product[]>();

  return (
    <>
      <PageHeader
        title="Product Register"
        description="The source of truth for rollout order, risk level, and first AI use case."
      />

      {error ? (
        <section className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error.message}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-border bg-panel-strong text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">First AI Use Case</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-4 font-mono text-sm">
                  {product.priority}
                </td>
                <td className="px-4 py-4 font-medium">{product.name}</td>
                <td className="px-4 py-4 font-mono text-xs text-muted">
                  {product.slug}
                </td>
                <td className="px-4 py-4">
                  <Badge tone={riskTone(product.risk_level)}>
                    {product.risk_level}
                  </Badge>
                </td>
                <td className="max-w-sm px-4 py-4 text-muted">
                  {product.first_ai_use_case}
                </td>
                <td className="px-4 py-4">
                  <Badge tone="success">{product.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
