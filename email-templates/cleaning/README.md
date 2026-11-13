# Cleaning booking confirmation

Subject: `Your Lofix cleaning booking — {{reference}}`

`booking-confirmation.html` is a server-side email template for all cleaning service types. It is prepared for integration; this frontend does not send it automatically.

Render the `{{name}}` placeholders with HTML-escaped values from the persisted booking and customer account. Never interpolate raw customer text as HTML. All placeholders must be populated before sending; use “None” or “Not provided” for optional details. Format monetary values from kobo with the booking currency. Format timestamps with an explicit timezone label, using Africa/Lagos for Nigerian bookings. Use the booking's real reference and creation timestamp, never the example reference or a generated frontend reference.

Include the booked service name, requested schedule, address, room counts, supplies preference, frequency, add-on names and quantities, dishwashing names and quantities, arrival instructions, authoritative total, and current payment status. Read these from persisted snapshots rather than the editable calculator.

For a pending prepaid booking, use `paymentMessage`: “Your booking has been received. Payment is still pending. You can complete payment in My Bookings.” For a confirmed deferred booking, use: “Your booking is confirmed. Payment is due after cleaning is completed. You can also pay now in My Bookings.” Once a deferred job is complete but unpaid, say: “Your cleaning is complete. Please pay the outstanding balance in My Bookings.” Choose this wording from the saved booking terms and current transaction status. Do not label a booking paid until the backend verifies payment.

The existing backend at `helpers/send-email.js` accepts `{ to, subject, html }`. Integrate sending after booking persistence via a retryable notification job, deduplicated by booking ID and notification type. A mail failure must not fail or duplicate the booking. Send only to the booking account's email, and keep mail credentials on the server.

The on-screen confirmation directs customers to My Bookings and does not promise email delivery. Connect and verify this template through a deduplicated backend notification job before claiming that confirmation email is available. No real customer email has been sent as part of template preparation.
