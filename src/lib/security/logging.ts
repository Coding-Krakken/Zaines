type LogLevel = "info" | "warn" | "error";

type SecurityLogPayload = {
  route: string;
  event: string;
  correlationId: string;
  level?: LogLevel;
  error?: unknown;
  context?: Record<string, unknown>;
};

const SENSITIVE_KEY_PATTERN =
  /(address|authorization|card|clientSecret|content|cookie|email|message|name|password|phone|secret|signature|token)/i;

function safeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { errorType: value.name };
  }

  if (Array.isArray(value)) {
    return value.map(safeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : safeValue(child),
      ]),
    );
  }

  if (typeof value === "string") {
    if (
      /@/.test(value) ||
      /\b\d{3}[-. )]?\d{3}[-. ]?\d{4}\b/.test(value) ||
      /(secret|token|signature|password|client_secret)/i.test(value)
    ) {
      return "[REDACTED]";
    }
  }

  return value;
}

export function createSecurityLogPayload(params: SecurityLogPayload) {
  return {
    route: params.route,
    event: params.event,
    correlationId: params.correlationId,
    errorType:
      params.error instanceof Error
        ? params.error.name
        : params.error === undefined
          ? undefined
          : "unknown_error",
    ...(params.context ? { context: safeValue(params.context) } : {}),
  };
}

export function logSecurityEvent(params: SecurityLogPayload): void {
  const level = params.level ?? "info";
  const payload = JSON.stringify(createSecurityLogPayload(params));

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}
