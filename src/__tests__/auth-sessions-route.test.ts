import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  isDatabaseConfiguredMock,
  sessionFindManyMock,
  sessionFindFirstMock,
  sessionDeleteMock,
  loginActivityFindManyMock,
  cookiesMock,
  headersMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  sessionFindManyMock: vi.fn(),
  sessionFindFirstMock: vi.fn(),
  sessionDeleteMock: vi.fn(),
  loginActivityFindManyMock: vi.fn(),
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findMany: sessionFindManyMock,
      findFirst: sessionFindFirstMock,
      delete: sessionDeleteMock,
    },
    loginActivity: {
      findMany: loginActivityFindManyMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

import { DELETE, GET } from "@/app/api/auth/sessions/route";

const originalEnv = { ...process.env };

function makeDeleteRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/sessions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("auth sessions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    isDatabaseConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "authjs.session-token" ? { value: "token-current" } : undefined,
    });

    headersMock.mockResolvedValue({
      get: (name: string) => (name === "user-agent" ? "Mozilla/5.0 Test" : null),
    });

    sessionFindManyMock.mockResolvedValue([
      {
        id: "session-1",
        sessionToken: "token-current",
        expires: new Date("2026-06-01T10:00:00.000Z"),
      },
      {
        id: "session-2",
        sessionToken: "token-other",
        expires: new Date("2026-05-20T10:00:00.000Z"),
      },
    ]);

    loginActivityFindManyMock.mockResolvedValue([
      {
        id: "activity-1",
        eventType: "sign_in",
        provider: "google",
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
        isSuspicious: true,
        createdAt: new Date("2026-05-13T12:00:00.000Z"),
      },
    ]);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns database strategy payload with current session and activity", async () => {
    process.env.AUTH_ENABLE_DATABASE_SESSIONS = " TRUE ";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.strategy).toBe("database");
    expect(body.sessions).toEqual([
      {
        id: "session-1",
        expiresAt: "2026-06-01T10:00:00.000Z",
        current: true,
        deviceHint: "Mozilla/5.0 Test",
      },
      {
        id: "session-2",
        expiresAt: "2026-05-20T10:00:00.000Z",
        current: false,
        deviceHint: null,
      },
    ]);
    expect(body.activity).toEqual([
      {
        id: "activity-1",
        eventType: "sign_in",
        provider: "google",
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
        isSuspicious: true,
        createdAt: "2026-05-13T12:00:00.000Z",
      },
    ]);
  });

  it("returns jwt strategy when database sessions are not enabled", async () => {
    process.env.AUTH_ENABLE_DATABASE_SESSIONS = "false";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.strategy).toBe("jwt");
  });

  it("returns 422 when delete request omits sessionId", async () => {
    const response = await DELETE(makeDeleteRequest({}));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("sessionId is required");
  });

  it("returns 404 when session to revoke is not found", async () => {
    sessionFindFirstMock.mockResolvedValueOnce(null);

    const response = await DELETE(makeDeleteRequest({ sessionId: "missing-session" }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Session not found");
  });

  it("revokes session for authenticated owner", async () => {
    sessionFindFirstMock.mockResolvedValueOnce({ id: "session-2" });
    sessionDeleteMock.mockResolvedValueOnce({ id: "session-2" });

    const response = await DELETE(makeDeleteRequest({ sessionId: "session-2" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.state).toBe("revoked");
    expect(sessionDeleteMock).toHaveBeenCalledWith({ where: { id: "session-2" } });
  });
});
