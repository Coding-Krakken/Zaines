import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const settingsStore = new Map<string, string>();
let suiteCount = 3;
let bookingCount = 0;
const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ signIn: signInMock }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    suite: { count: vi.fn(async () => suiteCount) },
    booking: { count: vi.fn(async () => bookingCount) },
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
      findMany: vi.fn(async ({ where }: { where: { key: { startsWith: string } } }) => {
        return [...settingsStore.entries()]
          .filter(([key]) => key.startsWith(where.key.startsWith))
          .map(([key, value]) => ({ key, value, updatedAt: new Date() }));
      }),
    },
  },
  isDatabaseConfigured: vi.fn(() => true),
}));

import { POST as bookingAvailabilityPost } from "@/app/api/booking/availability/route";
import { POST as magicLinkPost } from "@/app/api/auth/magic-link/route";
import { POST as contactPost } from "@/app/api/contact/submissions/route";
import { POST as reviewPost } from "@/app/api/reviews/submissions/route";
import { GET as reviewsGet } from "@/app/api/reviews/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { __resetIssue26InMemoryState } from "@/lib/api/issue26";

describe("Issue #26 API contracts", () => {
  beforeEach(() => {
    settingsStore.clear();
    suiteCount = 3;
    bookingCount = 0;
    signInMock.mockReset();
    __resetIssue26InMemoryState();
    process.env.RESEND_API_KEY = "test";
    process.env.EMAIL_FROM = "noreply@example.com";
  });

  it("blocks invalid booking date range", async () => {
    const request = new Request("http://localhost:3000/api/booking/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn: "2026-03-10", checkOut: "2026-03-09", serviceType: "boarding", partySize: 1 }),
    });

    const response = await bookingAvailabilityPost(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errorCode).toBe("INVALID_DATE_RANGE");
  });

  it("returns invalid email contract", async () => {
    const request = new Request("http://localhost:3000/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad-email", intent: "sign_in" }),
    });

    const response = await magicLinkPost(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.errorCode).toBe("INVALID_EMAIL");
  });

  it("supports contact idempotency", async () => {
    const payload = {
      fullName: "Taylor Example",
      email: "taylor@example.com",
      message: "Need boarding availability for next month and pricing details.",
      antiAbuseToken: "captcha-token",
      idempotencyKey: "contact-idem-001",
    };

    const requestA = new Request("http://localhost:3000/api/contact/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify(payload),
    });

    const requestB = new Request("http://localhost:3000/api/contact/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify(payload),
    });

    const responseA = await contactPost(requestA as NextRequest);
    const dataA = await responseA.json();
    const responseB = await contactPost(requestB as NextRequest);
    const dataB = await responseB.json();

    expect(responseA.status).toBe(201);
    expect(responseB.status).toBe(201);
    expect(dataA.submissionId).toBe(dataB.submissionId);
  });

  it("enforces approved-only reviews filter", async () => {
    const submitRequest = new Request("http://localhost:3000/api/reviews/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Guest One",
        rating: 5,
        title: "Excellent stay",
        body: "Our dog had excellent care and we received regular updates during the stay.",
        idempotencyKey: "review-idem-001",
      }),
    });

    const submitResponse = await reviewPost(submitRequest as NextRequest);
    expect(submitResponse.status).toBe(201);

    const createdKey = [...settingsStore.keys()].find((key) => key.startsWith("review:submission:"));
    if (!createdKey) throw new Error("Expected review record");

    const current = JSON.parse(settingsStore.get(createdKey) || "{}");
    settingsStore.set(createdKey, JSON.stringify({ ...current, moderationStatus: "approved" }));

    const listResponse = await reviewsGet();
    const listData = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listData.reviews).toHaveLength(1);
    expect(listData.reviews[0].moderationStatus).toBe("approved");
  });

  it("returns robots and sitemap contracts", () => {
    const robotsConfig = robots();
    const sitemapConfig = sitemap();

    expect(robotsConfig.sitemap).toBe("https://zaines.vercel.app/sitemap.xml");
    expect(Array.isArray(sitemapConfig)).toBe(true);
  });
});