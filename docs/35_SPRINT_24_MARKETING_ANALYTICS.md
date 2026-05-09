# Sprint 24: Marketing Analytics

## Goal

Sprint 24 adds a focused marketing analytics dashboard for the growth layer.

The dashboard measures:

- campaign volume
- content draft volume
- content status
- channel mix
- sales follow-up volume
- marketing AI runs
- unscheduled and unapproved content
- future connector readiness

## Completed Scope

Implemented:

- `/marketing/analytics` page
- Marketing Analytics link from `/marketing`
- campaign count
- content draft count
- sales follow-up count
- marketing AI run count
- unscheduled draft count
- review-needed count
- connector-ready count
- readiness blocker count
- campaign status breakdown
- content status breakdown
- channel mix breakdown
- follow-up status breakdown
- content type breakdown
- product activity breakdown
- recent marketing drafts panel
- recent marketing AI runs panel
- social connector prep panel

## Database Change

No new database table is required.

Sprint 24 reads existing tables:

- `marketing_campaigns`
- `marketing_content_drafts`
- `marketing_channels`
- `sales_followups`
- `agent_runs`
- `agents`
- `products`

## Safety Boundary

Marketing Analytics is read-only.

It does not:

- publish content
- approve content
- send follow-ups
- change campaign status
- change content status
- connect to social APIs

## Sprint 25 Prep Included

This sprint includes a small connector-readiness panel.

Future social connectors should only pull content that is:

- approved
- scheduled
- assigned to a channel

The analytics page now shows:

- connector-ready content
- content that needs scheduling
- content that still needs approval

No connector is implemented yet.

## Manual Test

1. Open:

   ```text
   http://localhost:3000/marketing
   ```

2. Click:

   ```text
   Marketing Analytics
   ```

3. Confirm this opens:

   ```text
   http://localhost:3000/marketing/analytics
   ```

4. Confirm summary cards appear:

   - Campaigns
   - Content Drafts
   - Sales Follow-ups
   - Marketing AI Runs
   - Unscheduled Drafts
   - Review Needed
   - Connector-Ready
   - Readiness Blockers

5. Confirm breakdown panels appear:

   - Campaign Status
   - Content Status
   - Channel Mix
   - Follow-up Status
   - Content Types
   - Product Activity

6. Confirm recent marketing drafts appear.

7. Confirm recent marketing AI runs appear after social/follow-up AI runs exist.

8. Confirm no data changes when opening the page.

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before committing.

## Next Sprint Candidate

Sprint 25 can add Social Connector Prep:

- social outbox table
- delivery status fields
- approved/scheduled-only pull API
- no public posting yet
