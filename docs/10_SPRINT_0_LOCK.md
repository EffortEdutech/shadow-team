# Sprint 0 Lock

Date: 2026-05-08

Repo: `EffortEdutech/shadow-team`

## Sprint 0 Goal

Clean and lock the planning documents before building Sprint 1 database foundation.

## Completed

- [x] Master company AI agent blueprint
- [x] Start-to-finish implementation plan
- [x] Product register
- [x] Agent job descriptions
- [x] Support playbook
- [x] Approval policy
- [x] Database model draft
- [x] MVP roadmap
- [x] Analytics dashboard spec
- [x] Security and audit spec
- [x] Decision log
- [x] MyExpensio product profile
- [x] AmanahGP product profile
- [x] Contract Diary Platform product profile
- [x] WorkLedger product profile
- [x] Narrio product profile
- [x] Pagecast product profile
- [x] Future products guardrail profile

## Locked Build Order

```text
Documents -> Database -> Admin Dashboard -> Support Inbox -> AI Drafting -> Knowledge Base -> Analytics -> Product Connectors -> Department Agents -> Automation
```

## Sprint 1 Entry Criteria

Sprint 1 can start when:

- product register is accepted
- product profile boundaries are accepted
- approval policy is accepted
- database model is accepted as a first draft
- the team agrees not to build external channel integrations in Sprint 1

## Sprint 1 Scope

Build:

- Supabase schema
- migrations
- seed products
- role model
- RLS policies
- audit events
- agent run tables

Do not build yet:

- admin UI
- WhatsApp
- autonomous AI replies
- product connectors
- advanced RAG
- department agents

## Sprint 1 First Tables

- products
- product_profiles
- contact_profiles
- conversations
- messages
- tickets
- conversation_tags
- ticket_events
- audit_events
- agents
- agent_product_access
- agent_runs
- agent_tool_calls
- agent_approvals
- knowledge_sources

## Sign-Off Notes

Sprint 0 locks direction, not every future detail. The docs should evolve through the decision log when product reality changes.

