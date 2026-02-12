import fs from "fs";
import path from "path";

const DEV_QUEUE_PATH = path.resolve(process.cwd(), "tmp", "email-queue.log");

async function ensureQueueDir() {
  const dir = path.dirname(DEV_QUEUE_PATH);
  await fs.promises.mkdir(dir, { recursive: true });
}

async function appendToDevQueue(entry: unknown) {
  await ensureQueueDir();
  const line = JSON.stringify({ ts: new Date().toISOString(), entry }) + "\n";
  await fs.promises.appendFile(DEV_QUEUE_PATH, line, "utf8");
}

type SendResult = { sent: boolean; provider: "resend" | "dev-queue"; detail?: unknown };

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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const json = await res.json().catch(() => null);
    return { sent: res.ok, provider: "resend", detail: json };
  } catch (err) {
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const json = await res.json().catch(() => null);
    return { sent: res.ok, provider: "resend", detail: json };
  } catch (err) {
    await appendToDevQueue({ type: "payment_notification", to, from, subject, html, bookingId, status: type, error: String(err) });
    return { sent: false, provider: "dev-queue", detail: String(err) };
  }
}
