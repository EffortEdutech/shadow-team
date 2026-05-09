# Sprint 17: Human Work Queue

## Goal

Sprint 17 adds a daily command center for human-required work.

The Work Queue collects important human action items from support, approvals, release readiness, connector delivery, AI review, and tickets.

This sprint does not add automation. It improves visibility and control.

## Completed Scope

- Added `/work-queue` page.
- Added Work Queue navigation item.
- Shows total open human work items.
- Groups work into:
  - High-priority support
  - Pending approvals
  - Release readiness drafts
  - Failed connector deliveries
  - High-risk AI review
  - Open tickets
- Links each work item back to its source page.
- Keeps the page read-only.

## Page

```text
http://localhost:3000/work-queue
```

## Work Sources

| Queue | Source |
|---|---|
| High-priority support | `conversations` with `open`/`escalated` and `high`/`urgent` |
| Pending approvals | AI-created `knowledge_sources.status = draft` |
| Release readiness | `knowledge_sources.source_type = release_readiness` and `draft` |
| Failed connector deliveries | human external `messages` with `delivery_status = failed` |
| High-risk AI review | `agent_runs` with `human_required = true` and high/critical risk |
| Open tickets | `tickets` with open/pending/escalated status |

## Safety Rules

- Work Queue is read-only.
- It does not approve, reject, send, close, or automate anything.
- Humans still make decisions on the source pages.
- Queue links preserve the existing approval/support workflows.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Open Work Queue.

```text
http://localhost:3000/work-queue
```

3. Confirm the page shows:

- total open human work items
- High-Priority Support
- Pending Approvals
- Release Readiness
- Failed Connector Deliveries
- High-Risk AI Review
- Open Tickets

4. Click a support item.

Expected:

```text
/support?conversation=<conversationId>
```

5. Click a pending approval item.

Expected:

```text
/approvals?status=draft
```

6. Click a ticket item.

Expected:

```text
/tickets
```

7. Confirm no item is changed just by viewing the Work Queue.

## Next Sprint Candidate

Sprint 18 can add a Daily Brief on the dashboard, using the Work Queue counts plus management report summaries to show what the owner should do first.
