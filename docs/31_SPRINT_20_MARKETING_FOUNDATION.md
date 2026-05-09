# Sprint 20: Marketing Foundation

## Goal

Sprint 20 adds the first product marketing operations layer.

This sprint does not publish to social media. It creates the safe foundation for:

- marketing profiles
- social/content channels
- campaigns
- content drafts
- approval-ready marketing work

## Completed Scope

Implemented:

- `marketing_profiles` SQL table
- `marketing_channels` SQL table
- `marketing_campaigns` SQL table
- `marketing_content_drafts` SQL table
- default draft channels: LinkedIn, Facebook, X, Instagram, TikTok, Email, Community
- `/marketing` page
- Marketing navigation item
- product marketing profile form
- draft campaign form
- draft content form
- recent campaign list
- recent content draft list
- audit events for marketing profile, campaign, and content draft creation

## Database Change

Run this file in Supabase SQL Editor:

```text
supabase/sprint_20_marketing_foundation.sql
```

## Safety Boundary

Sprint 20 is draft-only.

It does not:

- publish social posts
- send emails
- connect to social media APIs
- run paid ads
- approve marketing drafts
- make official public claims automatically

Humans still own all external publishing decisions.

## Manual Test

1. Apply the SQL file in Supabase:

   ```text
   supabase/sprint_20_marketing_foundation.sql
   ```

2. Refresh or restart the admin app.

3. Open:

   ```text
   http://localhost:3000/marketing
   ```

4. Confirm the Marketing navigation item appears.

5. Save a marketing profile for one product.

6. Create a draft campaign.

7. Create a draft content item.

8. Confirm:

   - profile count increases
   - campaign appears in Recent Campaigns
   - content appears in Recent Content Drafts
   - statuses remain draft
   - nothing is published externally

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Both must pass before commit.

## Next Sprint Candidate

Sprint 21 should add the Social Media Draft Workflow:

- Product Marketing Agent
- Social Media Content Agent
- AI-generated draft posts
- approved marketing profile context
- approval handoff before publishing
