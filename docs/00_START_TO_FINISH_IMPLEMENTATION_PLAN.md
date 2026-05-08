# Start to Finish Implementation Plan

## 1. Project North Star

Build a company-wide AI Agent Operating System that helps operate multiple products with a small team.

The system must first create operational control, then add AI, then add automation.

Core principle:

```text
AI does the work. Human owns the decision.
```

## 2. Non-Negotiable Early Decisions

| Area | Decision |
|---|---|
| Repo strategy | Use this dedicated repo first: `shadow-team`. It can later move into a company monorepo. |
| Architecture | Build modular monorepo style from day one, even if the MVP is small. |
| First UI | Build the admin dashboard and support inbox first, not public marketing pages. |
| First AI behavior | AI drafts and classifies first. It does not auto-send until reviewed. |
| First channels | Start with manual/admin-created conversations and web/in-app chat. WhatsApp comes later. |
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

### Phase 8 - Department Agents

Add documentation, QA, product manager, sales follow-up, finance/admin, compliance, and developer operations agents.

### Phase 9 - Controlled Automation

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

MVP excludes:

- WhatsApp production integration
- payment automation
- advanced vector search
- autonomous public replies
- full CRM
- full sales pipeline
- full finance module
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
- company operations become trackable

