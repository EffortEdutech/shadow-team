# Sprint 14: Management Report Agent Workflow

## Goal

Sprint 14 adds the Management Report Agent workflow.

The agent creates draft owner/admin briefs from support, connector, AI, knowledge, QA, and product-planning signals.

This does not make financial, legal, roadmap, release, pricing, refund, certification, or operational decisions.

## Completed Scope

- Added Management Report Agent form to the Agents page.
- Supports company-wide or product-specific report scope.
- Uses conversations, tickets, message delivery metadata, knowledge sources, QA checklists, backlog suggestions, and agent runs.
- Generates a structured owner/admin brief.
- Stores output in `agent_runs`.
- Stores draft report as a `knowledge_sources` record with source type `management_report`.
- Stores readable report body in `knowledge_chunks`.
- Logs `agent_tool_calls` and `audit_events`.
- Shows Recent Management Reports on the Agents page.

## Page

```text
http://localhost:3000/agents
```

## Inputs

| Input | Where It Comes From | Notes |
|---|---|---|
| Scope | Management Report Agent dropdown | Company-wide or one product |
| Period | Management Report Agent form | Example: `last 7 days` |
| Report focus | Management Report Agent form | Example: `weekly owner brief` |
| Notes | Management Report Agent form | Optional |
| Support signals | `conversations`, `tickets`, `messages` | Pulled automatically |
| Connector delivery status | `messages.metadata_json.delivery_status` | Pulled automatically |
| Knowledge/QA/planning | `knowledge_sources` | Pulled automatically |
| Agent activity | `agent_runs` | Pulled automatically |
| OpenAI model | `OPENAI_MODEL` env var | Pulled automatically |

## Output

The workflow creates:

- one `agent_runs` record
- one `agent_tool_calls` record
- one draft `knowledge_sources` record
- one `knowledge_chunks` record
- audit events

The report includes:

- executive summary
- support summary
- connector summary
- AI operations summary
- knowledge summary
- QA and planning summary
- risks
- recommended actions
- open questions

## Safety Rules

- Output is draft only.
- Human owner/admin review is required before sharing.
- The agent cannot make financial decisions.
- The agent cannot make legal, certification, refund, pricing, release, or roadmap decisions.
- Recommended actions are suggestions only.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open the Agents page.

```text
http://localhost:3000/agents
```

3. In the Management Report Agent panel, choose scope.

Recommended first test:

```text
Company-wide
```

4. Use this period:

```text
last 7 days
```

5. Use this report focus:

```text
weekly owner brief
```

6. Enter notes.

Example:

```text
Summarize support activity, connector health, AI workflow progress, knowledge gaps, QA/planning outputs, and risks. Do not make roadmap, pricing, refund, legal, or release decisions.
```

7. Click:

```text
Generate management report
```

8. Confirm Recent Management Reports shows a new draft report.

9. Open the Knowledge page.

```text
http://localhost:3000/knowledge
```

10. Confirm the report appears as:

- source type: `management report`
- status: `draft`
- product: company-wide or selected product
- text includes executive summary, risks, recommended actions, and open questions

11. Open the Agents page again and confirm Recent Runs includes:

```text
Management Report Agent
```

## Supabase Verification SQL

Recent Management Report runs:

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
where a.name = 'Management Report Agent'
order by ar.created_at desc
limit 10;
```

Recent management reports:

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
where ks.source_type = 'management_report'
order by ks.created_at desc
limit 10;
```

## Next Sprint Candidate

Sprint 15 can add a simple Approvals Inbox to review and approve/reject AI-created draft knowledge, QA checklists, backlog suggestions, and management reports.
