# MVP Roadmap

## MVP Goal

Build the smallest useful Shadow Team system:

```text
Admin Dashboard + Product Register + Support Inbox + Tickets + AI Draft Reply + Basic Analytics + Marketing Draft Workflow
```

## Sprint 0 - Documentation Lock

Deliver:

- master blueprint
- implementation plan
- product register
- product profiles
- agent job descriptions
- support playbook
- approval policy
- database model
- analytics spec
- security and audit spec
- decision log

Exit criteria:

- every initial product has a profile
- approval rules are clear
- MVP scope is locked

## Sprint 1 - Database Foundation

Deliver:

- Supabase schema
- migrations
- seed products
- RLS policies
- roles
- audit events

Exit criteria:

- support records can be created, read, updated, assigned, and audited

## Sprint 2 - Admin Dashboard Shell

Deliver:

- Next.js admin app
- login
- sidebar navigation
- product register page
- placeholder routes for support, tickets, analytics, knowledge, agents, settings

Exit criteria:

- admin can log in and navigate

## Sprint 3 - Support Inbox

Deliver:

- 3-column inbox
- conversation list
- message thread
- user/product info panel
- human reply composer
- internal notes
- assignment and status changes
- ticket creation
- manual conversation creation

Exit criteria:

- human support workflow works without AI

## Sprint 4 - AI Drafting

Deliver:

- product classifier
- intent classifier
- risk classifier
- draft reply generator
- escalation logic
- agent run logs

Exit criteria:

- AI can draft support replies for human review

## Sprint 5 - Knowledge Base

Deliver:

- knowledge source records
- FAQ manager
- SOP manager
- simple search
- knowledge gap tracking

Exit criteria:

- AI drafts from approved product knowledge

## Sprint 6 - Analytics

Deliver:

- dashboard cards
- support volume
- AI vs human
- handoff rate
- response time
- resolution time
- top issues
- knowledge gaps
- agent performance

Exit criteria:

- owner can measure AI and support performance

## Sprint 7 - MyExpensio Connector

Deliver:

- first product connector
- product context intake
- conversation creation from product app
- reply/status return path

Exit criteria:

- real product conversation enters central support inbox

## Strategic Reset After Sprint 19

The first 19 sprints created the operating spine for support, approvals, department agents, work queue, daily brief, and reviewed-today tracking.

The next sprint sequence must add the missing growth layer:

```text
Product Marketing -> Social Media Drafts -> Campaign Calendar -> Sales Follow-up -> Marketing Analytics
```

## Sprint 20 - Marketing Foundation

Deliver:

- marketing profile model
- campaign model
- social content draft model
- channel list
- product positioning fields
- approval status for marketing drafts

Exit criteria:

- each product can have marketing positioning and social channel settings
- content/campaign records can be created without public posting

## Sprint 21 - Social Media Draft Workflow

Deliver:

- Product Marketing Agent workflow
- Social Media Content Agent workflow
- draft posts by product and channel
- reusable campaign context
- approval-ready marketing drafts

Exit criteria:

- AI can draft social posts for human review
- no public publishing happens automatically

## Sprint 22 - Campaign Calendar

Deliver:

- calendar/list view of planned content
- product/channel filters
- campaign status
- content status
- links to approval workflow

Exit criteria:

- operator can see what content is planned, drafted, approved, or blocked

## Sprint 23 - Sales Follow-up Workflow

Deliver:

- lead follow-up draft workflow
- campaign/source context
- product interest tracking
- human-reviewed follow-up drafts

Exit criteria:

- sales follow-up becomes trackable without becoming a full CRM

## Sprint 24 - Marketing Analytics

Deliver:

- campaign count
- draft/approved/published status counts
- channel breakdown
- product marketing activity
- placeholders for future connector metrics

Exit criteria:

- owner can see whether marketing work is happening and where it is blocked
