# Sprint 3 - Support Inbox MVP

Date started: 2026-05-09

## Goal

Build the first usable support workflow inside Shadow Team.

## Scope

Build:

- manual conversation creation
- conversation list
- message thread
- user/product info panel
- internal notes
- human reply composer
- assign conversation to current user
- status workflow
- create ticket from conversation
- read-only ticket list
- product guardrails visible in support context

Do not build yet:

- AI draft replies
- WhatsApp integration
- email integration
- file attachments
- multi-agent assignment
- realtime subscriptions
- product app connectors

## Created / Updated Routes

| Route | Purpose |
|---|---|
| `/support` | 3-column support inbox MVP |
| `/tickets` | Read-only ticket list with links back to conversations |

## Support Inbox Panels

| Panel | Function |
|---|---|
| Left | Create manual conversation and browse recent conversations |
| Center | Conversation thread, human reply composer, internal note composer |
| Right | Contact info, status/assignment workflow, ticket creation, product guardrails |

## Server Actions

The support workflow uses server actions in:

```text
apps/admin/src/app/(admin)/support/actions.ts
```

Actions:

- `createManualConversation`
- `addConversationMessage`
- `updateConversationStatus`
- `assignConversationToSelf`
- `createTicketFromConversation`

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Manual browser test:

1. Open `/support`.
2. Create a manual conversation.
3. Confirm it appears in the conversation list.
4. Add a human reply.
5. Add an internal note.
6. Change status.
7. Assign to self.
8. Create a ticket.
9. Open `/tickets` and confirm the ticket appears.

## Completion Checklist

- [x] Manual conversation creation
- [x] Conversation list
- [x] Message thread
- [x] Human reply composer
- [x] Internal note composer
- [x] Contact info panel
- [x] Product guardrails panel
- [x] Status update action
- [x] Assign to self action
- [x] Ticket creation action
- [x] Ticket list page
- [x] Audit event writes for support actions
- [x] Lint passes
- [x] Production build passes

