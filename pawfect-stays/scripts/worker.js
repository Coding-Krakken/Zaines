/* Worker to process emailQueue using BullMQ. Requires REDIS_URL env var. */
const path = require('path');
const fs = require('fs');

async function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL is not set. Worker exiting.');
    process.exit(1);
  }

  // Lazy import so repo can run without bullmq installed when not used
  const { Worker } = require('bullmq');

  // Load notifications helper (which exposes sendEmailViaResend indirectly via functions)
  const notifications = require('../src/lib/notifications');

  const worker = new Worker('emailQueue', async (job) => {
    const entry = job.data.entry;
    if (!entry || !entry.type) return;

    const payload = {
      from: entry.from,
      to: entry.to,
      subject: entry.subject,
      html: entry.html,
    };

    try {
      // Use internal sendEmailViaResend by calling sendBookingConfirmation/payments
      if (entry.type === 'booking_confirmation') {
        await notifications.sendBookingConfirmation({ user: { email: entry.to, name: '' }, bookingNumber: entry.bookingId || 'n/a', status: 'queued' });
      } else if (entry.type === 'payment_notification') {
        await notifications.sendPaymentNotification(entry.bookingId || 'unknown', entry.status === 'success' ? 'success' : 'failure', { user: { email: entry.to } });
      }
      return Promise.resolve();
    } catch (err) {
      console.error('Failed to process job', err);
      throw err;
    }
  }, { connection: { url: redisUrl } });

  worker.on('completed', (job) => {
    console.log('Job completed', job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('Job failed', job.id, err);
  });

  console.log('Worker started, processing emailQueue...');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
