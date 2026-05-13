import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  accountFindManyMock,
  accountDeleteManyMock,
  passwordCredentialFindUniqueMock,
  isDatabaseConfiguredMock,
  logSecurityEventMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  accountFindManyMock: vi.fn(),
  accountDeleteManyMock: vi.fn(),
  passwordCredentialFindUniqueMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  logSecurityEventMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findMany: accountFindManyMock,
      deleteMany: accountDeleteManyMock,
    },
    passwordCredential: {
      findUnique: passwordCredentialFindUniqueMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/security/logging", () => ({
  logSecurityEvent: logSecurityEventMock,
}));

import { DELETE, GET } from "@/app/api/auth/linked-providers/route";

function makeDeleteRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/linked-providers", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": "linked-providers-test",
    },
    body: JSON.stringify(body),
  });
}

describe("linked providers route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns linked providers and password capability", async () => {
    accountFindManyMock.mockResolvedValueOnce([
      { provider: "google", type: "oauth" },
      { provider: "facebook", type: "oauth" },
      { provider: "google", type: "oauth" },
    ]);
    passwordCredentialFindUniqueMock.mockResolvedValueOnce({ userId: "user-1" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.providers).toEqual(["facebook", "google"]);
    expect(body.hasPasswordCredential).toBe(true);
    expect(body.canLink).toContain("google");
    expect(body.canLink).toContain("facebook");
  });

  it("returns 503 when database is unavailable", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const response = await GET();

    expect(response.status).toBe(503);
  });

  it("returns 401 when user is not authenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("blocks unlink when it would remove the final sign-in method", async () => {
    accountFindManyMock.mockResolvedValueOnce([{ provider: "google" }]);
    passwordCredentialFindUniqueMock.mockResolvedValueOnce(null);

    const response = await DELETE(makeDeleteRequest({ provider: "google" }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("At least one sign-in method");
    expect(accountDeleteManyMock).not.toHaveBeenCalled();
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "AUTH_PROVIDER_UNLINK_ATTEMPT" }),
    );
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_PROVIDER_UNLINK_BLOCKED_LAST_METHOD",
        level: "warn",
      }),
    );
  });

  it("returns 422 for unsupported provider ids", async () => {
    const response = await DELETE(makeDeleteRequest({ provider: "github" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("Unsupported provider");
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_PROVIDER_UNLINK_INVALID_PROVIDER",
        level: "warn",
      }),
    );
  });

  it("returns 404 when provider is not linked", async () => {
    accountFindManyMock.mockResolvedValueOnce([{ provider: "google" }]);
    passwordCredentialFindUniqueMock.mockResolvedValueOnce({ userId: "user-1" });

    const response = await DELETE(makeDeleteRequest({ provider: "facebook" }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Provider not linked");
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_PROVIDER_UNLINK_NOT_FOUND",
        level: "warn",
      }),
    );
  });

  it("unlinks provider when alternate login methods remain", async () => {
    accountFindManyMock.mockResolvedValueOnce([
      { provider: "google" },
      { provider: "facebook" },
    ]);
    passwordCredentialFindUniqueMock.mockResolvedValueOnce(null);
    accountDeleteManyMock.mockResolvedValueOnce({ count: 1 });

    const response = await DELETE(makeDeleteRequest({ provider: "google" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.state).toBe("unlinked");
    expect(body.provider).toBe("google");
    expect(accountDeleteManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        provider: "google",
      },
    });
  });

  it("returns 503 for delete when database is unavailable", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const response = await DELETE(makeDeleteRequest({ provider: "google" }));

    expect(response.status).toBe(503);
  });

  it("returns 401 for delete when user is not authenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await DELETE(makeDeleteRequest({ provider: "google" }));

    expect(response.status).toBe(401);
  });
});
