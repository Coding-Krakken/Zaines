/* eslint-disable @typescript-eslint/no-explicit-any */
/* Worker to process emailQueue using BullMQ. Requires REDIS_URL env var. */

async function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL is not set. Worker exiting.');
    process.exit(1);
  }

  // Lazy import so repo can run without bullmq installed when not used
  const { Worker } = (await import('bullmq')) as any;

  // Load notifications helper (which exposes sendEmailViaResend indirectly via functions)
  const notifications = (await import('../src/lib/notifications')) as any;

  const worker = new Worker('emailQueue', async (job: any) => {
    const entry = job.data.entry;
    if (!entry || !entry.type) return;

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

  worker.on('completed', (job: any) => {
    console.log('Job completed', job.id);
  });

  worker.on('failed', (job: any, err: any) => {
    console.error('Job failed', job.id, err);
  });

  console.log('Worker started, processing emailQueue...');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
