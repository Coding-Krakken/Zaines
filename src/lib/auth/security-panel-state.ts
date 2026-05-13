export type SessionEntry = {
  id: string;
  expiresAt: string;
  current: boolean;
  deviceHint: string | null;
};

export type ActivityEntry = {
  id: string;
  eventType: string;
  provider: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isSuspicious: boolean;
  createdAt: string;
};

export type SecurityPayload = {
  strategy: "database" | "jwt";
  sessions: SessionEntry[];
  activity: ActivityEntry[];
};

export function hasSuspiciousActivity(activity: ActivityEntry[]): boolean {
  return activity.some((entry) => entry.isSuspicious);
}

export function canRevokeSession(params: {
  strategy: SecurityPayload["strategy"];
  session: SessionEntry;
  busySessionId: string | null;
}): boolean {
  if (params.strategy !== "database") return false;
  if (params.session.current) return false;
  if (params.busySessionId === params.session.id) return false;
  return true;
}

export function normalizeSecurityPayload(
  payload: SecurityPayload | null,
): {
  sessions: SessionEntry[];
  activity: ActivityEntry[];
  strategy: SecurityPayload["strategy"] | null;
  hasSuspicious: boolean;
} {
  const sessions = payload?.sessions || [];
  const activity = payload?.activity || [];

  return {
    sessions,
    activity,
    strategy: payload?.strategy || null,
    hasSuspicious: hasSuspiciousActivity(activity),
  };
}
