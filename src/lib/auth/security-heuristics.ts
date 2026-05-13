type LoginFingerprint = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type HeaderReader = {
  get: (name: string) => string | null;
};

const PRIVATE_IP_PREFIXES = ["10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."];

export function normalizeClientIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  if (!first) return null;
  return first.toLowerCase();
}

export function extractRequestFingerprint(headers: HeaderReader): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const ipAddress = normalizeClientIp(
    headers.get("x-forwarded-for") || headers.get("x-real-ip"),
  );
  const userAgent = headers.get("user-agent") || null;

  return {
    ipAddress,
    userAgent,
  };
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  return PRIVATE_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

function normalizeAgent(agent: string | null | undefined): string | null {
  if (!agent) return null;
  return agent.trim().toLowerCase().slice(0, 200);
}

export function isSuspiciousLoginAttempt(params: {
  current: LoginFingerprint;
  previous: LoginFingerprint | null;
}): boolean {
  if (!params.previous) {
    return false;
  }

  const currentIp = normalizeClientIp(params.current.ipAddress);
  const previousIp = normalizeClientIp(params.previous.ipAddress);
  const currentAgent = normalizeAgent(params.current.userAgent);
  const previousAgent = normalizeAgent(params.previous.userAgent);

  if (!currentIp || !previousIp || !currentAgent || !previousAgent) {
    return false;
  }

  if (currentIp === previousIp && currentAgent === previousAgent) {
    return false;
  }

  const ipChanged = currentIp !== previousIp;
  const agentChanged = currentAgent !== previousAgent;

  // Alert only when both network and device signatures change simultaneously,
  // and neither endpoint appears to be a local/private network.
  if (ipChanged && agentChanged && !isPrivateIp(currentIp) && !isPrivateIp(previousIp)) {
    return true;
  }

  return false;
}
