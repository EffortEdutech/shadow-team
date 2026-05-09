"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  CheckSquare,
  Inbox,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Ticket,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/support", label: "Support", icon: Inbox },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
              active
                ? "bg-accent/10 text-accent-strong"
                : "text-muted hover:bg-panel-strong hover:text-foreground"
            }`}
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-panel lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <p className="text-lg font-semibold">Shadow Team</p>
            <p className="mt-1 text-sm text-muted">AI Agent OS</p>
          </div>

          {nav}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-panel/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted lg:hidden"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {email}
                </p>
                <p className="text-xs text-muted">Role: {role}</p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-20 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-border bg-panel shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-5">
              <div>
                <p className="text-lg font-semibold">Shadow Team</p>
                <p className="mt-1 text-sm text-muted">AI Agent OS</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
