import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  userFindUniqueMock,
  userCreateMock,
  passwordCredentialCreateMock,
  isDatabaseConfiguredMock,
  logSecurityEventMock,
  rateLimitedResponseMock,
  getCorrelationIdMock,
} = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  userCreateMock: vi.fn(),
  passwordCredentialCreateMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  logSecurityEventMock: vi.fn(),
  rateLimitedResponseMock: vi.fn(),
  getCorrelationIdMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      create: userCreateMock,
    },
    passwordCredential: {
      create: passwordCredentialCreateMock,
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

import { POST } from "@/app/api/auth/register/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("register route telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    rateLimitedResponseMock.mockReturnValue(null);
    getCorrelationIdMock.mockReturnValue("register-correlation");
    userFindUniqueMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
      name: "New Customer",
    });
    passwordCredentialCreateMock.mockResolvedValue({ id: "cred-1" });
    delete process.env.AUTH_ENABLE_PASSWORD_LOGIN;
  });

  it("logs validation failure event for invalid payload", async () => {
    const response = await POST(makeRequest({ email: "bad-email" }));

    expect(response.status).toBe(422);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "AUTH_REGISTER_ATTEMPT" }),
    );
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_REGISTER_VALIDATION_FAILED",
        level: "warn",
        correlationId: "register-correlation",
      }),
    );
  });

  it("logs exists event when account already exists", async () => {
    userFindUniqueMock.mockResolvedValueOnce({ id: "existing-user" });

    const response = await POST(
      makeRequest({
        email: "new@example.com",
        password: "StrongPass123!",
        name: "New Customer",
      }),
    );

    expect(response.status).toBe(409);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_REGISTER_EXISTS",
        level: "warn",
        correlationId: "register-correlation",
      }),
    );
  });
});
