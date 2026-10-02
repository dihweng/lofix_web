# Utility Support Tickets Documentation

Add utility support-ticket submission to the Lofix User web app for orders requiring support (`requiresSupport=true`).

## Specifications
1. When an order has `requiresSupport=true`, display its server message and a prominent “Contact support” button.
2. Open a form/modal showing the order reference and a message field. Require a trimmed message of 1–3000 characters.
3. Submit:
   - `POST /support/tickets`
   - Payload: `{ orderId, message }` (server derives ownership, transaction ID, provider reference, and support reason).
4. Handle responses:
   - `201`: Ticket created successfully.
   - `200`: Ticket already exists; show its existing ID and status.
   - Response format: `{ message, ticket }`.
5. Display confirmation (ticket ID/status) without claiming automatic refunds or token delivery.
6. Handle validation, authentication, eligibility errors inline, and respect `Retry-After` on 429 responses.
