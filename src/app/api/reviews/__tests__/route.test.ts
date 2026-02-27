import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { POST } from "../submissions/route";

const settingsStore = new Map<string, string>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        const value = settingsStore.get(where.key);
        return value ? { key: where.key, value } : null;
      }),
      create: vi.fn(
        async ({ data }: { data: { key: string; value: string } }) => {
          settingsStore.set(data.key, data.value);
          return { key: data.key, value: data.value };
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
        }: {
          where: { key: string };
          create: { key: string; value: string };
        }) => {
          if (!settingsStore.has(where.key))
            settingsStore.set(create.key, create.value);
          return { key: where.key, value: settingsStore.get(where.key) || "" };
        },
      ),
      findMany: vi.fn(
        async ({ where }: { where: { key: { startsWith: string } } }) => {
          return [...settingsStore.entries()]
            .filter(([key]) => key.startsWith(where.key.startsWith))
            .map(([key, value]) => ({ key, value, updatedAt: new Date() }));
        },
      ),
    },
    suite: { count: vi.fn() },
    booking: { count: vi.fn() },
  },
  isDatabaseConfigured: vi.fn(() => true),
}));

describe("reviews contract routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsStore.clear();
  });

  it("returns REVIEW_VALIDATION_FAILED for invalid review submission", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/reviews/submissions",
      {
        method: "POST",
        body: JSON.stringify({ displayName: "A" }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.errorCode).toBe("REVIEW_VALIDATION_FAILED");
  });

  it("public listing enforces approved-only filter", async () => {
    settingsStore.set(
      "review:submission:approved",
      JSON.stringify({
        reviewId: "approved",
        displayName: "Approved",
        rating: 5,
        title: "Great",
        body: "Great service and care.",
        moderationStatus: "approved",
        createdAt: new Date().toISOString(),
      }),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reviews).toHaveLength(1);
  });
});
