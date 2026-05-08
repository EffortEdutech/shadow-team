# Sprint 5 - Knowledge Base MVP

Date started: 2026-05-09

## Goal

Create the first approved knowledge workflow so AI drafts can be grounded in product-specific support material.

## Scope

Build:

- Knowledge page
- manual knowledge source creation
- first chunk creation
- source status management
- product filter
- source type taxonomy
- approved knowledge retrieval for AI drafts
- knowledge citation records for supplied chunks

Do not build yet:

- document upload
- file parsing
- embeddings
- semantic search
- automatic FAQ generation
- knowledge approval workflows with multiple reviewers

## Created / Updated Routes

| Route | Purpose |
|---|---|
| `/knowledge` | Manage product knowledge sources and chunks |
| `/support` | AI draft action now receives approved product knowledge |

## Knowledge Source Types

- FAQ
- SOP
- Policy
- User guide
- Admin guide
- Knowledge gap

## Statuses

| Status | Meaning |
|---|---|
| draft | Saved but not approved for AI grounding |
| approved | Can be supplied to AI draft generation |
| archived | Retained for history, not supplied to AI |

## Storage

Each manual knowledge entry creates:

- one `knowledge_sources` row
- one `knowledge_chunks` row
- one `audit_events` row

When AI draft generation uses approved knowledge, it creates:

- `knowledge_citations` rows linked to `agent_runs`

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Manual browser test:

1. Open `/knowledge`.
2. Add an approved MyExpensio FAQ or SOP.
3. Open `/support`.
4. Generate AI draft for a MyExpensio conversation.
5. Confirm the AI draft is created.
6. Confirm `agent_runs.input_json.approved_knowledge_count` is greater than zero.
7. Confirm `knowledge_citations` rows exist for the run.

## Completion Checklist

- [x] Knowledge source creation
- [x] Knowledge chunk creation
- [x] Draft/approved/archive status update
- [x] Product filter
- [x] Approved knowledge supplied to AI draft prompt
- [x] Knowledge citations written
- [x] Lint passes
- [x] Production build passes

