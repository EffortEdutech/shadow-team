# Product Profile - MyExpensio

## Product Identity

Product Name: MyExpensio

Product Slug: `myexpensio`

Priority: 1

Product Status: Active product

Product Type: Mileage, expense, claim, and reimbursement workflow

Primary Users: Individual claimants, employees, company admins

Secondary Users: Finance/admin teams, approvers, company owners

## Product Summary

MyExpensio helps users manage mileage, trips, expenses, claims, and reimbursement workflows. The first AI value is support, onboarding, claim guidance, billing FAQ, and bug intake.

Main workflows:

- submit mileage or expense claim
- attach receipt or supporting information
- track claim status
- export claim reports
- help companies onboard users

## First AI Use Cases

| Use Case | User Type | AI Role | Human Review Needed |
|---|---|---|---|
| How to submit claim | Claimant | Explain steps from approved docs | No for draft; human sends in MVP |
| TNG/receipt linking help | Claimant | Guide troubleshooting and collect details | Human if account-specific |
| Company onboarding | Admin | Explain setup flow and required info | Human optional |
| Billing FAQ | User/admin | Explain plans and limits | Human for refunds/custom pricing |
| Bug report intake | Any user | Structure issue, device, steps, expected/actual result | Optional |

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
- sales_lead
- demo_request
- unknown

Product-specific categories:

- mileage_claim
- receipt_upload
- tng_linking
- company_enrolment
- claim_export

## Knowledge Sources Needed

| Source | Type | Status |
|---|---|---|
| User claim guide | user guide | draft needed |
| Admin approval guide | admin guide | draft needed |
| Billing and plan FAQ | FAQ | draft needed |
| TNG/receipt troubleshooting | SOP | draft needed |
| Claim policy limitations | policy | draft needed |

## Allowed AI Actions

AI may:

- answer how-to questions from approved docs
- explain product navigation
- draft claim submission guidance
- collect missing support details
- summarize conversation
- create draft support ticket
- suggest FAQ gaps

## Restricted AI Actions

AI must not:

- approve or reject official claims
- decide tax/accounting treatment
- issue refunds
- change company policy
- change billing records
- delete claim data

## Escalation Rules

Escalate when:

- user asks whether a claim is officially approved or rejected
- issue involves refund, payment dispute, or billing correction
- user reports missing money, incorrect claim amount, or sensitive personal data
- AI lacks approved product knowledge

## Risk Classification

| Risk | Examples | AI Behavior |
|---|---|---|
| Low | How to submit mileage claim | Draft answer from docs |
| Medium | Account-specific TNG/receipt issue | Collect facts, draft support reply |
| High | Claim approval, refund dispute, tax question | Escalate |
| Critical | Data breach or unauthorized account access | Immediate escalation |

## Metrics

- conversations per day
- claim-related questions
- billing questions
- TNG/receipt issue count
- bug reports
- company onboarding leads
- knowledge gaps

## Connector Requirements

MyExpensio should send:

- product id
- user id
- email or phone if available
- current page/feature
- claim id if user permits and relevant
- message content

Shadow Team may send back:

- human reply
- AI draft
- ticket status
- support summary

## Approval Contact

Default Escalation Owner: Founder/Product Owner

Backup Owner: Support/Admin Lead

