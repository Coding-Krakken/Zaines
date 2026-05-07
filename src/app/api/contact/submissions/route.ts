import { NextRequest, NextResponse } from "next/server";
import {
  contactSubmissionSchema,
  createPublicErrorEnvelope,
  getCorrelationId,
  logServerFailure,
  persistContactSubmission,
} from "@/lib/api/issue26";
import { sendContactSubmissionNotification } from "@/lib/notifications";
import { rateLimitedResponse } from "@/lib/security/api";

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "CONTACT_VALIDATION_FAILED",
        message: "Please provide valid contact details and message.",
        retryable: false,
        correlationId,
      }),
      { status: 422 },
    );
  }

  const parsed = contactSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "CONTACT_VALIDATION_FAILED",
        message: "Please provide valid contact details and message.",
        retryable: false,
        correlationId,
      }),
      { status: 422 },
    );
  }

  const rateLimit = rateLimitedResponse({
    request,
    routeKey: "contact_submit",
    route: "/api/contact/submissions",
    correlationId,
    limit: 5,
    windowMs: 60_000,
    subject: parsed.data.idempotencyKey,
    errorCode: "CONTACT_RATE_LIMITED",
  });
  if (rateLimit) return rateLimit;

  try {
    const persisted = await persistContactSubmission(parsed.data);

    // Best-effort admin alert. Submission success should not depend on email delivery.
    try {
      await sendContactSubmissionNotification({
        submissionId: persisted.submissionId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.message,
      });
    } catch (notificationError) {
      logServerFailure(
        "/api/contact/submissions",
        "CONTACT_NOTIFICATION_FAILED",
        correlationId,
        notificationError,
      );
    }

    return NextResponse.json(
      {
        submissionId: persisted.submissionId,
        status: "received",
      },
      { status: 201 },
    );
  } catch (error) {
    logServerFailure(
      "/api/contact/submissions",
      "CONTACT_PERSISTENCE_FAILED",
      correlationId,
      error,
    );
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "CONTACT_PERSISTENCE_FAILED",
        message: "We couldn't submit your message right now. Please retry.",
        retryable: true,
        correlationId,
      }),
      { status: 503 },
    );
  }
}
