"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted transition hover:border-accent hover:text-accent"
      type="button"
      onClick={signOut}
      title="Sign out"
      aria-label="Sign out"
    >
      <LogOut size={16} aria-hidden="true" />
    </button>
  );
}

