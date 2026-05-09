import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/ui/state-card";
import { getDepartmentAgentProfile } from "@/lib/agent-profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Agent,
  AgentProductAccess,
  AgentRun,
  KnowledgeSource,
  Product,
} from "@/lib/types";
import {
  generateProductManagerDraft,
  generateQaChecklistDraft,
} from "./actions";

type AgentWithAccess = Agent & {
  agent_product_access: AgentProductAccess[];
};

type AgentRunRow = AgentRun & {
  agents: Pick<Agent, "name"> | null;
  products: Pick<Product, "slug"> | null;
};

type QaChecklistRow = Pick<
  KnowledgeSource,
  "id" | "source_title" | "status" | "created_at" | "metadata_json"
> & {
  products: Pick<Product, "slug"> | null;
};

type BacklogSuggestionRow = Pick<
  KnowledgeSource,
  "id" | "source_title" | "status" | "created_at" | "metadata_json"
> & {
  products: Pick<Product, "slug"> | null;
};

function statusTone(status: string) {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  return "neutral";
}

function stageTone(stage?: string) {
  if (stage === "tool_limited") return "success";
  if (stage === "ready_for_drafts") return "warning";
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

  const { data: runs } = await supabase
    .from("agent_runs")
    .select(
      "id, product_id, conversation_id, confidence, risk_level, human_required, status, output_json, created_at, agents(name), products(slug)",
    )
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<AgentRunRow[]>();

  const [
    { data: products },
    { data: qaChecklists },
    { data: backlogSuggestions },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, status, priority, risk_level, first_ai_use_case")
      .order("priority", { ascending: true })
      .returns<Product[]>(),
    supabase
      .from("knowledge_sources")
      .select("id, source_title, status, created_at, metadata_json, products(slug)")
      .eq("source_type", "qa_checklist")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<QaChecklistRow[]>(),
    supabase
      .from("knowledge_sources")
      .select("id, source_title, status, created_at, metadata_json, products(slug)")
      .eq("source_type", "backlog_suggestion")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<BacklogSuggestionRow[]>(),
  ]);

  return (
    <>
      <PageHeader
        title="Agents"
        description="Department agent profiles, operating boundaries, prompt versions, and product access."
      />

      <section className="mb-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">Product Manager Agent</h2>
              <Badge>draft workflow</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Convert support, QA, knowledge, and agent signals into draft
              backlog suggestions. Human product owner approval is required.
            </p>
          </div>

          <form action={generateProductManagerDraft} className="grid gap-3 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Product
              </span>
              <select
                name="productId"
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">Select product</option>
                {(products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Planning focus
              </span>
              <input
                name="planningFocus"
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="Next improvements after connector MVP"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">
                Notes
              </span>
              <textarea
                name="notes"
                rows={4}
                className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                placeholder="Mention priorities, exclusions, customer pain points, or sprint constraints..."
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong lg:col-span-2"
            >
              Generate backlog suggestions
            </button>
          </form>
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
        <div className="border-b border-border bg-panel-strong px-5 py-4">
          <h2 className="text-base font-semibold">Recent Backlog Suggestions</h2>
          <p className="mt-1 text-sm text-muted">
            Draft planning outputs created by the Product Manager Agent.
          </p>
        </div>
        {(backlogSuggestions ?? []).length === 0 ? (
          <div className="p-5">
            <StateCard
              title="No backlog suggestions yet"
              description="Generate the first draft from the Product Manager Agent panel."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(backlogSuggestions ?? []).map((suggestion) => (
              <div
                key={suggestion.id}
                className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{suggestion.source_title}</p>
                  <p className="mt-1 text-muted">
                    {suggestion.products?.slug ?? "company-wide"} -{" "}
                    {typeof suggestion.metadata_json.planning_focus === "string"
                      ? suggestion.metadata_json.planning_focus
                      : "planning focus"}
                  </p>
                </div>
                <Badge>{suggestion.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">QA Checklist Agent</h2>
              <Badge>draft workflow</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Generate a draft manual test checklist from a product and feature
              scope. The output is saved as draft knowledge for human QA review.
            </p>
          </div>

          <form action={generateQaChecklistDraft} className="grid gap-3 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Product
              </span>
              <select
                name="productId"
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">Select product</option>
                {(products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Feature scope
              </span>
              <input
                name="featureScope"
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                placeholder="Payment failed connector flow"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">
                Notes
              </span>
              <textarea
                name="notes"
                rows={4}
                className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm"
                placeholder="Include important paths, edge cases, or release concerns..."
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong lg:col-span-2"
            >
              Generate QA checklist
            </button>
          </form>
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
        <div className="border-b border-border bg-panel-strong px-5 py-4">
          <h2 className="text-base font-semibold">Recent QA Checklists</h2>
          <p className="mt-1 text-sm text-muted">
            Draft release checklists created by the QA Checklist Agent.
          </p>
        </div>
        {(qaChecklists ?? []).length === 0 ? (
          <div className="p-5">
            <StateCard
              title="No QA checklists yet"
              description="Generate the first draft checklist from the QA Checklist Agent panel."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(qaChecklists ?? []).map((checklist) => (
              <div
                key={checklist.id}
                className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{checklist.source_title}</p>
                  <p className="mt-1 text-muted">
                    {checklist.products?.slug ?? "company-wide"} -{" "}
                    {typeof checklist.metadata_json.feature_scope === "string"
                      ? checklist.metadata_json.feature_scope
                      : "feature scope"}
                  </p>
                </div>
                <Badge>{checklist.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

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
            <section key={agent.id} className="rounded-lg border border-border bg-panel shadow-sm">
              <div className="border-b border-border p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{agent.name}</h2>
                    <Badge tone={statusTone(agent.status)}>{agent.status}</Badge>
                    <Badge>{agent.system_prompt_version}</Badge>
                    <Badge tone={stageTone(getDepartmentAgentProfile(agent.name)?.stage)}>
                      {getDepartmentAgentProfile(agent.name)?.stage ?? "draft_profile"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{agent.department}</p>
                  {agent.description ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                      {agent.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="text-xs font-medium uppercase text-muted">
                    Product Access
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.agent_product_access.map((access) => (
                      <Badge key={access.id}>
                        {access.products?.slug ?? "unknown"}: {access.access_level}
                      </Badge>
                    ))}
                  </div>
                </div>

                {(() => {
                  const profile = getDepartmentAgentProfile(agent.name);

                  if (!profile) {
                    return (
                      <StateCard
                        title="Profile pending"
                        description="This agent does not have a locked department profile yet."
                      />
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted">
                          Mission
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {profile.mission}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted">
                          First Outputs
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.firstOutputs.map((item) => (
                            <Badge key={item}>{item}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted">
                          Human Approval
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {profile.humanApproval}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted">
                          Allowed Actions
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.allowedActions.map((item) => (
                            <Badge key={item} tone="success">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted">
                          Restricted Actions
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.restrictedActions.map((item) => (
                            <Badge key={item} tone="danger">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
        <div className="border-b border-border bg-panel-strong px-5 py-4">
          <h2 className="text-base font-semibold">Recent Runs</h2>
          <p className="mt-1 text-sm text-muted">
            Latest AI triage and draft attempts.
          </p>
        </div>
        {(runs ?? []).length === 0 ? (
          <div className="p-5">
            <StateCard
              title="No agent runs yet"
              description="Generate an AI draft from the support inbox to create the first run."
            />
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Review</th>
              </tr>
            </thead>
            <tbody>
              {(runs ?? []).map((run) => (
                <tr key={run.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-4 font-medium">
                    {run.agents?.name ?? "Unknown agent"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{run.products?.slug ?? "unknown"}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      tone={
                        run.risk_level === "high" ||
                        run.risk_level === "critical"
                          ? "danger"
                          : run.risk_level === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {run.risk_level}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-muted">
                    {run.confidence === null
                      ? "-"
                      : `${Math.round(run.confidence * 100)}%`}
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{run.status}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{run.human_required ? "required" : "review"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
