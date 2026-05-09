# Sprint 18: Daily Brief / Operator Dashboard

## Goal

Sprint 18 turns the Dashboard into the operator's daily brief.

The dashboard should answer:

- What needs human attention today?
- Which support items are urgent or stale?
- Which AI-created drafts need approval?
- Are any release gates waiting?
- Are any connector deliveries failing?
- Are any high-risk AI outputs waiting for review?

## Completed Scope

Implemented in `apps/admin/src/app/(admin)/dashboard/page.tsx`:

- Daily Brief dashboard title and operator-focused copy
- attention summary cards
- high-priority support count
- pending approval count
- AI runs in the last 24 hours
- morning readout with product monitoring count
- top-risk callouts for failed deliveries, release readiness, stale support, and high-risk AI review
- priority support panel
- approval decisions panel
- release gate panel
- delivery and AI review panel
- stale conversations panel
- open tickets panel
- links back to source workflows

## Data Sources

The Daily Brief reads from existing tables only:

- `conversations`
- `tickets`
- `knowledge_sources`
- `messages`
- `agent_runs`
- `products`

No new database migration was required.

## Safety Boundary

The Daily Brief is read-only.

It does not:

- approve or reject drafts
- change release readiness status
- send replies
- acknowledge delivery
- close tickets
- assign owners
- change conversation status

All decisions still happen in the source workflows.

## Manual Test

1. Start the admin app.

   ```powershell
   npm run admin:dev
   ```

2. Open:

   ```text
   http://localhost:3000/dashboard
   ```

3. Confirm the page title is `Daily Brief`.

4. Confirm the summary cards appear:

   - Needs attention
   - High-priority support
   - Pending approvals
   - AI runs last 24h

5. Confirm the morning readout appears.

6. Confirm these panels appear:

   - Priority Support
   - Approval Decisions
   - Release Gate
   - Delivery And AI Review
   - Stale Conversations
   - Open Tickets

7. Click dashboard items and confirm they route to the correct source pages:

   - support conversations -> `/support?conversation=...`
   - approval decisions -> `/approvals?status=draft`
   - release gate -> `/approvals?status=draft`
   - failed deliveries -> `/support?conversation=...`
   - high-risk AI review -> `/agents`
   - tickets -> `/tickets`
   - full queue -> `/work-queue`

8. Confirm no records are modified just by opening or clicking dashboard links.

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before committing.

## Next Sprint Candidate

Sprint 19 can add operator notes and ownership:

- assign human owner to work items
- mark item as reviewed for today
- daily operator note
- per-product operating status
- owner-facing follow-up reminders
