# Approval Policy

## Core Rule

AI may prepare work. Humans approve sensitive actions.

```text
AI does the work. Human owns the decision.
```

## Allowed Without Human Approval in MVP

AI may:

- classify product
- classify intent
- classify risk
- summarize conversations
- draft replies
- recommend escalation
- create draft tickets
- suggest support categories
- identify knowledge gaps
- generate internal checklists

## Human Approval Required

Humans must approve:

- sending external replies during MVP
- refunds
- payment disputes
- custom pricing
- claim approvals or rejections
- contract entitlement opinions
- legal conclusions
- tax/accounting treatment
- AmanahGP certification or rating decisions
- public content publishing
- account deletion
- production data changes
- production deployment
- destructive migrations
- environment variable changes

## Risk Levels

| Risk | Description | AI Behavior |
|---|---|---|
| Low | Simple FAQ, navigation, general onboarding | May draft direct answer from approved docs |
| Medium | Account-specific, billing explanation, feature issue | Draft and recommend; human review depending confidence |
| High | Legal, contractual, financial, claim, certification, trust, or sensitive review issue | Escalate and collect facts only |
| Critical | Security incident, data deletion, public complaint, legal threat, major financial impact | Immediate human escalation |

## Product-Specific Restrictions

| Product | Restricted Decisions |
|---|---|
| MyExpensio | Claim approval/rejection, tax treatment, refund decision |
| AmanahGP | NGO certification, trust rating, governance judgment, donation eligibility |
| Contract Diary Platform | Contract entitlement, claim validity, legal interpretation |
| WorkLedger | Contract payment entitlement, official acceptance of work, legal/claim decision |
| Narrio | Final content moderation deletion, public publishing without user confirmation |
| Pagecast | Public publishing, official marketing claims, customer-specific pricing |

## Audit Requirement

Every AI-assisted action should log:

- product
- conversation or ticket
- agent
- input
- output
- risk level
- confidence if available
- human approval status
- final human action

