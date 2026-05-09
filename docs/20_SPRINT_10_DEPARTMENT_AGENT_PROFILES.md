# Sprint 10: Department Agent Profiles

## Goal

Sprint 10 expands Shadow Team beyond support-only agents.

The goal is not automation yet. The goal is to define the first cross-department agent workers, their responsibilities, their allowed outputs, and the human approval boundary before they are allowed to act.

## Completed Scope

- Added department agent profile registry in the admin app.
- Added richer profiles to the Agents page.
- Added first non-support operational agents:
  - Lead Qualification Agent
  - Demo Prep Agent
  - Product Manager Agent
  - QA Checklist Agent
  - Knowledge Curator Agent
  - Management Report Agent
  - Compliance Triage Agent
  - Repo Analyst Agent
- Seeded new agents into Supabase.
- Added product access for all six products with `draft_only` access.
- Added focused Sprint 10 SQL seed script.

## First Non-Support Agents

| Agent | Department | First Output |
|---|---|---|
| Lead Qualification Agent | Sales and Growth | Lead score and next action |
| Demo Prep Agent | Sales and Growth | Demo agenda and discovery questions |
| Product Manager Agent | Product Operations | Backlog suggestion and priority rationale |
| QA Checklist Agent | QA and Testing | Manual test checklist |
| Knowledge Curator Agent | Documentation and Knowledge Base | FAQ or SOP draft |
| Management Report Agent | Finance, Billing, and Admin | Weekly operating summary |
| Compliance Triage Agent | Compliance, Trust, and Audit | Risk flag and approval requirement |
| Repo Analyst Agent | Developer and Technical Operations | Repo summary and affected files |

## Safety Rules

- All Sprint 10 agents remain `draft`.
- Product access is `draft_only`.
- Agents can prepare outputs, not execute irreversible actions.
- Public messages, pricing commitments, legal conclusions, refunds, certification decisions, deployments, and production changes still require human approval.

## Files

| File | Purpose |
|---|---|
| `apps/admin/src/lib/agent-profiles.ts` | Locked department agent profile registry |
| `apps/admin/src/app/(admin)/agents/page.tsx` | Rich Agents page display |
| `supabase/sprint_10_department_agents.sql` | Focused SQL seed for Sprint 10 agents |
| `supabase/seed.sql` | Main idempotent project seed updated with Sprint 10 agents |

## Manual Verification

1. Open the Agents page.

```text
http://localhost:3000/agents
```

2. Confirm the page shows 13 total agents:

- 5 support/documentation agents from the original seed
- 8 new Sprint 10 department agents

3. Confirm each Sprint 10 agent has:

- status `draft`
- prompt version `v0.1`
- stage `draft_profile`
- product access for all six products
- mission
- first outputs
- human approval rule
- allowed actions
- restricted actions

4. Confirm no agent is marked active and no automation has been enabled.

## Supabase Verification SQL

Run this in Supabase SQL Editor if you want to verify directly:

```sql
select
  a.name,
  a.department,
  a.status,
  count(apa.product_id) as product_access_count
from public.agents a
left join public.agent_product_access apa on apa.agent_id = a.id
group by a.id, a.name, a.department, a.status
order by a.department, a.name;
```

Expected:

- 13 rows
- each agent has `product_access_count = 6`
- each agent has `status = draft`

## Next Sprint Candidate

Sprint 11 can add the first non-support draft workflow, likely Knowledge Curator or QA Checklist, because both are useful and low-risk.
