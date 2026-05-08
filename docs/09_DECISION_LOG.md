# Decision Log

Use this file to record important project decisions.

## Decision Format

```text
Decision ID:
Date:
Decision:
Reason:
Alternatives Considered:
Impact:
Review Later:
```

## Locked Decisions

### DEC-001 - Build Operational Control Before AI Autonomy

Date: 2026-05-08

Decision:

Build the admin dashboard, product register, support inbox, tickets, and audit layer before enabling autonomous AI actions.

Reason:

The company needs a reliable operating system first. AI is useful only when it works inside a controlled workflow with product context, human approval, and logs.

Alternatives Considered:

- Start directly with a chatbot.
- Connect WhatsApp first.
- Build AI agents before support operations.

Impact:

Early work focuses on database, dashboard, support inbox, and human handoff.

Review Later:

After support inbox MVP and AI draft replies are stable.

### DEC-002 - AI Drafts First, Human Sends First

Date: 2026-05-08

Decision:

In the MVP, AI may classify, summarize, recommend escalation, and draft replies. It should not automatically send external replies until reviewed.

Reason:

The product portfolio includes high-risk areas such as claims, contracts, NGO trust/certification, billing, and user data.

Alternatives Considered:

- Auto-send low-risk support answers immediately.
- Let each product decide separately from day one.

Impact:

The support inbox must include AI draft review and explicit send action.

Review Later:

After enough conversation outcomes prove which categories are safe for automation.

### DEC-003 - Dedicated Repo First

Date: 2026-05-08

Decision:

Start with this dedicated repo: `shadow-team`.

Reason:

The AI Agent OS serves multiple products. A dedicated repo keeps the company operating layer clean and avoids coupling it too early to one existing product.

Alternatives Considered:

- Add the system inside one existing product.
- Wait for a full company monorepo.

Impact:

The project should be structured so it can later become part of a larger company monorepo if needed.

Review Later:

After two or more product connectors are active.

### DEC-004 - Supabase and Next.js First

Date: 2026-05-08

Decision:

Use Next.js, Supabase Postgres, Supabase Auth, Supabase Realtime, and Vercel as the default first stack.

Reason:

This is low-cost, familiar, fast to ship, and enough for the MVP.

Alternatives Considered:

- NestJS backend from day one.
- Custom WebSocket server from day one.
- Separate queue/event infrastructure from day one.

Impact:

MVP uses simple API routes/server actions, Supabase tables, and Supabase Realtime.

Review Later:

When traffic, integrations, or background jobs require stronger backend separation.

### DEC-005 - MyExpensio First Connector

Date: 2026-05-08

Decision:

After the core support inbox works, connect MyExpensio first.

Reason:

MyExpensio has clear support, onboarding, billing, and claim-guidance needs with medium risk.

Alternatives Considered:

- AmanahGP first.
- Contract Diary Platform first.
- Connect all products together.

Impact:

The first product connector should be designed around MyExpensio but use generic connector patterns.

Review Later:

After MyExpensio support flow is stable.

