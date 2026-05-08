# Analytics Dashboard Spec

## Purpose

The analytics dashboard measures whether Shadow Team is reducing operational burden and improving product support.

## Dashboard Pages

| Page | Purpose |
|---|---|
| Overview | Company-wide performance across products |
| Support Analytics | Conversation volume, response time, AI resolution, handoff rate |
| Product Health | Tickets, bugs, feature requests, risk flags, active users |
| Agent Performance | Agent runs, success, escalation, errors, confidence |
| Knowledge Gaps | Questions AI could not answer confidently |
| Risk and Escalation | High-risk cases needing human review |

## Overview Cards

- total conversations today
- open conversations
- open tickets
- AI drafts generated
- human handoffs
- average first response time
- average resolution time
- top product by support volume

## Support Metrics

| Metric | Meaning |
|---|---|
| conversations_per_day | Support and lead volume |
| ai_draft_count | AI assistance volume |
| ai_resolution_rate | Percent solved without human takeover after automation is allowed |
| human_handoff_rate | Percent requiring human review |
| first_response_time | Speed of first reply |
| resolution_time | Time to close conversation or ticket |
| top_categories | Most frequent support categories |

## Product Health Metrics

- support tickets by product
- bug reports by product
- feature requests by product
- knowledge gaps by product
- risk flags by product
- active users when connector data exists

## Agent Metrics

- runs count
- success count
- escalation count
- error count
- average confidence
- top failed intents
- human override count

## Knowledge Gap Metrics

Track:

- unanswered question
- product
- category
- frequency
- source missing
- suggested FAQ title
- status: new, drafted, approved, ignored

## MVP Analytics Rule

Analytics can start from stored operational data. Do not wait for perfect event pipelines.

