import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const settingsStore = new Map<string, string>();
const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        const value = settingsStore.get(where.key);
        return value ? { key: where.key, value } : null;
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; value: string };
          update: { value: string };
        }) => {
          const key = where.key;
          const value = update.value || create.value;
          settingsStore.set(key, value);
          return { key, value };
        },
      ),
    },
  },
  isDatabaseConfigured: vi.fn(() => true),
}));

import { PATCH } from "@/app/api/admin/contact-submissions/[id]/route";
import { updateContactSubmissionStatus } from "@/lib/api/issue26";

const adminSession = {
  user: { id: "admin-1", role: "admin" },
};
const customerSession = {
  user: { id: "customer-1", role: "customer" },
};

function makeRequest(
  id: string,
  status: string,
): Request {
  return new NextRequest(
    `http://localhost/api/admin/contact-submissions/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Admin contact submission status API", () => {
  beforeEach(() => {
    settingsStore.clear();
    authMock.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest("sub-1", "resolved") as NextRequest, ctx("sub-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not staff or admin", async () => {
    authMock.mockResolvedValue(customerSession);
    const res = await PATCH(makeRequest("sub-1", "resolved") as NextRequest, ctx("sub-1"));
    expect(res.status).toBe(403);
  });

  it("returns 404 when submission not found", async () => {
    authMock.mockResolvedValue(adminSession);
    const res = await PATCH(makeRequest("nonexistent", "resolved") as NextRequest, ctx("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("updates submission status to resolved", async () => {
    authMock.mockResolvedValue(adminSession);

    // Set up existing submission
    const submissionId = "sub-test-1";
    const recordKey = `contact:submission:${submissionId}`;
    settingsStore.set(
      recordKey,
      JSON.stringify({
        submissionId,
        fullName: "Test User",
        email: "test@example.com",
        message: "Test message",
        createdAt: new Date().toISOString(),
        status: "open",
      }),
    );

    const res = await PATCH(
      makeRequest(submissionId, "resolved") as NextRequest,
      ctx(submissionId),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { submissionId: string; status: string };
    expect(data.status).toBe("resolved");

    // Verify in store
    const updated = JSON.parse(settingsStore.get(recordKey) || "{}");
    expect(updated.status).toBe("resolved");
  });

  it("toggles submission status from resolved back to open", async () => {
    authMock.mockResolvedValue(adminSession);

    const submissionId = "sub-test-2";
    const recordKey = `contact:submission:${submissionId}`;
    settingsStore.set(
      recordKey,
      JSON.stringify({
        submissionId,
        fullName: "Test User 2",
        email: "test2@example.com",
        message: "Test message 2",
        createdAt: new Date().toISOString(),
        status: "resolved",
      }),
    );

    const res = await PATCH(
      makeRequest(submissionId, "open") as NextRequest,
      ctx(submissionId),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { submissionId: string; status: string };
    expect(data.status).toBe("open");

    const updated = JSON.parse(settingsStore.get(recordKey) || "{}");
    expect(updated.status).toBe("open");
  });

  it("rejects invalid status values", async () => {
    authMock.mockResolvedValue(adminSession);

    const submissionId = "sub-test-3";
    const recordKey = `contact:submission:${submissionId}`;
    settingsStore.set(recordKey, JSON.stringify({ submissionId, status: "open" }));

    const res = await PATCH(
      makeRequest(submissionId, "invalid-status") as NextRequest,
      ctx(submissionId),
    );

    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toBeDefined();
  });

  it("updates contact submission status directly via helper", async () => {
    const submissionId = "sub-direct-1";
    const recordKey = `contact:submission:${submissionId}`;
    settingsStore.set(
      recordKey,
      JSON.stringify({
        submissionId,
        fullName: "Direct Test",
        email: "direct@example.com",
        message: "Direct test",
        createdAt: new Date().toISOString(),
        status: "open",
      }),
    );

    await updateContactSubmissionStatus(submissionId, "resolved");

    const updated = JSON.parse(settingsStore.get(recordKey) || "{}");
    expect(updated.status).toBe("resolved");
    expect(updated.fullName).toBe("Direct Test");
  });
});
