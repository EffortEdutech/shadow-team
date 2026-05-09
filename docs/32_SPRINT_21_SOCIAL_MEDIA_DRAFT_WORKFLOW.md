# Sprint 21: Social Media Draft Workflow

## Goal

Sprint 21 adds the first AI-assisted social media workflow.

The workflow generates draft-only social/content posts from:

- product profile
- marketing profile
- campaign context
- selected channels
- recent marketing drafts
- recent support signals
- human content goal and notes

## Completed Scope

Implemented:

- `Product Marketing Agent` seed SQL
- `Social Media Content Agent` seed SQL
- `/marketing` AI Social Drafts form
- multi-channel draft generation
- OpenAI structured output for social media drafts
- draft records in `marketing_content_drafts`
- agent run logging
- agent tool call logging
- audit events for AI-created drafts and human request
- strict draft-only metadata

## Database Change

Run this file in Supabase SQL Editor:

```text
supabase/sprint_21_social_media_agents.sql
```

Sprint 20 SQL must already be applied:

```text
supabase/sprint_20_marketing_foundation.sql
```

## Safety Boundary

Sprint 21 does not publish content.

AI may:

- draft social posts
- adapt tone by channel
- suggest campaign angles
- include human review notes
- use marketing profile value propositions

AI may not:

- publish social posts
- send emails
- post to public social APIs
- make unsupported claims
- mention private customer data
- promise pricing, refunds, tax outcomes, certification, legal outcomes, or payments
- bypass human approval

## Manual Test

1. Ensure Sprint 20 SQL has been applied.

2. Apply Sprint 21 SQL:

   ```text
   supabase/sprint_21_social_media_agents.sql
   ```

3. Open:

   ```text
   http://localhost:3000/marketing
   ```

4. Confirm the `AI Social Drafts` form appears.

5. Confirm the selected product has a marketing profile.

6. Select:

   - product
   - campaign, optional
   - one or more channels

7. Enter a content goal and optional notes.

8. Click:

   ```text
   Generate AI social drafts
   ```

9. Confirm:

   - new drafts appear in Recent Content Drafts
   - drafts stay in `draft` status
   - agent run appears on Agents page
   - no content is published externally

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before committing.

## Next Sprint Candidate

Sprint 22 should add the Campaign Calendar:

- planned content list/calendar
- product filter
- channel filter
- draft/review/approved status filter
- planned date visibility
- links back to content drafts
