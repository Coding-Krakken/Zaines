import { NextRequest, NextResponse } from "next/server";
import {
  contactSubmissionSchema,
  getCorrelationId,
  logServerFailure,
  persistContactSubmission,
  shouldThrottle,
} from "@/lib/api/issue26";

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        errorCode: "CONTACT_VALIDATION_FAILED",
        message: "Please provide valid contact details and message.",
        retryable: false,
        correlationId,
      },
      { status: 422 }
    );
  }

  const parsed = contactSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        errorCode: "CONTACT_VALIDATION_FAILED",
        message: "Please provide valid contact details and message.",
        retryable: false,
        correlationId,
      },
      { status: 422 }
    );
  }

  if (shouldThrottle(request, "contact_submit")) {
    return NextResponse.json(
      {
        errorCode: "CONTACT_RATE_LIMITED",
        message: "Too many attempts. Please wait and try again.",
        retryable: true,
        correlationId,
      },
      { status: 429 }
    );
  }

  try {
    const persisted = await persistContactSubmission(parsed.data);

    return NextResponse.json(
      {
        submissionId: persisted.submissionId,
        status: "received",
      },
      { status: 201 }
    );
  } catch (error) {
    logServerFailure("/api/contact/submissions", "CONTACT_PERSISTENCE_FAILED", correlationId, error);
    return NextResponse.json(
      {
        errorCode: "CONTACT_PERSISTENCE_FAILED",
        message: "We couldn't submit your message right now. Please retry.",
        retryable: true,
        correlationId,
      },
      { status: 503 }
    );
  }
}
