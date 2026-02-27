import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { __resetIssue26InMemoryState } from "@/lib/api/issue26";

const settingsStore = new Map<string, string>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        const value = settingsStore.get(where.key);
        return value ? { key: where.key, value } : null;
      }),
      create: vi.fn(async ({ data }: { data: { key: string; value: string } }) => {
        settingsStore.set(data.key, data.value);
        return { key: data.key, value: data.value };
      }),
      upsert: vi.fn(async ({ where, create }: { where: { key: string }; create: { key: string; value: string } }) => {
        if (!settingsStore.has(where.key)) settingsStore.set(create.key, create.value);
        return { key: where.key, value: settingsStore.get(where.key) || "" };
      }),
      findMany: vi.fn(),
    },
    suite: { count: vi.fn() },
    booking: { count: vi.fn() },
  },
  isDatabaseConfigured: vi.fn(() => true),
}));

describe("POST /api/contact/submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsStore.clear();
    __resetIssue26InMemoryState();
  });

  it("returns CONTACT_VALIDATION_FAILED for invalid payload", async () => {
    const request = new NextRequest("http://localhost:3000/api/contact/submissions", {
      method: "POST",
      body: JSON.stringify({ fullName: "A" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.errorCode).toBe("CONTACT_VALIDATION_FAILED");
  });
});