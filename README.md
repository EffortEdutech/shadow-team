# Shadow Team

Shadow Team is the company AI Agent Operating System for Effort Edutech / Effort Studio.

The goal is to build a practical company operations layer for multiple products:

- MyExpensio
- AmanahGP
- Contract Diary Platform
- WorkLedger
- Narrio
- Pagecast
- future products

The first milestone is not full autonomy. The first milestone is operational control:

```text
Product Register + Support Inbox + Tickets + AI Draft Reply + Knowledge Base + Analytics + Human Approval
```

## Sprint 0 Status

Sprint 0 is documentation lock:

- master implementation plan
- product register
- product profiles
- agent job descriptions
- support playbook
- approval policy
- database model
- MVP roadmap
- analytics spec
- security and audit spec
- decision log

## Sprint 1 Status

Sprint 1 created and applied the Supabase database foundation for project `mzcdnvtmwyarcefbroja`.

## Sprint 2 Status

Sprint 2 starts the admin dashboard shell in `apps/admin`.

Useful commands:

```powershell
npm run admin:dev
npm run admin:build
npm run admin:lint
```

## Build Order

```text
Documents -> Database -> Admin Dashboard -> Support Inbox -> AI Drafting -> Knowledge Base -> Analytics -> Product Connectors -> Department Agents -> Automation
```

Core principle:

```text
AI does the work. Human owns the decision.
```
