import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, ProductProfile } from "@/lib/types";

type ProductWithProfile = Product & {
  product_profiles: ProductProfile | null;
};

function riskTone(risk: Product["risk_level"]) {
  if (risk === "high" || risk === "critical") return "danger";
  if (risk === "medium" || risk === "varies") return "warning";
  return "success";
}

function ListPanel({
  title,
  items,
}: {
  title: string;
  items: string[] | null | undefined;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      {items?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item}>{item}</Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No entries yet.</p>
      )}
    </section>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, status, priority, risk_level, first_ai_use_case, product_profiles(product_id, target_users, support_categories, restricted_actions, escalation_rules, billing_model, metadata_json)",
    )
    .eq("slug", slug)
    .single<ProductWithProfile>();

  if (error || !product) {
    notFound();
  }

  const profile = product.product_profiles;

  return (
    <>
      <div className="mb-4">
        <Link
          className="text-sm font-medium text-accent-strong underline-offset-4 hover:underline"
          href="/products"
        >
          Back to products
        </Link>
      </div>

      <PageHeader
        title={product.name}
        description={product.first_ai_use_case ?? "Product profile"}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <section className="rounded-lg border border-border bg-panel p-4">
          <p className="text-sm text-muted">Priority</p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {product.priority}
          </p>
        </section>
        <section className="rounded-lg border border-border bg-panel p-4">
          <p className="text-sm text-muted">Risk</p>
          <div className="mt-3">
            <Badge tone={riskTone(product.risk_level)}>
              {product.risk_level}
            </Badge>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-panel p-4">
          <p className="text-sm text-muted">Status</p>
          <div className="mt-3">
            <Badge tone="success">{product.status}</Badge>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-panel p-4">
          <p className="text-sm text-muted">Slug</p>
          <p className="mt-2 break-all font-mono text-sm">{product.slug}</p>
        </section>
      </div>

      {!profile ? (
        <StateCard
          title="Profile missing"
          description="Run the Sprint 1 seed file to create this product profile."
          tone="warning"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ListPanel title="Target Users" items={profile.target_users} />
          <ListPanel
            title="Support Categories"
            items={profile.support_categories}
          />
          <ListPanel
            title="Restricted AI Actions"
            items={profile.restricted_actions}
          />
          <ListPanel
            title="Escalation Rules"
            items={profile.escalation_rules}
          />
        </div>
      )}
    </>
  );
}

