import { NextRequest, NextResponse } from "next/server";
import {
  createPublicErrorEnvelope,
  getCorrelationId,
  logServerFailure,
  persistReviewSubmission,
  reviewSubmissionSchema,
} from "@/lib/api/issue26";
import { rateLimitedResponse } from "@/lib/security/api";

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "REVIEW_VALIDATION_FAILED",
        message: "Please provide valid review details before submitting.",
        retryable: false,
        correlationId,
      }),
      { status: 422 },
    );
  }

  const parsed = reviewSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "REVIEW_VALIDATION_FAILED",
        message: "Please provide valid review details before submitting.",
        retryable: false,
        correlationId,
      }),
      { status: 422 },
    );
  }

  const rateLimit = rateLimitedResponse({
    request,
    routeKey: "review_submit",
    route: "/api/reviews/submissions",
    correlationId,
    limit: 5,
    windowMs: 60_000,
    subject: parsed.data.idempotencyKey,
  });
  if (rateLimit) return rateLimit;

  try {
    const persisted = await persistReviewSubmission(parsed.data);

    return NextResponse.json(
      {
        reviewId: persisted.reviewId,
        moderationStatus: "pending",
      },
      { status: 201 },
    );
  } catch (error) {
    logServerFailure(
      "/api/reviews/submissions",
      "REVIEW_PERSISTENCE_FAILED",
      correlationId,
      error,
    );
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "REVIEW_PERSISTENCE_FAILED",
        message: "We couldn't submit your review right now. Please retry.",
        retryable: true,
        correlationId,
      }),
      { status: 503 },
    );
  }
}
