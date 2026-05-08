# Support Playbook

## Purpose

The support playbook defines how conversations move through Shadow Team.

## Support Inbox Layout

```text
Conversation List -> Message Thread -> User / Product Info
```

The inbox must support:

- view conversations
- view messages
- reply as human
- review AI draft
- take over from AI
- assign conversation
- tag conversation
- create ticket
- update status
- close conversation
- see contact and product context

## Statuses

| Status | Meaning |
|---|---|
| open | New or active conversation |
| pending | Waiting for user, internal check, or external action |
| escalated | Human or specialist review required |
| closed | Resolved or no further action |

## Sender Types

| Sender | Meaning |
|---|---|
| user | Customer, lead, or product user |
| ai | AI-generated response or draft |
| human | Staff response |
| system | Internal system event |
| note | Internal note not visible to user |

## Standard Flow

1. Conversation is created.
2. Product, intent, and risk are classified.
3. AI drafts a reply or recommends escalation.
4. Human reviews.
5. Human sends reply, assigns ticket, or escalates.
6. Conversation and ticket activity are logged.
7. Analytics are updated.

## Escalation Triggers

Escalate when:

- user asks for a human
- AI confidence is low
- product is high risk and issue is sensitive
- issue involves refund, payment dispute, claim approval, contract entitlement, certification, legal threat, security incident, data deletion, or public complaint
- no approved knowledge source exists

## Support Categories

- account_login
- billing_subscription
- onboarding
- how_to_use
- bug_report
- feature_request
- data_import_export
- integration
- claim_or_payment
- contract_or_legal_sensitive
- certification_or_review_sensitive
- content_moderation
- sales_lead
- demo_request
- partnership
- unknown

## MVP Rule

During MVP, AI drafts and humans send.

