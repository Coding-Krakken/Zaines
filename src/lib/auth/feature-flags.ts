export function isAuthFeatureEnabled(
  value: string | undefined,
  defaultValue = true,
): boolean {
  if (value === undefined) return defaultValue;
  return value.trim().toLowerCase() !== "false";
}

export type AuthSessionStrategy = "database" | "jwt";

export function getAuthSessionStrategy(params: {
  hasDatabase: boolean;
  databaseSessionsFlag: string | undefined;
}): AuthSessionStrategy {
  const databaseSessionsEnabled =
    params.databaseSessionsFlag?.trim().toLowerCase() === "true";

  if (params.hasDatabase && databaseSessionsEnabled) {
    return "database";
  }

  return "jwt";
}
