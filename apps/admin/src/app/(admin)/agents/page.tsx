import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Agent, AgentProductAccess } from "@/lib/types";

type AgentWithAccess = Agent & {
  agent_product_access: AgentProductAccess[];
};

function statusTone(status: string) {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  return "neutral";
}

export default async function AgentsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: agents, error } = await supabase
    .from("agents")
    .select(
      "id, name, department, status, description, system_prompt_version, agent_product_access(id, access_level, products(name, slug, risk_level))",
    )
    .order("name", { ascending: true })
    .returns<AgentWithAccess[]>();

  return (
    <>
      <PageHeader
        title="Agents"
        description="Read-only view of seeded draft agents, their departments, prompt versions, and product access."
      />

      {error ? (
        <StateCard
          title="Unable to load agents"
          description={error.message}
          tone="danger"
        />
      ) : (agents ?? []).length === 0 ? (
        <StateCard
          title="No agents found"
          description="Run the Sprint 1 seed file to create draft agents."
        />
      ) : (
        <div className="grid gap-4">
          {(agents ?? []).map((agent) => (
            <section
              key={agent.id}
              className="rounded-lg border border-border bg-panel p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{agent.name}</h2>
                    <Badge tone={statusTone(agent.status)}>{agent.status}</Badge>
                    <Badge>{agent.system_prompt_version}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{agent.department}</p>
                  {agent.description ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                      {agent.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {agent.agent_product_access.map((access) => (
                  <Badge key={access.id}>
                    {access.products?.slug ?? "unknown"}: {access.access_level}
                  </Badge>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

