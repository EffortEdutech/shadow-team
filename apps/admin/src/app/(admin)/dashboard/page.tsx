import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [{ count: productCount }, { count: agentCount }, { count: ticketCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase.from("tickets").select("*", { count: "exact", head: true }),
    ]);

  const cards = [
    { label: "Products", value: productCount ?? 0 },
    { label: "Draft agents", value: agentCount ?? 0 },
    { label: "Open tickets", value: ticketCount ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Sprint 2 admin shell is connected to Supabase and ready for product operations."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <section
            key={card.label}
            className="rounded-lg border border-border bg-panel p-5 shadow-sm"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Sprint 2 Status</h2>
            <p className="mt-1 text-sm text-muted">
              Login, protected layout, navigation, and product register are the
              active scope.
            </p>
          </div>
          <Badge tone="success">Active</Badge>
        </div>
      </section>
    </>
  );
}
