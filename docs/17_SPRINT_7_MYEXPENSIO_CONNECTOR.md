# Sprint 7 - MyExpensio Connector

Date started: 2026-05-09

## Goal

Create the first product connector so MyExpensio can create support conversations inside Shadow Team.

## Scope

Build:

- inbound MyExpensio conversation API
- shared secret authentication
- contact profile creation/update
- conversation creation
- first user message creation
- audit event
- connector payload documentation

Do not build yet:

- outbound reply sync back to MyExpensio
- webhooks from payment providers
- attachment uploads
- realtime notifications
- product-side widget
- automatic AI drafting on inbound message

## Endpoint

```text
POST /api/connectors/myexpensio/conversations
```

Health check:

```text
GET /api/connectors/myexpensio/conversations
```

## Environment

Add these to `apps/admin/.env.local`:

```text
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
MYEXPENSIO_CONNECTOR_SECRET=generate-a-long-random-secret
```

Never expose the service role key in browser code.

## Authentication

Use one of:

```text
Authorization: Bearer MYEXPENSIO_CONNECTOR_SECRET
```

or:

```text
x-shadow-team-secret: MYEXPENSIO_CONNECTOR_SECRET
```

## Example Request

```bash
curl -X POST http://localhost:3000/api/connectors/myexpensio/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CONNECTOR_SECRET" \
  -d '{
    "externalConversationId": "myexpensio-help-1001",
    "subject": "Payment failed",
    "message": "My transaction was unsuccessful but I think money was deducted.",
    "priority": "high",
    "channel": "app",
    "contact": {
      "externalId": "myexpensio-user-123",
      "name": "Jessmin",
      "email": "jessmin@example.com",
      "phone": "+60123456789",
      "companyName": "Example Sdn Bhd"
    },
    "context": {
      "userId": "myexpensio-user-123",
      "claimId": "claim-456",
      "page": "billing/payment",
      "plan": "pro"
    }
  }'
```

## Example Response

```json
{
  "conversationId": "uuid",
  "contactProfileId": "uuid",
  "status": "created"
}
```

## Database Writes

The connector writes:

- `contact_profiles`
- `conversations`
- `messages`
- `audit_events`

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
```

Manual test:

1. Add `SUPABASE_SERVICE_ROLE_KEY` and `MYEXPENSIO_CONNECTOR_SECRET`.
2. Restart dev server.
3. Send the example request.
4. Open `/support`.
5. Confirm the MyExpensio conversation appears.
6. Open `/analytics`.
7. Confirm MyExpensio conversation count increases.

## Completion Checklist

- [x] Connector API route
- [x] Shared secret auth
- [x] Server-side service role client
- [x] Contact upsert behavior by external id
- [x] Conversation creation
- [x] First message creation
- [x] Audit event creation
- [x] Docs and example payload

