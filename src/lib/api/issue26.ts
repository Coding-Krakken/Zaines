import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

type Issue26SettingsStore = {
  findUnique: (args: { where: { key: string } }) => Promise<{ value: string } | null>;
  create: (args: { data: { key: string; value: string } }) => Promise<unknown>;
  upsert: (args: {
    where: { key: string };
    create: { key: string; value: string };
    update: Record<string, unknown>;
  }) => Promise<unknown>;
  findMany: (args: {
    where: { key: { startsWith: string } };
    orderBy: { updatedAt: "desc" | "asc" };
  }) => Promise<Array<{ value: string }>>;
};

const prismaSettings = (prisma as { settings: Issue26SettingsStore }).settings;

const contactRateLimitBucket = new Map<string, number[]>();

export const availabilityRequestSchema = z.object({
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  serviceType: z.enum(["boarding"]),
  partySize: z.number().int().min(1).max(2),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().email(),
  intent: z.enum(["sign_in", "manage_booking"]),
});

export const contactSubmissionSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  message: z.string().min(10).max(5000),
  antiAbuseToken: z.string().min(1),
  idempotencyKey: z.string().min(8).max(128),
});

export const reviewSubmissionSchema = z.object({
  displayName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  body: z.string().min(20).max(3000),
  stayMonth: z.string().max(32).optional(),
  idempotencyKey: z.string().min(8).max(128),
});

export function getCorrelationId(request: Request): string {
  return request.headers.get("x-correlation-id") || randomUUID();
}

export function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function logServerFailure(route: string, errorCode: string, correlationId: string, error: unknown): void {
  const errorType = error instanceof Error ? error.name : "unknown_error";
  console.error(
    JSON.stringify({
      route,
      errorCode,
      correlationId,
      errorType,
    })
  );
}

export function shouldThrottle(request: Request, routeKey: string, limit = 5, windowMs = 60_000): boolean {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const key = `${routeKey}:${ip.split(",")[0].trim()}`;
  const now = Date.now();
  const current = contactRateLimitBucket.get(key) || [];
  const withinWindow = current.filter((timestamp) => now - timestamp < windowMs);

  if (withinWindow.length >= limit) {
    contactRateLimitBucket.set(key, withinWindow);
    return true;
  }

  withinWindow.push(now);
  contactRateLimitBucket.set(key, withinWindow);
  return false;
}

async function ensureDatabaseReady(): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new Error("PERSISTENCE_UNAVAILABLE");
  }
}

type ContactPayload = z.infer<typeof contactSubmissionSchema>;
type ReviewPayload = z.infer<typeof reviewSubmissionSchema>;

export async function persistContactSubmission(payload: ContactPayload): Promise<{ submissionId: string }> {
  await ensureDatabaseReady();

  const idempotencyLookupKey = `contact:idempotency:${payload.idempotencyKey}`;
  const existingIdempotency = await prismaSettings.findUnique({ where: { key: idempotencyLookupKey } });

  if (existingIdempotency) {
    const parsed = safeParseStoredValue(existingIdempotency.value);
    if (typeof parsed.submissionId === "string") {
      return { submissionId: parsed.submissionId };
    }
  }

  const submissionId = randomUUID();
  const submissionRecordKey = `contact:submission:${submissionId}`;

  await prismaSettings.create({
    data: {
      key: submissionRecordKey,
      value: JSON.stringify({
        submissionId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone || null,
        message: payload.message,
        createdAt: new Date().toISOString(),
      }),
    },
  });

  await prismaSettings.upsert({
    where: { key: idempotencyLookupKey },
    create: {
      key: idempotencyLookupKey,
      value: JSON.stringify({ submissionId }),
    },
    update: {},
  });

  return { submissionId };
}

export async function persistReviewSubmission(payload: ReviewPayload): Promise<{ reviewId: string }> {
  await ensureDatabaseReady();

  const idempotencyLookupKey = `review:idempotency:${payload.idempotencyKey}`;
  const existingIdempotency = await prismaSettings.findUnique({ where: { key: idempotencyLookupKey } });

  if (existingIdempotency) {
    const parsed = safeParseStoredValue(existingIdempotency.value);
    if (typeof parsed.reviewId === "string") {
      return { reviewId: parsed.reviewId };
    }
  }

  const reviewId = randomUUID();
  const reviewRecordKey = `review:submission:${reviewId}`;

  await prismaSettings.create({
    data: {
      key: reviewRecordKey,
      value: JSON.stringify({
        reviewId,
        displayName: payload.displayName,
        rating: payload.rating,
        title: payload.title,
        body: payload.body,
        stayMonth: payload.stayMonth || null,
        moderationStatus: "pending",
        createdAt: new Date().toISOString(),
      }),
    },
  });

  await prismaSettings.upsert({
    where: { key: idempotencyLookupKey },
    create: {
      key: idempotencyLookupKey,
      value: JSON.stringify({ reviewId }),
    },
    update: {},
  });

  return { reviewId };
}

type PublicReview = {
  reviewId: string;
  displayName: string;
  rating: number;
  title: string;
  body: string;
  stayMonth?: string | null;
  moderationStatus: string;
  createdAt: string;
};

export async function getApprovedPublicReviews(): Promise<PublicReview[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const reviewRecords = await prismaSettings.findMany({
    where: {
      key: {
        startsWith: "review:submission:",
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return reviewRecords
    .map((record: { value: string }) => safeParseStoredValue(record.value))
    .filter((review: Record<string, unknown>): review is PublicReview => {
      return (
        typeof review.reviewId === "string" &&
        typeof review.displayName === "string" &&
        typeof review.rating === "number" &&
        typeof review.title === "string" &&
        typeof review.body === "string" &&
        typeof review.moderationStatus === "string" &&
        review.moderationStatus === "approved" &&
        typeof review.createdAt === "string"
      );
    });
}

function safeParseStoredValue(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function __resetIssue26InMemoryState(): void {
  contactRateLimitBucket.clear();
}
