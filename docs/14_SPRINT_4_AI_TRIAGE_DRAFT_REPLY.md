# Sprint 4 - AI Triage and Draft Reply

Date started: 2026-05-09

## Goal

Add safe AI support assistance inside the Support Inbox.

AI can classify and draft. Humans still decide and send.

## Scope

Build:

- AI triage button in `/support`
- product classification from conversation context
- intent/category classification
- risk classification
- escalation recommendation
- internal AI draft reply
- `agent_runs` records
- `agent_tool_calls` records
- audit events for AI draft generation
- recent agent runs in `/agents`

Do not build yet:

- auto-send AI replies
- WhatsApp integration
- full knowledge retrieval
- autonomous ticket closing
- automatic refunds, claim decisions, trust decisions, or contract/legal conclusions

## Environment

Add these to `apps/admin/.env.local`:

```text
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_MODEL` is optional. If omitted, the app uses:

```text
gpt-5-mini
```

## Implementation Files

| File | Purpose |
|---|---|
| `apps/admin/src/lib/openai.ts` | Lazy OpenAI client and model config |
| `apps/admin/src/app/(admin)/support/actions.ts` | `generateAiDraft` server action |
| `apps/admin/src/app/(admin)/support/page.tsx` | AI draft button and run summary |
| `apps/admin/src/app/(admin)/agents/page.tsx` | Recent agent run visibility |

## AI Output

The AI returns structured output:

- product slug
- intent
- category
- risk level
- confidence
- human required
- recommended status
- escalation reason
- draft reply
- internal summary

## Storage

Each AI draft creates:

- one `agent_runs` row
- one `agent_tool_calls` row
- one internal `messages` row with `sender_type = ai`
- audit event `ai_draft_generated`
- audit event `ai_draft_requested`

## Safety Rules

- AI draft messages are internal.
- Human reply composer remains the only send path.
- High-risk cases should recommend escalation.
- AI must not make final legal, financial, certification, refund, claim, contract, religious, tax, or production decisions.

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Manual test:

1. Add `OPENAI_API_KEY` to `apps/admin/.env.local`.
2. Restart the dev server.
3. Open `/support`.
4. Select or create a conversation.
5. Click `Generate AI draft`.
6. Confirm an internal AI message appears.
7. Confirm `/agents` shows a recent run.

