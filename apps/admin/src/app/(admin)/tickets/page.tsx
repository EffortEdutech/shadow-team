import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, Ticket } from "@/lib/types";

type TicketRow = Ticket & {
  products: Pick<Product, "name" | "slug" | "risk_level"> | null;
};

function statusTone(status: Ticket["status"]) {
  if (status === "open") return "success";
  if (status === "pending") return "warning";
  if (status === "escalated") return "danger";
  return "neutral";
}

function priorityTone(priority: Ticket["priority"]) {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "normal") return "neutral";
  return "success";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function TicketsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      "id, conversation_id, product_id, category, status, priority, assigned_to, summary, created_at, products(name, slug, risk_level)",
    )
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<TicketRow[]>();

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Read-only ticket list for issues created from support conversations."
      />

      {error ? (
        <StateCard
          title="Unable to load tickets"
          description={error.message}
          tone="danger"
        />
      ) : (tickets ?? []).length === 0 ? (
        <StateCard
          title="No tickets yet"
          description="Create a ticket from a support conversation to see it here."
        />
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border bg-panel-strong text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Summary</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {(tickets ?? []).map((ticket) => (
                <tr key={ticket.id} className="border-b border-border last:border-0">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-medium">{ticket.summary}</p>
                    {ticket.conversation_id ? (
                      <Link
                        className="mt-1 inline-block text-xs font-medium text-accent-strong underline-offset-4 hover:underline"
                        href={`/support?conversation=${ticket.conversation_id}`}
                      >
                        Open conversation
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{ticket.products?.slug ?? "unknown"}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{ticket.category}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={priorityTone(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-muted">
                    {formatDate(ticket.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

