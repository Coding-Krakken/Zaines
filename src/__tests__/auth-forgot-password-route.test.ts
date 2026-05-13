import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  userFindUniqueMock,
  passwordCredentialFindUniqueMock,
  verificationTokenDeleteManyMock,
  verificationTokenCreateMock,
  isDatabaseConfiguredMock,
  sendPasswordResetNotificationMock,
  logSecurityEventMock,
  rateLimitedResponseMock,
  getCorrelationIdMock,
} = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  passwordCredentialFindUniqueMock: vi.fn(),
  verificationTokenDeleteManyMock: vi.fn(),
  verificationTokenCreateMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  sendPasswordResetNotificationMock: vi.fn(),
  logSecurityEventMock: vi.fn(),
  rateLimitedResponseMock: vi.fn(),
  getCorrelationIdMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
    },
    passwordCredential: {
      findUnique: passwordCredentialFindUniqueMock,
    },
    verificationToken: {
      deleteMany: verificationTokenDeleteManyMock,
      create: verificationTokenCreateMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/notifications", () => ({
  sendPasswordResetNotification: sendPasswordResetNotificationMock,
}));

vi.mock("@/lib/security/logging", () => ({
  logSecurityEvent: logSecurityEventMock,
}));

vi.mock("@/lib/security/api", () => ({
  getCorrelationId: getCorrelationIdMock,
  rateLimitedResponse: rateLimitedResponseMock,
}));

import { POST } from "@/app/api/auth/forgot-password/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("forgot password telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    rateLimitedResponseMock.mockReturnValue(null);
    getCorrelationIdMock.mockReturnValue("forgot-correlation");
    sendPasswordResetNotificationMock.mockResolvedValue(undefined);
    verificationTokenDeleteManyMock.mockResolvedValue({ count: 0 });
    verificationTokenCreateMock.mockResolvedValue({ token: "tok" });
  });

  it("logs invalid payload event", async () => {
    const response = await POST(makeRequest({ email: "bad-email" }));

    expect(response.status).toBe(422);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "AUTH_RESET_REQUEST_ATTEMPT" }),
    );
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_RESET_REQUEST_INVALID",
        correlationId: "forgot-correlation",
        level: "warn",
      }),
    );
  });

  it("logs no-match event when account does not exist", async () => {
    userFindUniqueMock.mockResolvedValueOnce(null);

    const response = await POST(makeRequest({ email: "nobody@example.com" }));

    expect(response.status).toBe(202);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_RESET_REQUEST_NO_MATCH",
        correlationId: "forgot-correlation",
      }),
    );
  });
});
