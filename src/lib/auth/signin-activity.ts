import { isSuspiciousLoginAttempt } from "@/lib/auth/security-heuristics";

type SecurityLogLevel = "info" | "warn" | "error";

type ActivityStore = {
  findFirst: (args: {
    where: { userId: string; eventType: string };
    orderBy: { createdAt: "desc" };
    select: {
      ipAddress: true;
      userAgent: true;
    };
  }) => Promise<{ ipAddress: string | null; userAgent: string | null } | null>;
  create: (args: {
    data: {
      userId: string;
      eventType: string;
      provider?: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      isSuspicious: boolean;
    };
  }) => Promise<unknown>;
};

type LogSecurityEvent = (params: {
  route: string;
  event: string;
  correlationId: string;
  level?: SecurityLogLevel;
  context?: Record<string, unknown>;
}) => void;

export async function persistSignInActivity(params: {
  userId: string;
  provider?: string;
  ipAddress: string | null;
  userAgent: string | null;
  activityStore: ActivityStore;
  logEvent: LogSecurityEvent;
}) {
  const previous = await params.activityStore.findFirst({
    where: {
      userId: params.userId,
      eventType: "sign_in",
    },
    orderBy: { createdAt: "desc" },
    select: {
      ipAddress: true,
      userAgent: true,
    },
  });

  const isSuspicious = isSuspiciousLoginAttempt({
    previous,
    current: {
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  await params.activityStore.create({
    data: {
      userId: params.userId,
      eventType: "sign_in",
      provider: params.provider,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      isSuspicious,
    },
  });

  params.logEvent({
    route: "/api/auth/signin",
    event: isSuspicious ? "AUTH_SUSPICIOUS_LOGIN" : "AUTH_LOGIN_SUCCESS",
    correlationId: `signin-${params.userId}`,
    level: isSuspicious ? "warn" : "info",
    context: {
      provider: params.provider || "unknown",
    },
  });

  return { isSuspicious };
}
