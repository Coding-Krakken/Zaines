import {
  getAuthSessionStrategy,
  type AuthSessionStrategy,
  isAuthFeatureEnabled,
} from "@/lib/auth/feature-flags";

export type AuthRuntimeConfig = {
  hasDatabase: boolean;
  hasAuthSecret: boolean;
  enablePasswordLogin: boolean;
  enableGuestFlow: boolean;
  sessionStrategy: AuthSessionStrategy;
  useDatabaseSessions: boolean;
};

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function getAuthRuntimeConfig(hasDatabase: boolean): AuthRuntimeConfig {
  const hasAuthSecret = hasValue(process.env.AUTH_SECRET) || hasValue(process.env.NEXTAUTH_SECRET);
  const enablePasswordLogin = isAuthFeatureEnabled(
    process.env.AUTH_ENABLE_PASSWORD_LOGIN,
    true,
  );
  const enableGuestFlow = isAuthFeatureEnabled(process.env.AUTH_ENABLE_GUEST_FLOW, true);
  const sessionStrategy = getAuthSessionStrategy({
    hasDatabase,
    databaseSessionsFlag: process.env.AUTH_ENABLE_DATABASE_SESSIONS,
  });

  return {
    hasDatabase,
    hasAuthSecret,
    enablePasswordLogin,
    enableGuestFlow,
    sessionStrategy,
    useDatabaseSessions: sessionStrategy === "database",
  };
}
