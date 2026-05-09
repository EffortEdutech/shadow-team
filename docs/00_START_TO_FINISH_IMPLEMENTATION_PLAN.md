# Start to Finish Implementation Plan

## 1. Project North Star

Build a company-wide AI Agent Operating System that helps operate multiple products with a small team.

The system must first create operational control, then add AI, then add automation.

Core principle:

```text
AI does the work. Human owns the decision.
```

This project is the missing company operations layer for:

- support
- product onboarding
- product marketing and social media marketing
- sales follow-up
- documentation
- QA
- product management
- analytics
- finance/admin reminders
- compliance review
- technical operations

Marketing is not a later decoration. It is one of the main operating surfaces because every product needs repeatable positioning, social content, campaign planning, lead capture, and human-approved publishing.

## 2. Non-Negotiable Early Decisions

| Area | Decision |
|---|---|
| Repo strategy | Use this dedicated repo first: `shadow-team`. It can later move into a company monorepo. |
| Architecture | Build modular monorepo style from day one, even if the MVP is small. |
| First UI | Build the admin dashboard and support inbox first, not public marketing pages. |
| First AI behavior | AI drafts and classifies first. It does not auto-send until reviewed. |
| First channels | Start with manual/admin-created conversations and web/in-app chat. WhatsApp comes later. |
| Marketing channels | Start with draft-only social/content planning. No public posting until approval and channel connectors exist. |
| Database | Use Supabase Postgres first. Add pgvector/search later when documents are stable. |
| Realtime | Use Supabase Realtime first. Custom WebSocket gateway can wait. |
| Auth | Use Supabase Auth and role-based access. |
| Audit | Log agent runs, tool calls, decisions, approvals, and human overrides from the beginning. |
| Safety | High-risk products require human approval gates. |

## 3. Recommended Repo Structure

```text
shadow-team/
  apps/
    admin/
    widget/
  packages/
    agents/
    db/
    ui/
    knowledge/
    integrations/
    marketing/
  docs/
    products/
  supabase/
    migrations/
    seed.sql
```

## 4. Phase Plan

### Phase 0 - Planning Lock

Deliver product register, product profiles, support taxonomy, risk rules, approval policy, data model, MVP roadmap, and decision log.

Exit criteria:

- every initial product has a profile
- high-risk decisions have approval rules
- MVP is separated from later ideas

Do not build yet:

- WhatsApp integration
- auto-send AI replies
- advanced RAG
- department agents
- custom WebSocket infrastructure

### Phase 1 - Database Foundation

Build Supabase schema, seed products, roles, RLS policies, and audit tables.

Core tables:

- products
- product_profiles
- contact_profiles
- conversations
- messages
- tickets
- conversation_tags
- ticket_events
- audit_events
- agent_runs
- agent_tool_calls
- agent_approvals

### Phase 2 - Admin Dashboard Shell

Build login, navigation, product register, support, tickets, analytics, knowledge, agents, and settings pages.

### Phase 3 - Support Inbox MVP

Build the 3-column inbox, message thread, user/product panel, reply composer, internal notes, assignment, status updates, ticket creation, and manual test conversation creation.

### Phase 4 - AI Triage and Draft Reply

Add product classification, intent classification, risk classification, draft replies, conversation summaries, escalation recommendations, and agent run logs.

AI may draft. Human sends.

### Phase 5 - Knowledge Base MVP

Add knowledge sources, FAQ manager, SOP manager, simple search, source versioning, and knowledge gap tracking.

Start with structured docs and text search before embeddings.

### Phase 6 - Analytics Dashboard

Add support volume, AI vs human replies, handoff rate, response time, resolution time, top product issues, knowledge gaps, agent performance, and product health.

### Phase 7 - Product Connectors

Connect products in this order:

1. MyExpensio
2. AmanahGP
3. Contract Diary Platform
4. WorkLedger
5. Narrio
6. Pagecast

### Phase 8 - Product Marketing and Sales Operations

Add the first growth operating layer before deeper automation.

Build:

- marketing campaign records
- product positioning notes
- audience/persona notes
- social content draft workflow
- campaign calendar view
- human approval before publishing
- lead follow-up draft workflow
- campaign performance placeholders

First marketing agents:

1. Product Marketing Agent
2. Social Media Content Agent
3. Campaign Planner Agent
4. Lead Follow-up Agent

AI may:

- draft social posts
- draft campaign ideas
- adapt product positioning into channel-specific content
- draft follow-up messages
- suggest content calendars
- summarize campaign performance

AI may not:

- publish social posts without approval
- make official public claims without approval
- change pricing promises
- send sales follow-ups automatically
- use sensitive customer data in public content

Exit criteria:

- Each product has a marketing profile.
- Marketing drafts are reviewed in Approvals before use.
- Social media work is trackable from idea to approved draft.

### Phase 9 - Department Agents

Add documentation, QA, product manager, sales follow-up, finance/admin, compliance, and developer operations agents.

### Phase 10 - Controlled Automation

Only after enough data exists, automate low-risk tasks such as tagging, ticket creation, daily summaries, release note drafts, FAQ suggestions, and possibly low-risk FAQ replies.

## 5. MVP Scope

MVP includes:

- product register
- product profiles
- contact profiles
- conversations
- messages
- tickets
- assignment and status
- manual conversation creation
- AI classification
- AI draft reply
- human handoff
- basic analytics
- first marketing/social draft workflow

MVP excludes:

- WhatsApp production integration
- payment automation
- advanced vector search
- autonomous public replies
- full CRM
- full sales pipeline
- full finance module
- autonomous social media publishing
- paid ads automation
- production deployment automation

## 6. Definition of Done

Shadow Team is successful when:

- each product has a profile
- each product has approved knowledge
- all support conversations enter one inbox
- AI can classify product, intent, and risk
- AI can draft helpful replies
- sensitive cases escalate to humans
- agent actions are logged
- analytics show performance and gaps
- product bugs become structured tasks
- marketing ideas become approved social/content drafts
- sales follow-ups become trackable
- company operations become trackable

## 7. Revised Build Direction After Sprint 19

The first 19 sprints built the internal operating spine:

```text
Support -> AI Drafting -> Knowledge -> Analytics -> Connectors -> Department Agents -> Approvals -> Release Gates -> Work Queue -> Daily Brief -> Reviewed Today
```

The next correction is to add the missing growth layer:

```text
Marketing Profile -> Campaign Calendar -> Social Drafts -> Marketing Approvals -> Lead Follow-up -> Marketing Analytics
```

Recommended next sprints:

| Sprint | Focus | Output |
|---:|---|---|
| 20 | Marketing Foundation | marketing profiles, channels, campaign/content tables |
| 21 | Social Media Draft Workflow | Product Marketing Agent and Social Media Content Agent create approval-ready drafts |
| 22 | Campaign Calendar | calendar/list view for planned content by product and channel |
| 23 | Lead Follow-up Workflow | sales follow-up drafts tied to product interest and campaign source |
| 24 | Marketing Analytics | content status, campaign counts, channel metrics placeholders |
| 25 | Social Channel Connector Prep | connector-safe outbox model for future LinkedIn/Facebook/X/Instagram posting |
