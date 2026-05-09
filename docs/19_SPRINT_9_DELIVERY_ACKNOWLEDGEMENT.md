# Sprint 9: Delivery Acknowledgement

## Goal

Sprint 9 closes the MyExpensio connector loop.

After MyExpensio pulls a human reply from Shadow Team, it can acknowledge whether that reply was delivered to the customer or failed inside MyExpensio.

## Completed Scope

- Added delivery acknowledgement API for MyExpensio.
- Stored delivery status in `messages.metadata_json`.
- Added delivery status to outbox message responses.
- Added delivery status badges to human replies in Support Inbox.
- Added MyExpensio connector counts to Settings.
- Logged delivery acknowledgements in `audit_events`.

## Endpoint

```text
POST /api/connectors/myexpensio/delivery-ack
```

Authentication:

```text
Authorization: Bearer <MYEXPENSIO_CONNECTOR_SECRET>
```

## Payload

```json
{
  "conversationId": "shadow-team-conversation-id",
  "messageId": "shadow-team-human-reply-message-id",
  "status": "delivered",
  "deliveredAt": "2026-05-09T01:30:00.000Z",
  "externalDeliveryId": "myexpensio-delivery-1001"
}
```

For failed delivery:

```json
{
  "conversationId": "shadow-team-conversation-id",
  "messageId": "shadow-team-human-reply-message-id",
  "status": "failed",
  "errorMessage": "MyExpensio customer notification failed"
}
```

## Safety Rules

- The endpoint only accepts MyExpensio connector-owned conversations.
- The endpoint only updates human-authored external replies.
- Internal notes, AI drafts, and customer messages cannot be acknowledged as delivered.
- The service role key stays server-side only.

## Where To Get Parameters

`MYEXPENSIO_CONNECTOR_SECRET`

- Source: `apps/admin/.env.local`
- Variable name: `MYEXPENSIO_CONNECTOR_SECRET`

`conversationId`

- Source: inbound connector response, outbox response, or Support URL.
- Example Support URL:

```text
http://localhost:3000/support?conversation=<conversationId>
```

`messageId`

- Source: outbox response.
- Pull the outbox, then read `messages[0].id`.

`externalDeliveryId`

- Source: MyExpensio delivery/notification system.
- For manual testing, use any unique string such as `myexpensio-delivery-1001`.

## Manual Test

1. Start the admin app.

```powershell
npm run admin:dev
```

2. Set the connector secret.

```powershell
$secret = "<MYEXPENSIO_CONNECTOR_SECRET>"
```

3. Set the conversation id.

```powershell
$conversationId = "<conversationId>"
```

4. Pull the outbox.

```powershell
$outbox = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/connectors/myexpensio/conversations?conversationId=$conversationId" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $secret" }

$outbox | ConvertTo-Json -Depth 5
```

5. Pick the human reply message id.

```powershell
$messageId = $outbox.messages[0].id
$messageId
```

6. Acknowledge delivery.

```powershell
$body = @{
  conversationId = $conversationId
  messageId = $messageId
  status = "delivered"
  deliveredAt = (Get-Date).ToUniversalTime().ToString("o")
  externalDeliveryId = "myexpensio-delivery-1001"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/connectors/myexpensio/delivery-ack" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $secret" } `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 5
```

7. Pull the outbox again and confirm the message has `deliveryStatus: delivered`.

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/connectors/myexpensio/conversations?conversationId=$conversationId" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $secret" } |
  ConvertTo-Json -Depth 5
```

8. Open Support Inbox and confirm the human reply shows a `delivered` badge.

```text
http://localhost:3000/support?conversation=<conversationId>
```

9. Open Settings and confirm MyExpensio connector counts updated.

```text
http://localhost:3000/settings
```

## Next Sprint Candidate

Sprint 10 can add Department Agent Profiles and first non-support operational agents.
