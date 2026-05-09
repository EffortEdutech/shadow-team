# Sprint 8: Human Reply Outbox / Connector Response Path

## Goal

Sprint 8 gives MyExpensio a safe way to collect human-approved replies from Shadow Team.

This sprint does not send automatic messages to customers. MyExpensio pulls replies from an authenticated connector endpoint and decides how to deliver them inside its own product.

## Completed Scope

- Added authenticated outbox read support to the MyExpensio connector.
- Returned only human-authored external replies.
- Excluded user messages, internal notes, AI drafts, audit summaries, and private metadata.
- Limited reads to MyExpensio connector-owned conversations.
- Added cursor support with the `since` query parameter.
- Added `outboxUrl` to new inbound connector responses.
- Marked human replies with outbox metadata for future delivery tracking.

## Connector Endpoint

```text
GET /api/connectors/myexpensio/conversations?conversationId=<shadow-team-conversation-id>
```

Alternative lookup:

```text
GET /api/connectors/myexpensio/conversations?externalConversationId=<myexpensio-conversation-id>
```

Cursor lookup:

```text
GET /api/connectors/myexpensio/conversations?conversationId=<id>&since=<last-created-at-cursor>
```

Authentication:

```text
Authorization: Bearer <MYEXPENSIO_CONNECTOR_SECRET>
```

## Response Shape

```json
{
  "connector": "myexpensio",
  "conversationId": "shadow-team-conversation-id",
  "externalConversationId": "myexpensio-help-1001",
  "status": "open",
  "priority": "high",
  "aiStatus": "waiting_human",
  "subject": "Payment failed",
  "updatedAt": "2026-05-09T00:00:00.000Z",
  "lastMessageAt": "2026-05-09T00:00:00.000Z",
  "messages": [
    {
      "id": "message-id",
      "type": "human_reply",
      "content": "Human-approved reply text.",
      "createdAt": "2026-05-09T00:00:00.000Z",
      "cursor": "2026-05-09T00:00:00.000Z",
      "channelMessageId": null
    }
  ],
  "nextCursor": "2026-05-09T00:00:00.000Z"
}
```

## Safety Rules

- AI drafts remain internal.
- Internal notes remain internal.
- Customer/user inbound messages are not returned as outbound replies.
- Connector access requires the shared connector secret.
- MyExpensio should store `nextCursor` after successful delivery and pass it as `since` during the next poll.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Create a MyExpensio conversation through the inbound connector.

3. Open the conversation in Shadow Team Support.

4. Add a human reply, not an internal note.

5. Pull the outbox.

```powershell
$secret = "<MYEXPENSIO_CONNECTOR_SECRET>"
$conversationId = "<conversationId returned by the inbound connector>"

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/connectors/myexpensio/conversations?conversationId=$conversationId" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $secret" }
```

6. Confirm the response contains the human reply in `messages`.

7. Add an internal note and pull again.

8. Confirm the internal note does not appear.

9. Generate an AI draft and pull again.

10. Confirm the AI draft does not appear.

11. Test the cursor. PowerShell must URL-encode the cursor before placing it in the query string.

```powershell
$cursor = "<nextCursor from the previous response>"
$encodedCursor = [System.Uri]::EscapeDataString($cursor)

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/connectors/myexpensio/conversations?conversationId=$conversationId&since=$encodedCursor" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $secret" }
```

## Next Sprint Candidate

Sprint 9 can add delivery acknowledgements, retry state, and a richer connector status page.
