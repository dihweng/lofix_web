# Cleaning payment policy

Admins configure the payment policy in the existing cleaning service create/edit form. The catalog and server-calculated quote expose `paymentPolicy`. The customer submits only `paymentTiming`; the backend reads the policy from the service while pricing the booking and rejects disallowed choices. Billing/token purchases keep their existing prepaid flow.

| Service policy | Customer selection | Initial booking status | Initial transaction status |
| --- | --- | --- | --- |
| PREPAID_ONLY | PAY_NOW | PAYMENT_PENDING | PENDING |
| PAY_NOW_OR_AFTER_COMPLETION | PAY_NOW | PAYMENT_PENDING | PENDING |
| PAY_NOW_OR_AFTER_COMPLETION | AFTER_COMPLETION | CONFIRMED | PENDING |

The backend saves both policy and timing on the booking. Later service changes do not alter agreed booking terms. Cleaner assignment allows a pending transaction for a booking saved with the deferred policy and choice. For unpaid pay-now bookings, including existing prepaid bookings, admins can explicitly select “Approve cleaning before payment” in the assignment dialog. The backend requires an admin, changes that booking to payment after completion, and records the approval with the admin's identity in its tracking history. The transaction stays pending. Agent verification, availability, scheduling and job-transition checks still apply.

Booking list/detail responses expose `paymentStatus`, `paymentDue`, and `canPayNow` derived from the associated transaction and saved policy. Deferred bookings can pay voluntarily before completion; otherwise the full amount is due once the job is completed. Payment settlement preserves the job status and does not cancel a deferred booking just because the scheduled date has passed. Cancelled bookings cannot start checkout; payments already in flight when cancellation occurs still trigger the existing refund-review flag.

Lofix admins interview, vet and approve cleaners. Customers are not asked to interview them. The booking confirmation and prepared email template reflect this.

## Rollout

Back up the database before running the backend's `scripts/migrate-cleaning-payment-policy.js`. Its production invocation is `NODE_ENV=production node scripts/migrate-cleaning-payment-policy.js --confirm-database lofix`, using the migration credentials and database guards required by the script. The additive migration introduces one service field and two booking fields, without changing transaction or job status enums.

Existing cleaning services receive `PAY_NOW_OR_AFTER_COMPLETION`, enabling the requested choice for new bookings. Existing bookings receive `PREPAID_ONLY` and `PAY_NOW`, preserving their original terms. Admins can select prepaid-only for individual services before opening booking access. Re-running the migration does not reset configured policies.

Deploy the backend first, verify schema and API health, then deploy the admin and customer apps. Run a gateway test-mode lifecycle for each policy, including a completed unpaid cleaning booking and duplicate payment callbacks, before testing live-money collection. Do not test with real customer charges.

No automatic charging, deposits, partial payments, or push notifications were added. Production release verification includes database column checks, API readiness, and matching published frontend assets to the tested builds.
