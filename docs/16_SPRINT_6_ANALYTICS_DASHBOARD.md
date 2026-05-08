# Sprint 6 - Analytics Dashboard

Date started: 2026-05-09

## Goal

Create the first read-only management dashboard for live support, AI, ticket, and knowledge activity.

## Scope

Build live analytics from operational tables:

- conversations
- messages
- tickets
- agent_runs
- knowledge_sources
- knowledge_citations

Do not build yet:

- cron aggregation
- daily metrics table writes
- chart library
- CSV export
- automated management reports

## Route

```text
/analytics
```

## Included Panels

| Panel | Purpose |
|---|---|
| Summary cards | Conversations, tickets, AI runs, knowledge-grounded runs |
| Message activity | Human replies, internal notes, AI messages |
| Support breakdown | Conversation status and ticket categories |
| AI breakdown | Risk levels, average confidence, human-required rate |
| Product health | Conversations, tickets, AI runs, approved knowledge by product |
| Recent escalations | Latest open/escalated conversations |
| Recent AI runs | Latest AI draft outcomes |
| Knowledge status | Draft/approved/archive source counts |

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Manual browser test:

1. Open `/analytics`.
2. Confirm summary cards show counts.
3. Confirm Product Health includes MyExpensio and other seeded products.
4. Confirm Recent AI Runs shows Sprint 4/Sprint 5 AI draft runs.
5. Confirm Knowledge Grounded Runs is greater than zero after Sprint 5 verification.

## Completion Checklist

- [x] Live summary cards
- [x] Conversation status breakdown
- [x] Ticket category breakdown
- [x] AI risk breakdown
- [x] Product health table
- [x] Recent escalations
- [x] Recent AI runs
- [x] Knowledge usage metrics
- [x] Lint passes
- [x] Production build passes

