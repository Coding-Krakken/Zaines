Title: Add booking & payment lifecycle notifications (emails/logging)

Description

Implement confirmation / cancellation email notifications and developer-friendly logging/queuing for production and dev modes.

Evidence

TODOs are present in `src/app/api/bookings/route.ts` and `src/app/api/payments/webhook/route.ts`. `.env.example` includes `RESEND_API_KEY` for email provider configuration.

Acceptance criteria

- On booking creation, a confirmation email is sent (or recorded in a dev queue/log).\n- On payment success or failure webhook, a notification is sent and logged.\n- Documentation shows how to configure the email provider env var and how to inspect dev logs/queues.

Labels: feature, notifications, priority/medium
