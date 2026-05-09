# Sprint 19: Operator Ownership / Reviewed Today Workflow

## Goal

Sprint 19 adds a lightweight operator layer above the Work Queue.

The goal is not to approve, reject, send, close, or resolve work automatically.

The goal is to let a human operator record:

- this item was reviewed today
- this item is owned by the current operator
- an optional handoff note for today's review

## Completed Scope

Implemented:

- `work_item_reviews` table SQL
- Work Queue reviewed-today count
- per-item review controls on `/work-queue`
- owner badge
- reviewed-today badge
- optional operator note
- audit event when a work item is reviewed
- Daily Brief `Reviewed today` metric
- Daily Brief morning readout includes reviewed-today progress

## Database Change

Run this file in Supabase SQL Editor:

```text
supabase/sprint_19_work_item_reviews.sql
```

The table is generic so it can track all current work item types:

- conversation
- approval
- release_readiness
- delivery
- agent_run
- ticket

## Safety Boundary

This workflow is operational tracking only.

It does not:

- approve knowledge
- reject knowledge
- change release readiness decisions
- send customer replies
- acknowledge connector delivery
- close tickets
- change conversation status
- alter AI outputs

Source workflow decisions still happen in their original pages.

## Manual Test

1. Apply the SQL file in Supabase:

   ```text
   supabase/sprint_19_work_item_reviews.sql
   ```

2. Restart or refresh the admin app.

3. Open:

   ```text
   http://localhost:3000/work-queue
   ```

4. Confirm the top summary shows:

   - Open human work items
   - Reviewed today

5. Find any queue item.

6. Add an operator note.

7. Click `Mark reviewed today`.

8. Confirm:

   - badge changes to `reviewed by you today`
   - badge changes to `owned by you`
   - Reviewed today count increases
   - the item source link still opens the original workflow

9. Open:

   ```text
   http://localhost:3000/dashboard
   ```

10. Confirm:

   - `Reviewed today` card appears
   - Morning Readout includes reviewed-today count

11. Confirm no business status changed in Support, Approvals, Tickets, or Agents.

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before committing.

## Next Sprint Candidate

Sprint 20 can add Daily Operator Notes:

- one daily note per operator
- blockers
- next actions
- tomorrow carry-forward
- owner/admin operating history
