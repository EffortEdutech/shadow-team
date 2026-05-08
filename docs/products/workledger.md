# Product Profile - WorkLedger

## Product Identity

Product Name: WorkLedger

Product Slug: `workledger`

Priority: 4

Product Status: Active product

Product Type: Work reporting, contract-aware work tracking, and progress documentation platform

Primary Users: SMEs, contractors, service teams, field workers, supervisors

Secondary Users: Clients, managers, finance/admin staff

## Product Summary

WorkLedger helps teams record work done, progress, evidence, and reporting across industries such as construction, maintenance, and services. AI can help users set up work reports, summarize progress, and structure issues. It must not make official payment, acceptance, or contract entitlement decisions.

Main workflows:

- create work report
- record work progress
- attach photos/evidence
- submit report
- review work status
- export progress summary

## First AI Use Cases

| Use Case | User Type | AI Role | Human Review Needed |
|---|---|---|---|
| Work report setup | Field/team user | Explain fields and templates | Human optional |
| Progress summary | Supervisor | Draft factual summary | Human reviews before official use |
| Evidence checklist | Contractor | Suggest missing work evidence | Human optional |
| Client-facing report draft | Manager | Draft report wording | Human approves |
| Bug report intake | Any user | Structure issue and reproduction steps | Optional |

## Support Categories

- account_login
- onboarding
- how_to_use
- bug_report
- feature_request
- data_import_export
- contract_or_legal_sensitive
- integration
- unknown

Product-specific categories:

- work_report
- progress_summary
- evidence_attachment
- template_setup
- client_report
- offline_sync

## Knowledge Sources Needed

| Source | Type | Status |
|---|---|---|
| Work report user guide | user guide | draft needed |
| Template setup guide | admin guide | draft needed |
| Progress reporting SOP | SOP | draft needed |
| Offline/sync troubleshooting | FAQ | draft needed |
| Client report review policy | policy | draft needed |

## Allowed AI Actions

AI may:

- explain work report fields
- suggest missing factual information
- draft progress summaries
- create support tickets
- classify bug reports
- suggest FAQ gaps

## Restricted AI Actions

AI must not:

- accept or reject completed work officially
- approve payment
- decide contract entitlement
- provide legal advice
- submit official client reports without approval
- delete work records

## Escalation Rules

Escalate when:

- user asks about payment entitlement
- user disputes work acceptance/rejection
- issue involves legal, contract, payment, or formal client submission
- user reports missing evidence or data loss

## Risk Classification

| Risk | Examples | AI Behavior |
|---|---|---|
| Low | How to create a work report | Draft answer |
| Medium | Progress report draft | Draft for review |
| High | Payment or contract dispute | Escalate |
| Critical | Data loss, legal threat, security incident | Immediate escalation |

## Metrics

- work report support volume
- template setup questions
- offline/sync issues
- report export issues
- high-risk escalations
- bug reports

## Connector Requirements

WorkLedger should send:

- product id
- user id
- role/team if available
- current page/module
- work report id if relevant and permitted
- message content

Shadow Team may send back:

- support reply
- report draft
- ticket status
- escalation note

## Approval Contact

Default Escalation Owner: Founder/Product Owner

Backup Owner: Operations/Product Lead

