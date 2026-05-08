import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role =
    (user?.app_metadata?.shadow_team_role as string | undefined) ??
    (user?.user_metadata?.shadow_team_role as string | undefined) ??
    "unassigned";

  const [{ count: productCount }, { count: profileCount }, { count: agentCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("product_profiles")
        .select("*", { count: "exact", head: true }),
      supabase.from("agents").select("*", { count: "exact", head: true }),
    ]);

  const rows = [
    ["Supabase project", "mzcdnvtmwyarcefbroja"],
    ["Signed-in user", user?.email ?? "unknown"],
    ["Shadow Team role", role],
    ["Seeded products", String(productCount ?? 0)],
    ["Product profiles", String(profileCount ?? 0)],
    ["Draft agents", String(agentCount ?? 0)],
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Sprint 2 system status and identity checks for the admin dashboard."
      />

      <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
        <div className="border-b border-border bg-panel-strong px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">System Status</h2>
            <Badge tone={role === "owner" ? "success" : "warning"}>{role}</Badge>
          </div>
        </div>
        <div className="divide-y divide-border">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[220px_1fr]"
            >
              <p className="font-medium text-foreground">{label}</p>
              <p className="break-all font-mono text-muted">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

