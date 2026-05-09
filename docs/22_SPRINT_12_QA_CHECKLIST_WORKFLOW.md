# Sprint 12: QA Checklist Agent Workflow

## Goal

Sprint 12 adds the second non-support operational workflow.

The QA Checklist Agent creates draft manual test checklists from a selected product, feature scope, product guardrails, recent tickets, and recent support conversations.

This does not approve releases, deploy software, or make final go/no-go decisions.

## Completed Scope

- Added QA Checklist Agent form to the Agents page.
- Generates structured manual test checklists with expected results and priority.
- Stores checklist output in `agent_runs`.
- Stores the draft checklist as a `knowledge_sources` record with source type `qa_checklist`.
- Stores checklist text in `knowledge_chunks`.
- Logs `agent_tool_calls` and `audit_events`.
- Shows recent QA checklists on the Agents page.

## Page

```text
http://localhost:3000/agents
```

## Inputs

| Input | Where It Comes From | Notes |
|---|---|---|
| Product | QA Checklist Agent product dropdown | Required |
| Feature scope | QA Checklist Agent form | Required |
| Notes | QA Checklist Agent form | Optional |
| Product guardrails | `product_profiles` table | Pulled automatically |
| Recent tickets | `tickets` table | Pulled automatically |
| Recent support conversations | `conversations` table | Pulled automatically |
| OpenAI model | `OPENAI_MODEL` env var | Pulled automatically |

## Output

The workflow creates:

- one `agent_runs` record
- one `agent_tool_calls` record
- one draft `knowledge_sources` record
- one `knowledge_chunks` record
- audit events

The checklist includes:

- scope summary
- assumptions
- manual test cases
- expected results
- priority per test case
- regression areas
- data setup
- release risks

## Safety Rules

- Output is draft only.
- Human QA review is required before using as release evidence.
- The agent cannot approve releases.
- The agent cannot deploy software.
- The agent cannot change production data.
- The agent cannot make final go/no-go decisions.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open the Agents page.

```text
http://localhost:3000/agents
```

3. In the QA Checklist Agent panel, choose a product.

Recommended first test:

```text
MyExpensio
```

4. Enter a feature scope.

Example:

```text
Payment failed connector flow and delivery acknowledgement
```

5. Enter notes.

Example:

```text
Cover inbound connector creation, human reply outbox, delivery acknowledgement, unauthorized calls, cursor behavior, and internal note/AI draft exclusion.
```

6. Click:

```text
Generate QA checklist
```

7. Confirm Recent QA Checklists shows a new draft checklist.

8. Open the Knowledge page.

```text
http://localhost:3000/knowledge
```

9. Confirm the checklist appears as:

- source type: `qa checklist`
- status: `draft`
- product: selected product
- text includes manual test cases, expected results, regression areas, data setup, and release risks

10. Open the Agents page again and confirm Recent Runs includes:

```text
QA Checklist Agent
```

## Supabase Verification SQL

Recent QA agent runs:

```sql
select
  ar.id,
  a.name,
  p.slug as product_slug,
  ar.confidence,
  ar.risk_level,
  ar.human_required,
  ar.created_at
from public.agent_runs ar
left join public.agents a on a.id = ar.agent_id
left join public.products p on p.id = ar.product_id
where a.name = 'QA Checklist Agent'
order by ar.created_at desc
limit 10;
```

Recent QA checklist drafts:

```sql
select
  ks.id,
  p.slug as product_slug,
  ks.source_title,
  ks.status,
  ks.metadata_json,
  ks.created_at
from public.knowledge_sources ks
left join public.products p on p.id = ks.product_id
where ks.source_type = 'qa_checklist'
order by ks.created_at desc
limit 10;
```

## Next Sprint Candidate

Sprint 13 can add a Product Manager Agent workflow that turns support, QA, and analytics signals into draft backlog items.
