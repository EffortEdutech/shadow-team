# Security and Audit

## Principles

- Agents only access products they are assigned to.
- Every important AI action is logged.
- Sensitive actions require approval.
- User data is separated by product and organization where applicable.
- Admin dashboard uses role-based access.
- No agent has direct destructive production access.

## Roles

```text
owner
admin
support_manager
support_agent
sales_agent
product_manager
qa_reviewer
viewer
```

## Audit Events

Log:

- conversation created
- message received
- AI agent selected
- knowledge source used
- reply drafted
- reply sent
- ticket created
- human handoff triggered
- approval requested
- approval granted or rejected
- task created
- status changed
- product profile changed
- agent instruction changed

## Sensitive Data

Products may contain:

- personal information
- claim records
- receipts
- payment/billing data
- contract records
- NGO/governance evidence
- religious or trust-sensitive content
- work logs and site records

Store only what is needed for support and operations.

## Production Safety

AI must not independently:

- delete data
- run destructive migrations
- change production environment variables
- deploy to production
- approve refunds
- approve claims
- certify organizations
- publish public content
- send legal, tax, or contract conclusions

## Sprint 1 Security Requirements

- enable RLS from the first database migration
- seed roles
- record audit events for support actions
- keep agent runs traceable
- separate draft output from sent messages

