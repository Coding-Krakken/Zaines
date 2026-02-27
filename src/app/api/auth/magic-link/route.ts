import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import {
  createPublicErrorEnvelope,
  getCorrelationId,
  logServerFailure,
  magicLinkRequestSchema,
} from "@/lib/api/issue26";

function isAuthMisconfigured(): boolean {
  const hasResendKey = Boolean(
    process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY,
  );
  const hasEmailFrom = Boolean(process.env.EMAIL_FROM);
  return !hasResendKey || !hasEmailFrom;
}

function classifyAuthFailure(
  error: unknown,
): "AUTH_PROVIDER_MISCONFIGURED" | "AUTH_TRANSIENT_FAILURE" {
  const rawMessage = error instanceof Error ? error.message : "";
  const message = rawMessage.toLowerCase();

  if (
    message.includes("nextauth") ||
    message.includes("resend") ||
    message.includes("configuration") ||
    message.includes("secret") ||
    message.includes("url")
  ) {
    return "AUTH_PROVIDER_MISCONFIGURED";
  }

  return "AUTH_TRANSIENT_FAILURE";
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "INVALID_EMAIL",
        message: "Enter a valid email address.",
        retryable: false,
        correlationId,
      }),
      { status: 422 },
    );
  }

  const parsed = magicLinkRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "INVALID_EMAIL",
        message: "Enter a valid email address.",
        retryable: false,
        correlationId,
      }),
      { status: 422 },
    );
  }

  if (isAuthMisconfigured()) {
    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode: "AUTH_PROVIDER_MISCONFIGURED",
        message: "Sign-in is temporarily unavailable. Please contact support.",
        retryable: false,
        correlationId,
      }),
      { status: 500 },
    );
  }

  try {
    const callbackUrl =
      parsed.data.intent === "manage_booking"
        ? "/dashboard/bookings"
        : "/dashboard";
    const result = await signIn("resend", {
      email: parsed.data.email,
      redirect: false,
      callbackUrl,
    });

    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error
    ) {
      const errorCode = classifyAuthFailure(result.error);
      return NextResponse.json(
        createPublicErrorEnvelope({
          errorCode,
          message:
            errorCode === "AUTH_PROVIDER_MISCONFIGURED"
              ? "Sign-in is temporarily unavailable. Please contact support."
              : "Sign-in is temporarily unavailable. Please retry.",
          retryable: errorCode === "AUTH_TRANSIENT_FAILURE",
          correlationId,
        }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        state: "sent",
        message: "If an account exists, a sign-in link has been sent.",
      },
      { status: 202 },
    );
  } catch (error) {
    const errorCode = classifyAuthFailure(error);
    logServerFailure("/api/auth/magic-link", errorCode, correlationId, error);

    return NextResponse.json(
      createPublicErrorEnvelope({
        errorCode,
        message:
          errorCode === "AUTH_PROVIDER_MISCONFIGURED"
            ? "Sign-in is temporarily unavailable. Please contact support."
            : "Sign-in is temporarily unavailable. Please retry.",
        retryable: errorCode === "AUTH_TRANSIENT_FAILURE",
        correlationId,
      }),
      { status: 500 },
    );
  }
}
