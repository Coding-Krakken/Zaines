import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

import { sendBookingConfirmation, sendPaymentNotification } from '@/lib/notifications';

const QUEUE_PATH = path.resolve(process.cwd(), 'tmp', 'email-queue.log');

async function rmQueue() {
  try {
    await fs.unlink(QUEUE_PATH);
  } catch (e) {
    // ignore
  }
}

describe('notifications helper (dev queue)', () => {
  beforeEach(async () => {
    delete process.env.RESEND_API_KEY;
    await rmQueue();
  });

  afterEach(async () => {
    await rmQueue();
  });

  it('writes booking confirmation to dev queue when RESEND_API_KEY is not set', async () => {
    const booking = {
      id: 'b_test_1',
      bookingNumber: 'PB-TEST-0001',
      status: 'pending',
      user: { email: 'test@example.com', name: 'Test User' },
    } as any;

    const res = await sendBookingConfirmation(booking as any);
    expect(res.provider).toBe('dev-queue');

    const contents = await fs.readFile(QUEUE_PATH, 'utf8');
    expect(contents).toContain('booking_confirmation');
    expect(contents).toContain('PB-TEST-0001');
  });

  it('writes payment notification to dev queue when RESEND_API_KEY is not set', async () => {
    const booking = { id: 'b_test_2', bookingNumber: 'PB-TEST-0002', user: { email: 'pay@example.com' } } as any;
    const res = await sendPaymentNotification('b_test_2', 'success', booking as any);
    expect(res.provider).toBe('dev-queue');

    const contents = await fs.readFile(QUEUE_PATH, 'utf8');
    expect(contents).toContain('payment_notification');
    expect(contents).toContain('PB-TEST-0002');
  });
});
