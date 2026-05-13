import { NextResponse } from "next/server";
import { getAuthProviderCapabilities } from "@/lib/auth/provider-capabilities";
import { getAuthRuntimeConfig } from "@/lib/auth/runtime-config";
import { isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  const hasDatabase = isDatabaseConfigured();
  const authRuntime = getAuthRuntimeConfig(hasDatabase);

  const capabilities = getAuthProviderCapabilities({
    hasDatabase,
    enablePasswordLogin: authRuntime.enablePasswordLogin,
    enableGuestFlow: authRuntime.enableGuestFlow,
  });

  const enabledProviderIds = new Set(
    capabilities.filter((capability) => capability.enabled).map((capability) => capability.id),
  );
  const hasEnabledAuthProvider =
    enabledProviderIds.has("credentials") ||
    enabledProviderIds.has("resend") ||
    enabledProviderIds.has("google") ||
    enabledProviderIds.has("facebook");

  const authIssues: string[] = [];
  if (!authRuntime.hasAuthSecret) {
    authIssues.push("missing_auth_secret");
  }
  if (!hasEnabledAuthProvider) {
    authIssues.push("no_auth_provider_enabled");
  }

  return NextResponse.json({
    capabilities,
    authOperational: authIssues.length === 0,
    authIssues,
    generatedAt: new Date().toISOString(),
  });
}
