import fs from "fs";
import path from "path";

const DEV_QUEUE_PATH = path.resolve(process.cwd(), "tmp", "email-queue.log");
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 250; // base backoff
let redisQueue: any | null = null;

function initRedisQueueIfConfigured() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return null;
    if (redisQueue) return redisQueue;
    // lazy require to avoid hard dependency when not used in tests/dev
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue } = require('bullmq');
    redisQueue = new Queue('emailQueue', { connection: { url: redisUrl } });
    return redisQueue;
  } catch (err) {
    // ignore; will fallback to file queue
    return null;
  }
}

async function ensureQueueDir() {
  const dir = path.dirname(DEV_QUEUE_PATH);
  await fs.promises.mkdir(dir, { recursive: true });
}

async function appendToDevQueue(entry: unknown) {
  // If REDIS_URL is configured, push the entry to Redis queue for background processing
  const q = initRedisQueueIfConfigured();
  if (q) {
    try {
      await q.add('email', { entry }, { attempts: 5, backoff: { type: 'exponential', delay: 500 } });
      return;
    } catch (err) {
      // fallthrough to file queue on error
    }
  }

  await ensureQueueDir();
  const line = JSON.stringify({ ts: new Date().toISOString(), entry }) + "\n";
  await fs.promises.appendFile(DEV_QUEUE_PATH, line, "utf8");
}

type SendResult = { sent: boolean; provider: "resend" | "dev-queue"; detail?: unknown };

async function sendEmailViaResend(payload: { from: string; to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (res.ok) return { ok: true, json };

      // Treat 5xx as retryable
      if (res.status >= 500 && res.status < 600) {
        lastError = { status: res.status, json };
      } else {
        return { ok: false, json };
      }
    } catch (err) {
      lastError = err;
    }

    // exponential backoff
    const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
    await new Promise((res) => setTimeout(res, backoff));
  }

  throw lastError;
}

async function processQueuedEntries() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // nothing to do in dev mode

  try {
    const data = await fs.promises.readFile(DEV_QUEUE_PATH, "utf8");
    const lines = data.split("\n").filter(Boolean);
    if (lines.length === 0) return;

    const remaining: string[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const entry = parsed.entry as any;
        if (!entry || !entry.type) {
          // unknown entry, skip
          continue;
        }

        if (entry.type === "booking_confirmation" || entry.type === "payment_notification") {
          const payload = {
            from: entry.from,
            to: entry.to,
            subject: entry.subject,
            html: entry.html,
          };

          try {
            await sendEmailViaResend(payload);
            // success — do not re-add
            continue;
          } catch (err) {
            // failed to send — keep in remaining
            remaining.push(line);
            continue;
          }
        }

        // unknown type — keep it for manual inspection
        remaining.push(line);
      } catch (err) {
        // if a line is corrupt, skip it
      }
    }

    // rewrite file with remaining lines
    if (remaining.length > 0) {
      await fs.promises.writeFile(DEV_QUEUE_PATH, remaining.join("\n") + "\n", "utf8");
    } else {
      // no remaining entries — remove file
      await fs.promises.rm(DEV_QUEUE_PATH).catch(() => {});
    }
  } catch (err) {
    // no queue file — nothing to process
  }
}

// Try processing queued entries on module import if possible
void processQueuedEntries().catch(() => {});

export async function sendBookingConfirmation(booking: any): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || "noreply@pawfectstays.com";
  const apiKey = process.env.RESEND_API_KEY;
  const to = booking?.user?.email;
  const subject = `Booking ${booking?.bookingNumber} confirmation`;
  const html = `<p>Thanks ${booking?.user?.name || "guest"},</p><p>Your booking ${booking?.bookingNumber} is ${booking?.status}.</p>`;

  if (!to) {
    return { sent: false, provider: "dev-queue", detail: "no-recipient" };
  }

  if (!apiKey) {
    await appendToDevQueue({ type: "booking_confirmation", to, from, subject, html, bookingId: booking?.id });
    return { sent: false, provider: "dev-queue" };
  }

  try {
    const resp = await sendEmailViaResend({ from, to, subject, html });
    if (resp && (resp as any).ok) return { sent: true, provider: "resend", detail: (resp as any).json };
    // non-ok response (validation etc.) — record to dev queue for manual inspection
    await appendToDevQueue({ type: "booking_confirmation", to, from, subject, html, bookingId: booking?.id, response: (resp as any).json });
    return { sent: false, provider: "dev-queue", detail: (resp as any).json };
  } catch (err) {
    // after retries, still failed — append to queue for manual retry later
    await appendToDevQueue({ type: "booking_confirmation", to, from, subject, html, bookingId: booking?.id, error: String(err) });
    return { sent: false, provider: "dev-queue", detail: String(err) };
  }
}

export async function sendPaymentNotification(bookingId: string, type: "success" | "failure", booking?: any): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || "noreply@pawfectstays.com";
  const apiKey = process.env.RESEND_API_KEY;
  const to = booking?.user?.email;
  const subject = `Booking ${booking?.bookingNumber || bookingId} payment ${type}`;
  const html = `<p>Your payment for booking ${booking?.bookingNumber || bookingId} has ${type}.</p>`;

  if (!to) {
    return { sent: false, provider: "dev-queue", detail: "no-recipient" };
  }

  if (!apiKey) {
    await appendToDevQueue({ type: "payment_notification", to, from, subject, html, bookingId, status: type });
    return { sent: false, provider: "dev-queue" };
  }

  try {
    const resp = await sendEmailViaResend({ from, to, subject, html });
    if (resp && (resp as any).ok) return { sent: true, provider: "resend", detail: (resp as any).json };
    await appendToDevQueue({ type: "payment_notification", to, from, subject, html, bookingId, status: type, response: (resp as any).json });
    return { sent: false, provider: "dev-queue", detail: (resp as any).json };
  } catch (err) {
    await appendToDevQueue({ type: "payment_notification", to, from, subject, html, bookingId, status: type, error: String(err) });
    return { sent: false, provider: "dev-queue", detail: String(err) };
  }
}

