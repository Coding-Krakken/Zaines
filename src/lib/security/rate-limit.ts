type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds?: number;
};

const buckets = new Map<string, number[]>();

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  return candidate.toLowerCase();
}

export function checkRateLimit(params: {
  request: Request;
  routeKey: string;
  limit: number;
  windowMs: number;
  subject?: string | null;
}): RateLimitResult {
  const subject = params.subject ? `:${params.subject.toLowerCase()}` : "";
  const key = `${params.routeKey}:${getClientKey(params.request)}${subject}`;
  const now = Date.now();
  const hits = buckets
    .get(key)
    ?.filter((timestamp) => now - timestamp < params.windowMs) ?? [];

  if (hits.length >= params.limit) {
    buckets.set(key, hits);
    const oldest = Math.min(...hits);
    return {
      limited: true,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((params.windowMs - (now - oldest)) / 1000),
      ),
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { limited: false };
}

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
