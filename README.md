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

## Sprint 8 Status

Sprint 8 adds the human reply outbox for MyExpensio.

Included:

- authenticated connector response path
- pull-based human reply outbox
- cursor support with `since`
- external human replies only
- internal notes and AI drafts excluded
- `outboxUrl` returned from inbound connector creation

## Sprint 9 Status

Sprint 9 adds delivery acknowledgement for the MyExpensio connector.

Included:

- delivery acknowledgement API
- delivered/failed status stored on reply messages
- delivery status included in outbox responses
- delivery badges in Support Inbox
- MyExpensio connector counts in Settings
- audit event for delivery acknowledgements

## Sprint 10 Status

Sprint 10 adds department agent profiles and the first non-support operational agents.

Included:

- department agent profile registry
- richer Agents page profile display
- Sales and Growth agents
- Product Operations agent
- QA and Testing agent
- Knowledge Curator agent
- Management Report agent
- Compliance Triage agent
- Repo Analyst agent
- draft-only product access for all six products

## Sprint 11 Status

Sprint 11 adds the first non-support operational workflow: Knowledge Curator.

Included:

- Knowledge Curator Agent form on the Knowledge page
- recent support signal review
- existing knowledge review
- AI-generated draft knowledge sources
- draft-only knowledge chunks
- agent run and tool-call logging
- audit events for curator requests
- human approval before knowledge is approved

## Sprint 12 Status

Sprint 12 adds the QA Checklist Agent workflow.

Included:

- QA Checklist Agent form on the Agents page
- product and feature scope input
- recent ticket and conversation context
- AI-generated draft manual test checklists
- draft `qa_checklist` knowledge sources
- agent run and tool-call logging
- audit events for QA checklist requests
- human QA review before release evidence

## Sprint 13 Status

Sprint 13 adds the Product Manager Agent workflow.

Included:

- Product Manager Agent form on the Agents page
- product and planning focus input
- support, ticket, knowledge, QA, and agent-run context
- AI-generated draft backlog suggestions
- draft `backlog_suggestion` knowledge sources
- agent run and tool-call logging
- audit events for product planning requests
- human product-owner approval before roadmap commitment

## Sprint 14 Status

Sprint 14 adds the Management Report Agent workflow.

Included:

- Management Report Agent form on the Agents page
- company-wide or product-specific report scope
- support, connector, AI, knowledge, QA, and planning context
- AI-generated draft owner/admin brief
- draft `management_report` knowledge sources
- agent run and tool-call logging
- audit events for management report requests
- human owner/admin review before sharing

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
