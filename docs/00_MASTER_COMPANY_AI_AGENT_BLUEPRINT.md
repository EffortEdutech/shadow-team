# Master Company AI Agent Blueprint

## Purpose

Shadow Team is a company-wide AI Agent Operating System for Effort Edutech / Effort Studio.

The company has several products, but the operating structure around support, onboarding, product management, QA, documentation, sales follow-up, analytics, and admin is still forming. Shadow Team fills those gaps with AI-assisted workflows while keeping human approval at the center.

This is not a random chatbot. It is the company control center for products, users, support conversations, tickets, product knowledge, agent activity, and management analytics.

## North Star

```text
AI does the work. Human owns the decision.
```

AI may classify, draft, summarize, recommend, search approved knowledge, prepare reports, and create structured tasks. Humans must approve sensitive decisions and external actions until the workflow is proven safe.

## Product Portfolio

| Priority | Product | First AI Use Case | Risk |
|---:|---|---|---|
| 1 | MyExpensio | Support, onboarding, billing FAQ | Medium |
| 2 | AmanahGP | NGO onboarding, donor/admin guidance | High |
| 3 | Contract Diary Platform | Support, diary guidance, document guidance | High |
| 4 | WorkLedger | Work setup, progress reporting support | Medium/High |
| 5 | Narrio | Creator onboarding, story assistance | Medium |
| 6 | Pagecast | Page/content support and SEO draft help | Medium |
| 7 | Future Products | Plug into the same platform | Varies |

## Company Functions Covered

- customer support
- user onboarding
- sales and follow-up
- product documentation
- QA and regression planning
- product analytics
- issue triage
- internal admin
- finance reminders
- marketing content drafts
- knowledge base retrieval
- human handoff
- product-specific workflows

## Core Platform Modules

| Module | Purpose |
|---|---|
| Product Register | Defines products, owners, support scope, risk, and rollout order |
| Product Profiles | Product-specific AI rules, knowledge sources, restrictions, and escalation rules |
| Support Inbox | Unified internal inbox for conversations, messages, tickets, assignment, and status |
| Agent Router | Classifies product, intent, risk, and next action |
| Knowledge Base | Approved product docs, SOPs, FAQs, guides, and source tracking |
| Human Approval Layer | Prevents AI from crossing sensitive boundaries |
| Analytics Dashboard | Measures support, AI performance, product health, and knowledge gaps |
| Audit Log | Records agent runs, tool calls, decisions, approvals, and overrides |
| Product Connectors | Connects product apps into the central support and agent system |

## High-Level Flow

```text
User / Lead / Customer / Internal Request
  -> Channel or Product App
  -> Shadow Team API
  -> Agent Router
  -> Product Agent or Company Agent
  -> Knowledge Search / Tool Action / Ticket Creation
  -> Human Approval if required
  -> Response / Ticket / Task / Report
  -> Analytics + Audit Log
```

## First Milestone

The first useful system is:

```text
Admin Dashboard + Product Register + Support Inbox + Tickets + AI Draft Reply + Basic Analytics
```

This must work manually before external channels and automation are added.

## Build Order

```text
Documents -> Database -> Admin Dashboard -> Support Inbox -> AI Drafting -> Knowledge Base -> Analytics -> Product Connectors -> Department Agents -> Automation
```

