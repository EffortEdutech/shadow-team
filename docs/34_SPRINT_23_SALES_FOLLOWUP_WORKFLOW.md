# Sprint 23: Sales Follow-up Workflow

## Goal

Sprint 23 connects marketing activity to sales follow-up without building a full CRM.

The workflow tracks a lead/follow-up opportunity and generates a draft message for human review.

## Completed Scope

Implemented:

- `sales_followups` table
- `sales_followup_drafts` table
- `Sales Follow-up Agent` seed
- `/marketing/follow-ups` page
- link from `/marketing` to Sales Follow-ups
- create follow-up form
- follow-up queue
- AI follow-up draft generation
- agent run logging
- agent tool call logging
- audit events

## Database Change

Run this file in Supabase SQL Editor:

```text
supabase/sprint_23_sales_followup_workflow.sql
```

Sprint 20 marketing foundation must already be applied.

## Safety Boundary

Sprint 23 does not send messages.

AI may:

- draft a follow-up subject
- draft a follow-up body
- recommend a next step
- classify lead temperature
- summarize safety notes

AI may not:

- send email
- send WhatsApp or social DMs
- make pricing commitments
- offer discounts
- promise outcomes
- approve refunds
- make legal, financial, tax, certification, or contract claims

## Manual Test

1. Apply the SQL file:

   ```text
   supabase/sprint_23_sales_followup_workflow.sql
   ```

2. Open:

   ```text
   http://localhost:3000/marketing/follow-ups
   ```

3. Create a follow-up with:

   - product
   - optional campaign
   - contact name
   - product interest
   - lead source
   - priority
   - context

4. Confirm the follow-up appears in the queue.

5. Click:

   ```text
   Generate AI follow-up draft
   ```

6. Confirm:

   - draft subject appears
   - draft body appears
   - status changes to `drafted`
   - agent run appears on `/agents`
   - no email or external message is sent

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before committing.

## Next Sprint Candidate

Sprint 24 should add Marketing Analytics:

- campaign counts
- content counts by status
- channel breakdown
- follow-up counts
- AI marketing run counts
- blocked approval counts
