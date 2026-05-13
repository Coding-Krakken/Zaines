import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  verificationTokenFindFirstMock,
  verificationTokenDeleteManyMock,
  userFindUniqueMock,
  passwordCredentialUpsertMock,
  isDatabaseConfiguredMock,
  logSecurityEventMock,
  rateLimitedResponseMock,
  getCorrelationIdMock,
} = vi.hoisted(() => ({
  verificationTokenFindFirstMock: vi.fn(),
  verificationTokenDeleteManyMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  passwordCredentialUpsertMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  logSecurityEventMock: vi.fn(),
  rateLimitedResponseMock: vi.fn(),
  getCorrelationIdMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      findFirst: verificationTokenFindFirstMock,
      deleteMany: verificationTokenDeleteManyMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
    passwordCredential: {
      upsert: passwordCredentialUpsertMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/security/logging", () => ({
  logSecurityEvent: logSecurityEventMock,
}));

vi.mock("@/lib/security/api", () => ({
  getCorrelationId: getCorrelationIdMock,
  rateLimitedResponse: rateLimitedResponseMock,
}));

import { POST } from "@/app/api/auth/reset-password/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("reset password telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    rateLimitedResponseMock.mockReturnValue(null);
    getCorrelationIdMock.mockReturnValue("reset-correlation");
    verificationTokenDeleteManyMock.mockResolvedValue({ count: 1 });
    passwordCredentialUpsertMock.mockResolvedValue({ id: "cred-1" });
  });

  it("logs invalid payload event", async () => {
    const response = await POST(makeRequest({ email: "bad", token: "short" }));

    expect(response.status).toBe(422);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "AUTH_RESET_CONFIRM_ATTEMPT" }),
    );
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_RESET_CONFIRM_INVALID_PAYLOAD",
        level: "warn",
        correlationId: "reset-correlation",
      }),
    );
  });

  it("logs token invalid event when reset token is missing", async () => {
    verificationTokenFindFirstMock.mockResolvedValueOnce(null);

    const response = await POST(
      makeRequest({
        email: "user@example.com",
        token: "a".repeat(24),
        password: "StrongPass123!",
      }),
    );

    expect(response.status).toBe(422);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_RESET_CONFIRM_TOKEN_INVALID",
        level: "warn",
        correlationId: "reset-correlation",
      }),
    );
  });
});
