# Sprint 13: Product Manager Agent Workflow

## Goal

Sprint 13 adds the Product Manager Agent workflow.

The agent reviews support conversations, tickets, QA checklists, knowledge gaps, and recent agent runs, then creates draft backlog suggestions for human product-owner review.

This does not commit roadmap, assign deadlines, promise features, or decide sprint scope.

## Completed Scope

- Added Product Manager Agent form to the Agents page.
- Uses product profile, support signals, tickets, knowledge sources, QA checklists, and recent agent runs.
- Generates structured draft backlog suggestions.
- Stores output in `agent_runs`.
- Stores draft planning output as a `knowledge_sources` record with source type `backlog_suggestion`.
- Stores readable backlog text in `knowledge_chunks`.
- Logs `agent_tool_calls` and `audit_events`.
- Shows Recent Backlog Suggestions on the Agents page.

## Page

```text
http://localhost:3000/agents
```

## Inputs

| Input | Where It Comes From | Notes |
|---|---|---|
| Product | Product Manager Agent product dropdown | Required |
| Planning focus | Product Manager Agent form | Required |
| Notes | Product Manager Agent form | Optional |
| Product guardrails | `product_profiles` table | Pulled automatically |
| Recent tickets | `tickets` table | Pulled automatically |
| Recent conversations | `conversations` table | Pulled automatically |
| Recent knowledge and QA checklists | `knowledge_sources` table | Pulled automatically |
| Recent agent runs | `agent_runs` table | Pulled automatically |
| OpenAI model | `OPENAI_MODEL` env var | Pulled automatically |

## Output

The workflow creates:

- one `agent_runs` record
- one `agent_tool_calls` record
- one draft `knowledge_sources` record
- one `knowledge_chunks` record
- audit events

The draft planning output includes:

- planning summary
- backlog item suggestions
- problem statement
- suggested scope
- user value
- evidence
- priority
- effort estimate
- human decision needed
- not-in-scope list
- risks
- next questions

## Safety Rules

- Output is draft only.
- Human product-owner approval is required.
- The agent cannot commit roadmap.
- The agent cannot promise features.
- The agent cannot assign deadlines.
- The agent cannot decide final sprint scope.
- Sensitive product decisions still follow approval policy.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open the Agents page.

```text
http://localhost:3000/agents
```

3. In the Product Manager Agent panel, choose a product.

Recommended first test:

```text
MyExpensio
```

4. Enter a planning focus.

Example:

```text
Next improvements after MyExpensio connector MVP
```

5. Enter notes.

Example:

```text
Prioritize support workflow reliability, delivery acknowledgement visibility, payment-failed issue handling, and knowledge gaps. Do not commit public roadmap or pricing changes.
```

6. Click:

```text
Generate backlog suggestions
```

7. Confirm Recent Backlog Suggestions shows a new draft suggestion.

8. Open the Knowledge page.

```text
http://localhost:3000/knowledge
```

9. Confirm the suggestion appears as:

- source type: `backlog suggestion`
- status: `draft`
- product: selected product
- text includes backlog suggestions, evidence, risks, and next questions

10. Open the Agents page again and confirm Recent Runs includes:

```text
Product Manager Agent
```

## Supabase Verification SQL

Recent Product Manager runs:

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
where a.name = 'Product Manager Agent'
order by ar.created_at desc
limit 10;
```

Recent backlog suggestions:

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
where ks.source_type = 'backlog_suggestion'
order by ks.created_at desc
limit 10;
```

## Next Sprint Candidate

Sprint 14 can add a Management Report Agent workflow that summarizes support, connector, QA, knowledge, and planning activity into a weekly owner brief.
