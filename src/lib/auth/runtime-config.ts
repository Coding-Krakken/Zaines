import {
  getAuthSessionStrategy,
  type AuthSessionStrategy,
  isAuthFeatureEnabled,
} from "@/lib/auth/feature-flags";

export type AuthRuntimeConfig = {
  hasDatabase: boolean;
  enablePasswordLogin: boolean;
  enableGuestFlow: boolean;
  sessionStrategy: AuthSessionStrategy;
  useDatabaseSessions: boolean;
};

export function getAuthRuntimeConfig(hasDatabase: boolean): AuthRuntimeConfig {
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
    enablePasswordLogin,
    enableGuestFlow,
    sessionStrategy,
    useDatabaseSessions: sessionStrategy === "database",
  };
}
