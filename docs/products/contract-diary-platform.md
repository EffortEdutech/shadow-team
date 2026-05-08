# Product Profile - Contract Diary Platform

## Product Identity

Product Name: Contract Diary Platform

Product Slug: `contract-diary-platform`

Priority: 3

Product Status: Active product

Product Type: Construction daily diary and contract administration platform

Primary Users: Main contractors, subcontractors, project teams, contract administrators

Secondary Users: Consultants, clients, supervisors, commercial teams

## Product Summary

Contract Diary Platform captures factual site records and supports contract administration workflows. AI can help users understand diary entry flows, summarize records, structure support issues, and identify missing information. It must not provide legal conclusions or decide contract entitlement.

Main workflows:

- daily diary entry
- work progress record
- site event capture
- photo/document attachment
- delay/event tracking
- report generation
- claim-sensitive evidence organization

## First AI Use Cases

| Use Case | User Type | AI Role | Human Review Needed |
|---|---|---|---|
| Diary entry guidance | Site user | Explain fields and workflow | Human optional |
| Missing record checklist | Contract admin | Suggest missing factual info | Human reviews |
| Report summary | Manager | Draft factual summary | Human reviews before official use |
| Claim-sensitive support | Commercial team | Collect facts and escalate | Required |
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

- daily_diary
- site_event
- delay_record
- photo_attachment
- report_export
- claim_sensitive
- contract_admin

## Knowledge Sources Needed

| Source | Type | Status |
|---|---|---|
| Daily diary user guide | user guide | draft needed |
| Contract admin workflow guide | admin guide | draft needed |
| Delay/event recording SOP | SOP | draft needed |
| Report export guide | user guide | draft needed |
| Legal disclaimer and escalation policy | policy | draft needed |

## Allowed AI Actions

AI may:

- explain how to create diary entries
- draft factual summaries from provided records
- identify missing factual fields
- create support tickets
- classify contract-sensitive issues
- draft internal report notes

## Restricted AI Actions

AI must not:

- determine contract entitlement
- provide legal advice
- decide claim validity
- interpret contract clauses as final advice
- certify official delay responsibility
- submit official claim documents without approval

## Escalation Rules

Escalate when:

- user asks whether they are entitled to claim
- user asks legal/contract interpretation
- issue involves dispute, delay claim, extension of time, loss and expense, payment, or formal notice
- official report will be sent externally
- AI lacks approved project/product knowledge

## Risk Classification

| Risk | Examples | AI Behavior |
|---|---|---|
| Low | How to add site photo | Draft answer |
| Medium | Missing diary data | Suggest factual checklist |
| High | Claim entitlement or contract interpretation | Escalate |
| Critical | Legal threat, dispute escalation, data breach | Immediate escalation |

## Metrics

- diary support conversations
- report export issues
- claim-sensitive escalations
- bug reports
- missing knowledge items
- response time for high-risk cases

## Connector Requirements

Contract Diary Platform should send:

- product id
- project id if permitted
- user role
- current module/page
- diary/event/report id if relevant and permitted
- message content

Shadow Team may send back:

- support reply
- factual summary draft
- ticket status
- escalation note

## Approval Contact

Default Escalation Owner: Founder/Product Owner

Backup Owner: Contract/Admin Specialist

