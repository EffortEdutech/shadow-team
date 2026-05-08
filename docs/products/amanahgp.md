# Product Profile - AmanahGP

## Product Identity

Product Name: AmanahGP

Product Slug: `amanahgp`

Priority: 2

Product Status: Active/productizing

Product Type: Governance, transparency, trust index, and NGO/charity platform

Primary Users: NGOs, charities, donors, reviewers, admins

Secondary Users: Internal audit/review team, public visitors, partners

## Product Summary

AmanahGP supports governance and transparency workflows for NGOs and charities. AI can help with onboarding, donor/admin guidance, evidence checklist preparation, and support triage. It must not make trust, certification, or religious/legal judgments.

Main workflows:

- NGO onboarding
- organization profile setup
- evidence/document submission
- donor/supporter information
- review preparation
- transparency reporting

## First AI Use Cases

| Use Case | User Type | AI Role | Human Review Needed |
|---|---|---|---|
| NGO onboarding | NGO admin | Explain required steps and documents | Human optional |
| Evidence checklist | NGO admin/reviewer | Summarize missing evidence | Human reviews |
| Donor support | Donor | Explain public information and navigation | Human optional |
| Certification guidance | NGO/reviewer | Explain process only | Human required for decisions |
| Support ticket triage | Any | Classify risk and route | Required for high risk |

## Support Categories

- account_login
- onboarding
- how_to_use
- bug_report
- feature_request
- data_import_export
- certification_or_review_sensitive
- partnership
- unknown

Product-specific categories:

- ngo_onboarding
- evidence_submission
- trust_index_question
- donor_visibility
- reviewer_workflow
- governance_document

## Knowledge Sources Needed

| Source | Type | Status |
|---|---|---|
| NGO onboarding guide | user guide | draft needed |
| Evidence checklist | SOP | draft needed |
| Reviewer guide | admin guide | draft needed |
| Trust/certification policy | policy | draft needed |
| Donor FAQ | FAQ | draft needed |

## Allowed AI Actions

AI may:

- explain platform navigation
- explain onboarding steps
- draft checklist summaries
- identify missing documents based on approved checklist
- summarize evidence for human review
- create support tickets

## Restricted AI Actions

AI must not:

- certify an NGO
- assign or change a trust rating
- make religious, legal, governance, or compliance conclusions
- determine donor eligibility
- approve or reject evidence
- publish sensitive review results

## Escalation Rules

Escalate when:

- user asks for certification decision
- user disputes trust/rating/review outcome
- issue involves legal, religious, governance, financial, or reputational risk
- public complaint or donor dispute appears
- evidence contains sensitive personal or financial data

## Risk Classification

| Risk | Examples | AI Behavior |
|---|---|---|
| Low | How to register organization | Draft answer |
| Medium | Missing document explanation | Draft checklist guidance |
| High | Certification, trust rating, governance judgment | Escalate |
| Critical | Public complaint, legal threat, data breach | Immediate escalation |

## Metrics

- NGO onboarding conversations
- donor questions
- evidence checklist gaps
- escalated review cases
- public complaint count
- knowledge gaps

## Connector Requirements

AmanahGP should send:

- product id
- organization id if relevant
- user role
- current workflow/page
- message content
- review/evidence context only when permitted

Shadow Team may send back:

- support reply
- checklist summary
- ticket status
- escalation note

## Approval Contact

Default Escalation Owner: Founder/Product Owner

Backup Owner: AmanahGP Review Lead

