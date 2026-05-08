import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-panel p-6">
          <p className="text-sm font-medium text-warning">Setup required</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Supabase environment variables are missing
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
            to the admin app environment before using the dashboard.
          </p>
        </div>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role =
    (user.app_metadata?.shadow_team_role as string | undefined) ??
    (user.user_metadata?.shadow_team_role as string | undefined) ??
    "unassigned";

  if (role === "unassigned") {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-panel p-6">
          <p className="text-sm font-medium text-danger">Access blocked</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Shadow Team role missing
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your Supabase Auth user needs `app_metadata.shadow_team_role` before
            the dashboard can read protected data.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell email={user.email ?? "Unknown user"} role={role}>
      {children}
    </AdminShell>
  );
}
