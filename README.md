# Shadow Team

Shadow Team is the company AI Agent Operating System for Effort Edutech / Effort Studio.

The goal is to build a practical company operations layer for multiple products:

- MyExpensio
- AmanahGP
- Contract Diary Platform
- WorkLedger
- Narrio
- Pagecast
- future products

The first milestone is not full autonomy. The first milestone is operational control:

```text
Product Register + Support Inbox + Tickets + AI Draft Reply + Knowledge Base + Analytics + Human Approval
```

## Sprint 0 Status

Sprint 0 is documentation lock:

- master implementation plan
- product register
- product profiles
- agent job descriptions
- support playbook
- approval policy
- database model
- MVP roadmap
- analytics spec
- security and audit spec
- decision log

## Sprint 1 Status

Sprint 1 created and applied the Supabase database foundation for project `mzcdnvtmwyarcefbroja`.

## Sprint 2 Status

Sprint 2 builds the admin dashboard shell in `apps/admin`.

Included:

- Supabase login
- protected owner/admin layout
- active desktop and mobile navigation
- dashboard overview
- product register
- product profile detail pages
- agents read-only view
- settings system status view
- placeholders for support, tickets, analytics, and knowledge

## Sprint 3 Status

Sprint 3 builds the Support Inbox MVP.

Included:

- manual conversation creation
- 3-column support inbox
- message thread
- human replies and internal notes
- status updates
- assign-to-self workflow
- create ticket from conversation
- read-only ticket list

## Sprint 4 Status

Sprint 4 adds safe AI triage and draft replies.

Included:

- OpenAI-backed structured triage
- AI draft reply button in Support Inbox
- internal AI draft messages
- agent run logging
- agent tool call logging
- recent agent runs on Agents page

AI drafts remain internal. Humans still send replies.

## Sprint 5 Status

Sprint 5 adds the Knowledge Base MVP.

Included:

- Knowledge page
- manual FAQ/SOP/policy/user-guide entries
- draft/approved/archive status
- product-specific knowledge
- simple chunk storage
- approved knowledge supplied to AI draft generation
- knowledge citations linked to agent runs

## Sprint 6 Status

Sprint 6 adds the live Analytics Dashboard.

Included:

- support summary cards
- conversation and ticket breakdowns
- AI confidence/risk metrics
- knowledge-grounded run metrics
- product health table
- recent escalations
- recent AI runs

## Sprint 7 Status

Sprint 7 adds the first product connector for MyExpensio.

Included:

- inbound connector API
- shared secret authentication
- service-role server writes
- contact profile creation/update
- support conversation creation
- first user message creation
- connector audit event

Useful commands:

```powershell
npm run admin:dev
npm run admin:build
npm run admin:lint
```

## Build Order

```text
Documents -> Database -> Admin Dashboard -> Support Inbox -> AI Drafting -> Knowledge Base -> Analytics -> Product Connectors -> Department Agents -> Automation
```

Core principle:

```text
AI does the work. Human owns the decision.
```
