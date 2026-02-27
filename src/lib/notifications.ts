import fs from "fs";
import path from "path";
import os from "os";

// Use an explicit env override if provided, otherwise prefer a writable
// system temp directory (works on serverless platforms like Vercel).
const DEV_QUEUE_PATH = process.env.DEV_QUEUE_PATH
  ? path.resolve(process.env.DEV_QUEUE_PATH)
  : path.resolve(
      process.env.NODE_ENV === "production" ? os.tmpdir() : process.cwd(),
      "tmp",
      "email-queue.log",
    );
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 250; // base backoff
let redisQueue: {
  add: (name: string, data: unknown, opts?: unknown) => Promise<unknown>;
} | null = null;

async function ensureQueueDir() {
  const dir = path.dirname(DEV_QUEUE_PATH);
  await fs.promises.mkdir(dir, { recursive: true });
}

async function appendToDevQueue(entry: unknown) {
  // If REDIS_URL is configured, push the entry to Redis queue for background processing
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      if (!redisQueue) {
        // dynamic import to avoid adding hard dependency at module load
        const { Queue } = await import("bullmq");
        // Type of Queue from bullmq is compatible with our minimal shape
        // @ts-expect-error - dynamic import types are not worth enforcing here
        redisQueue = new Queue("emailQueue", { connection: { url: redisUrl } });
      }

      if (redisQueue) {
        await redisQueue.add("email", { entry }, {
          attempts: 5,
          backoff: { type: "exponential", delay: 500 },
        } as unknown);
        return;
      }
    } catch {
      // fallthrough to file queue on error
    }
  }

  await ensureQueueDir();
  const line = JSON.stringify({ ts: new Date().toISOString(), entry }) + "\n";
  await fs.promises.appendFile(DEV_QUEUE_PATH, line, "utf8");
}

type SendResult = {
  sent: boolean;
  provider: "resend" | "dev-queue";
  detail?: unknown;
};

async function sendEmailViaResend(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; json?: unknown }> {
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

type EmailQueueBookingEntry = {
  type: "booking_confirmation";
  from: string;
  to: string;
  subject: string;
  html: string;
  bookingId?: string;
  response?: unknown;
  error?: string;
};

type EmailQueuePaymentEntry = {
  type: "payment_notification";
  from: string;
  to: string;
  subject: string;
  html: string;
  bookingId?: string;
  status?: string;
  response?: unknown;
  error?: string;
};

type EmailQueueEntry =
  | EmailQueueBookingEntry
  | EmailQueuePaymentEntry
  | { type?: string };

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
        const parsed = JSON.parse(line) as { entry?: unknown };
        const entry = parsed.entry as EmailQueueEntry | undefined;
        if (!entry || !entry.type) {
          // unknown entry, skip
          continue;
        }

        if (
          entry.type === "booking_confirmation" ||
          entry.type === "payment_notification"
        ) {
          const e = entry as EmailQueueBookingEntry | EmailQueuePaymentEntry;
          const payload = {
            from: e.from,
            to: e.to,
            subject: e.subject,
            html: e.html,
          };

          try {
            await sendEmailViaResend(payload);
            // success — do not re-add
            continue;
          } catch {
            // failed to send — keep in remaining
            remaining.push(line);
            continue;
          }
        }

        // unknown type — keep it for manual inspection
        remaining.push(line);
      } catch {
        // if a line is corrupt, skip it
      }
    }

    // rewrite file with remaining lines
    if (remaining.length > 0) {
      await fs.promises.writeFile(
        DEV_QUEUE_PATH,
        remaining.join("\n") + "\n",
        "utf8",
      );
    } else {
      // no remaining entries — remove file
      await fs.promises.rm(DEV_QUEUE_PATH).catch(() => {});
    }
  } catch {
    // no queue file — nothing to process
  }
}

// Try processing queued entries on module import if possible
void processQueuedEntries().catch(() => {});

export type Booking = {
  id?: string;
  bookingNumber?: string;
  status?: string;
  user?: { email?: string | null; name?: string | null };
};

export async function sendBookingConfirmation(
  booking: Booking,
): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || "noreply@pawfectstays.com";
  const apiKey = process.env.RESEND_API_KEY;
  const to = booking?.user?.email;
  const subject = `Booking ${booking?.bookingNumber} confirmation`;
  const html = `<p>Thanks ${booking?.user?.name || "guest"},</p><p>Your booking ${booking?.bookingNumber} is ${booking?.status}.</p>`;

  if (!to) {
    return { sent: false, provider: "dev-queue", detail: "no-recipient" };
  }

  if (!apiKey) {
    await appendToDevQueue({
      type: "booking_confirmation",
      to,
      from,
      subject,
      html,
      bookingId: booking?.id,
    });
    return { sent: false, provider: "dev-queue" };
  }

  try {
    const resp = await sendEmailViaResend({ from, to, subject, html });
    if (resp && resp.ok)
      return { sent: true, provider: "resend", detail: resp.json };
    // non-ok response (validation etc.) — record to dev queue for manual inspection
    await appendToDevQueue({
      type: "booking_confirmation",
      to,
      from,
      subject,
      html,
      bookingId: booking?.id,
      response: resp.json,
    });
    return { sent: false, provider: "dev-queue", detail: resp.json };
  } catch (err) {
    // after retries, still failed — append to queue for manual retry later
    await appendToDevQueue({
      type: "booking_confirmation",
      to,
      from,
      subject,
      html,
      bookingId: booking?.id,
      error: String(err),
    });
    return { sent: false, provider: "dev-queue", detail: String(err) };
  }
}

export async function sendPaymentNotification(
  bookingId: string,
  type: "success" | "failure",
  booking?: Booking,
): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || "noreply@pawfectstays.com";
  const apiKey = process.env.RESEND_API_KEY;
  const to = booking?.user?.email;
  const subject = `Booking ${booking?.bookingNumber || bookingId} payment ${type}`;
  const html = `<p>Your payment for booking ${booking?.bookingNumber || bookingId} has ${type}.</p>`;

  if (!to) {
    return { sent: false, provider: "dev-queue", detail: "no-recipient" };
  }

  if (!apiKey) {
    await appendToDevQueue({
      type: "payment_notification",
      to,
      from,
      subject,
      html,
      bookingId,
      status: type,
    });
    return { sent: false, provider: "dev-queue" };
  }

  try {
    const resp = await sendEmailViaResend({ from, to, subject, html });
    if (resp && resp.ok)
      return { sent: true, provider: "resend", detail: resp.json };
    await appendToDevQueue({
      type: "payment_notification",
      to,
      from,
      subject,
      html,
      bookingId,
      status: type,
      response: resp.json,
    });
    return { sent: false, provider: "dev-queue", detail: resp.json };
  } catch (err) {
    await appendToDevQueue({
      type: "payment_notification",
      to,
      from,
      subject,
      html,
      bookingId,
      status: type,
      error: String(err),
    });
    return { sent: false, provider: "dev-queue", detail: String(err) };
  }
}
