# Support inbox and in-app notifications

General enquiries submitted at `/contact` are stored in the API's `contact_messages` table. Admins open `/support-messages` in the admin dashboard, read the enquiry, and submit a reply with a status. The reply and its `user_notifications` record are saved in one transaction. Existing utility tickets remain separate.

Customers see an unread badge in the header, open the notification panel, and follow a link to `/contact?message=ID` to read the conversation. Marking a notification as read is an explicit action. Notification and enquiry queries include the authenticated account ID; admins can read all enquiries. Customer-facing replies do not expose administrator account details.

The bell and customer history poll every 30 seconds while the app is active. This is not live chat or browser/mobile push. General enquiries now persist in the admin inbox instead of relying on the earlier email-only contact handler. Email, phone, and WhatsApp links remain separate contact options; conversations through those channels are not imported automatically.

## Deployment order

1. Back up the API database and stage the backend containing the models, routes, service and migration.
2. Run `node scripts/migrate-contact-notifications.js` with the intended database configuration. For production, use `NODE_ENV=production node scripts/migrate-contact-notifications.js --confirm-database lofix`, with `DATABASE_CREATE=false` and migration credentials configured as required by the script. The migration only creates `contact_messages`, `contact_replies`, and `user_notifications`; it does not alter existing tables.
3. Run the backend schema check, deploy/restart the API, and verify readiness.
4. Deploy the admin dashboard and customer site.
5. Submit a test enquiry, reply as an admin, verify its owner's bell and conversation, and verify read state survives reload. Confirm another account cannot read the enquiry or notification.

API routes are under `/support`: `POST /messages`, `GET /messages`, `GET /messages/:id`, admin-only `POST /messages/:id/replies`, `GET /notifications`, and `PATCH /notifications/:id/read`. List routes support `limit` (maximum 50) and `offset`. Enquiries support `OPEN`, `IN_REVIEW`, and `RESOLVED` statuses. New enquiries are limited to five per account per fifteen minutes in the current single-process deployment.

Production migration was applied on 12 November 2026 using the server's local MySQL root socket because dedicated migration credentials were not configured. Backend release: `d3687d5`. The pre-migration backup and checksum are stored on the server at `/root/lofix-backups/before-support-d3687d5.sql` and the matching `.sha256` file. All three new tables were verified after migration.
