# MVP Roadmap

## MVP Goal

Build the smallest useful Shadow Team system:

```text
Admin Dashboard + Product Register + Support Inbox + Tickets + AI Draft Reply + Basic Analytics
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

