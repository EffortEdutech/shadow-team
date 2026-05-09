# Sprint 11: Knowledge Curator Workflow

## Goal

Sprint 11 adds the first non-support operational agent workflow.

The Knowledge Curator Agent reviews recent support signals and existing knowledge, then creates a draft knowledge source for human review.

This does not approve or publish knowledge automatically.

## Completed Scope

- Added Knowledge Curator Agent workflow to the Knowledge page.
- Uses recent conversations, messages, product context, and existing knowledge.
- Creates a draft `knowledge_sources` record.
- Creates one draft `knowledge_chunks` record.
- Logs an `agent_runs` record for the Knowledge Curator Agent.
- Logs an `agent_tool_calls` record for draft knowledge creation.
- Logs audit events for AI draft creation and human request.

## Page

```text
http://localhost:3000/knowledge
```

## Inputs

| Input | Where It Comes From | Notes |
|---|---|---|
| Product | Knowledge page product dropdown | Optional; empty means company-wide |
| Focus | Knowledge Curator form | Example: `payment failed support questions` |
| Recent support signals | `conversations` and `messages` tables | Pulled automatically |
| Existing knowledge | `knowledge_sources` table | Pulled automatically |
| OpenAI model | `OPENAI_MODEL` env var | Defaults from app config |

## Output

The workflow creates:

- one draft knowledge source
- one knowledge chunk
- one agent run
- one tool call
- audit events

The draft source includes:

- problem summary
- draft FAQ/SOP/knowledge-gap text
- curator reasoning
- human approval requirement

## Safety Rules

- Suggested knowledge is always `draft`.
- A human must approve before the source can be used as approved knowledge.
- The agent must avoid final legal, financial, religious, certification, tax, contract, refund, or claim decisions.
- Sensitive topics should be written as fact-collection and escalation guidance.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open the Knowledge page.

```text
http://localhost:3000/knowledge
```

3. In the Knowledge Curator Agent panel, choose a product.

Recommended first test:

```text
MyExpensio
```

4. Enter a focus.

Example:

```text
payment failed support questions and missing FAQ
```

5. Click:

```text
Generate draft knowledge
```

6. Confirm a new draft knowledge source appears near the top.

Expected:

- status: `draft`
- source type: likely `faq`, `sop`, or `knowledge gap`
- product: selected product or company-wide
- text includes problem summary, draft knowledge, curator reasoning, and human approval requirement

7. Open the Agents page.

```text
http://localhost:3000/agents
```

8. Confirm Recent Runs includes `Knowledge Curator Agent`.

9. Only after review, manually change the knowledge source status from `draft` to `approved`.

## Supabase Verification SQL

Recent Knowledge Curator runs:

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
where a.name = 'Knowledge Curator Agent'
order by ar.created_at desc
limit 10;
```

Recent agent-created knowledge:

```sql
select
  ks.id,
  p.slug as product_slug,
  ks.source_type,
  ks.source_title,
  ks.status,
  ks.metadata_json,
  ks.created_at
from public.knowledge_sources ks
left join public.products p on p.id = ks.product_id
where ks.metadata_json ->> 'created_from' = 'knowledge_curator_agent'
order by ks.created_at desc
limit 10;
```

## Next Sprint Candidate

Sprint 12 can add the QA Checklist Agent workflow, using product scope or support tickets to generate manual test checklists.
