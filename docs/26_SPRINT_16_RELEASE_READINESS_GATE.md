# Sprint 16: Release Readiness Gate

## Goal

Sprint 16 adds a Release Readiness Gate.

The Release Readiness Agent drafts a release-readiness report from QA evidence, approvals, support risk, knowledge readiness, backlog suggestions, and recent agent activity.

This does not approve releases or make go/no-go decisions.

## Completed Scope

- Added Release Readiness Agent profile and seed entry.
- Added Release Readiness Agent form to the Agents page.
- Uses product, release scope, notes, conversations, tickets, knowledge sources, approvals, QA checklists, backlog suggestions, and agent runs.
- Generates structured release readiness reports.
- Stores output in `agent_runs`.
- Stores draft report as `knowledge_sources.source_type = release_readiness`.
- Stores readable report body in `knowledge_chunks`.
- Logs `agent_tool_calls` and `audit_events`.
- Shows Recent Release Readiness reports on the Agents page.
- Includes release readiness reports in Approvals Inbox.

## Page

```text
http://localhost:3000/agents
```

## Inputs

| Input | Where It Comes From | Notes |
|---|---|---|
| Product | Release Readiness Agent dropdown | Required |
| Release scope | Release Readiness Agent form | Required |
| Notes | Release Readiness Agent form | Optional |
| Support risk | `conversations`, `tickets` | Pulled automatically |
| QA evidence | `knowledge_sources.source_type = qa_checklist` | Pulled automatically |
| Approval state | `knowledge_sources.status`, `metadata_json.approval_status` | Pulled automatically |
| Backlog suggestions | `knowledge_sources.source_type = backlog_suggestion` | Pulled automatically |
| Knowledge readiness | `knowledge_sources` | Pulled automatically |
| Agent activity | `agent_runs` | Pulled automatically |

## Output

The workflow creates:

- one `agent_runs` record
- one `agent_tool_calls` record
- one draft `knowledge_sources` record
- one `knowledge_chunks` record
- audit events

The report includes:

- release summary
- readiness decision for human review
- evidence reviewed
- QA status
- approval status
- support risk
- knowledge readiness
- blockers
- required actions
- go/no-go questions

## Safety Rules

- Output is draft only.
- Human release owner approval is required.
- The agent cannot approve releases.
- The agent cannot deploy software.
- The agent cannot make final go/no-go decisions.
- Missing evidence should produce `not_ready` or `blocked`.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open the Agents page.

```text
http://localhost:3000/agents
```

3. In the Release Readiness Agent panel, choose a product.

Recommended first test:

```text
MyExpensio
```

4. Enter release scope.

Example:

```text
MyExpensio connector MVP release
```

5. Enter notes.

Example:

```text
Check support risk, approved QA checklists, delivery acknowledgement status, pending approvals, knowledge coverage, and whether there are blockers. Do not make the final release decision.
```

6. Click:

```text
Generate release readiness report
```

7. Confirm Recent Release Readiness shows a new draft report.

8. Open Knowledge.

```text
http://localhost:3000/knowledge
```

9. Confirm the report appears as:

- source type: `release readiness`
- status: `draft`
- product: selected product

10. Open Approvals.

```text
http://localhost:3000/approvals
```

11. Confirm the release readiness draft appears for review.

12. Human can approve, reject/archive, or keep draft.

## Supabase Verification SQL

Recent Release Readiness runs:

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
where a.name = 'Release Readiness Agent'
order by ar.created_at desc
limit 10;
```

Recent release readiness reports:

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
where ks.source_type = 'release_readiness'
order by ks.created_at desc
limit 10;
```

## Next Sprint Candidate

Sprint 17 can add a lightweight Work Queue that groups pending human work across support, approvals, release readiness, and escalations.
