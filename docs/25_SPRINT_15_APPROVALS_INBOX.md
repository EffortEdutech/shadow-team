# Sprint 15: Approvals Inbox

## Goal

Sprint 15 adds a central Approvals Inbox for AI-created operating drafts.

This gives humans one place to review, approve, reject/archive, or keep draft outputs before they become official knowledge or operating assets.

## Completed Scope

- Added `/approvals` page.
- Added Approvals navigation item.
- Lists AI-created draft/output sources from:
  - Knowledge Curator Agent
  - QA Checklist Agent
  - Product Manager Agent
  - Management Report Agent
- Shows source text, product, source type, status, origin agent, and updated date.
- Supports decisions:
  - keep draft
  - approve
  - reject/archive
- Stores decision details in `knowledge_sources.metadata_json`.
- Updates `knowledge_sources.status`.
- Logs `approval_decision_recorded` audit events.

## Page

```text
http://localhost:3000/approvals
```

## Included AI Draft Sources

The Approvals Inbox includes `knowledge_sources` where:

```text
metadata_json.created_from in:
- knowledge_curator_agent
- qa_checklist_agent
- product_manager_agent
- management_report_agent
```

## Decision Mapping

| Decision | Stored Status | Metadata Approval Status |
|---|---|---|
| Keep draft | `draft` | `needs_revision` |
| Approve | `approved` | `approved` |
| Reject / archive | `archived` | `rejected` |

## Metadata Written

```json
{
  "approval_status": "approved",
  "approval_decided_at": "2026-05-09T00:00:00.000Z",
  "approval_decided_by": "user-id",
  "approval_notes": "Reviewed and approved."
}
```

## Safety Rules

- Approval is always a human action.
- AI cannot approve its own outputs.
- Rejected items are archived, not deleted.
- Approval decisions are audit logged.
- Approving a source makes it eligible for approved-knowledge workflows if the source type is used there.
- Management reports, QA checklists, and backlog suggestions can be approved as internal operating assets, but approval does not mean public publication.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open Approvals.

```text
http://localhost:3000/approvals
```

3. Confirm AI-created items appear.

Expected source types may include:

- `knowledge gap`
- `qa checklist`
- `backlog suggestion`
- `management report`

4. Open one draft item and choose:

```text
Approve
```

5. Add approval notes.

Example:

```text
Reviewed by owner. Good for internal approved knowledge/use.
```

6. Click:

```text
Save decision
```

7. Confirm the item status changes to `approved`.

8. Test another item with:

```text
Reject / archive
```

9. Confirm the item status changes to `archived`.

10. Open Knowledge page.

```text
http://localhost:3000/knowledge
```

11. Confirm the status matches the approval decision.

## Supabase Verification SQL

Recent approval decisions:

```sql
select
  event_type,
  entity_type,
  entity_id,
  metadata_json,
  created_at
from public.audit_events
where event_type = 'approval_decision_recorded'
order by created_at desc
limit 20;
```

Approved AI-created sources:

```sql
select
  source_title,
  source_type,
  status,
  metadata_json ->> 'created_from' as created_from,
  metadata_json ->> 'approval_status' as approval_status,
  metadata_json ->> 'approval_notes' as approval_notes,
  updated_at
from public.knowledge_sources
where metadata_json ? 'created_from'
order by updated_at desc
limit 20;
```

## Next Sprint Candidate

Sprint 16 can add Product Release Readiness, combining QA checklists, approvals, backlog suggestions, and support risk into a controlled release gate.
