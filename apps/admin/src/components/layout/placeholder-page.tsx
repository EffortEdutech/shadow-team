import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export function PlaceholderPage({
  title,
  description,
  sprint,
}: {
  title: string;
  description: string;
  sprint: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <section className="rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Planned workspace</h2>
            <p className="mt-1 text-sm text-muted">
              This route is intentionally present in Sprint 2 so navigation and
              permissions are stable before feature work begins.
            </p>
          </div>
          <Badge>{sprint}</Badge>
        </div>
      </section>
    </>
  );
}

