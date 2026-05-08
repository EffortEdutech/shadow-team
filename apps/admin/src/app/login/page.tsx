import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-accent">Shadow Team</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Sign in to admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use the Supabase owner account to access the Sprint 2 dashboard.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}

