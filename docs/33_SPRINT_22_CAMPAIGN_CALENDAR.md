# Sprint 22: Campaign Calendar

## Goal

Sprint 22 adds planning visibility for marketing work.

The Campaign Calendar shows planned content by:

- product
- channel
- status
- planned date
- campaign

## Completed Scope

Implemented:

- `/marketing/calendar` page
- Campaign Calendar link from `/marketing`
- product filter
- channel filter
- status filter
- visible draft count
- approved count
- unscheduled count
- campaign count
- content grouped by planned date
- unscheduled content group
- campaign side panel

## Database Change

No new database table is required.

Sprint 22 uses the Sprint 20 marketing tables:

- `marketing_campaigns`
- `marketing_content_drafts`
- `marketing_channels`
- `products`

## Safety Boundary

The Campaign Calendar is read-only.

It does not:

- publish content
- approve content
- archive content
- change planned dates
- send social posts
- connect to social APIs

All creation and editing remains in the Marketing workspace for now.

## Manual Test

1. Open:

   ```text
   http://localhost:3000/marketing
   ```

2. Click:

   ```text
   Campaign Calendar
   ```

3. Confirm this page opens:

   ```text
   http://localhost:3000/marketing/calendar
   ```

4. Confirm summary cards appear:

   - Visible drafts
   - Approved
   - Unscheduled
   - Campaigns

5. Test filters:

   - product
   - channel
   - status

6. Confirm content appears grouped by planned date.

7. Confirm unscheduled content appears under `Unscheduled`.

8. Confirm no content status changes just by opening or filtering the calendar.

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before committing.

## Next Sprint Candidate

Sprint 23 should add Sales Follow-up Workflow:

- lead/follow-up draft model
- product interest
- source campaign
- AI follow-up draft
- human review before sending
