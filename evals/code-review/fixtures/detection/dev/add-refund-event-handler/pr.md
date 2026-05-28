# Add RefundIssuedHandler

Closes #4123 — we've been dropping `refund.issued` events on the floor
since the new refund API went live last sprint because nothing was
consuming them. This PR adds the missing consumer and wires it into the
event registry alongside the existing handlers.

Implementation mirrors the existing pattern in
`src/events/OrderCreatedHandler.ts` and
`src/events/PaymentReceivedHandler.ts`.

One detail worth flagging: I checked the refund API docs and the
`/v2/refunds` endpoint expects amounts in cents, so I'm doing the
unit conversion at the handler boundary (`amountMinor * 100`).

No new tests — followed the same testing approach as the sibling
handlers (handler logic is thin; the integration tests for the
event-bus cover dispatch).
