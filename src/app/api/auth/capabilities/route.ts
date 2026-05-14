import { NextResponse } from "next/server";
import { getAuthProviderCapabilities } from "@/lib/auth/provider-capabilities";
import { getOauthProviderDebugInfo } from "@/lib/auth/oauth-env";
import { getAuthRuntimeConfig } from "@/lib/auth/runtime-config";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

async function isCredentialStoreOperational(hasDatabase: boolean): Promise<boolean> {
  if (!hasDatabase) return false;

  const credentialStore = (
    prisma as unknown as {
      passwordCredential?: {
        findFirst: (args: { select: { id: boolean } }) => Promise<{ id: string } | null>;
      };
    }
  ).passwordCredential;

  if (!credentialStore) {
    return false;
  }

  try {
    await credentialStore.findFirst({ select: { id: true } });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const hasDatabase = isDatabaseConfigured();
  const authRuntime = getAuthRuntimeConfig(hasDatabase);
  const credentialStoreOperational = await isCredentialStoreOperational(hasDatabase);

  const capabilities = getAuthProviderCapabilities({
    hasDatabase,
    enablePasswordLogin: authRuntime.enablePasswordLogin,
    enableGuestFlow: authRuntime.enableGuestFlow,
  }).map((capability) => {
    if (capability.id !== "credentials") {
      return capability;
    }

    if (!credentialStoreOperational) {
      return {
        ...capability,
        enabled: false,
        reasonDisabled: "credential_store_unavailable",
      };
    }

    return capability;
  });

  const enabledProviderIds = new Set(
    capabilities.filter((capability) => capability.enabled).map((capability) => capability.id),
  );
  const hasEnabledAuthProvider =
    enabledProviderIds.has("credentials") ||
    enabledProviderIds.has("google") ||
    enabledProviderIds.has("facebook");

  const authIssues: string[] = [];
  if (!authRuntime.hasAuthSecret) {
    authIssues.push("missing_auth_secret");
  }
  if (!hasEnabledAuthProvider) {
    authIssues.push("no_auth_provider_enabled");
  }

  const oauthDebug = {
    google: getOauthProviderDebugInfo("google"),
    facebook: getOauthProviderDebugInfo("facebook"),
  };

  return NextResponse.json({
    capabilities,
    authOperational: authIssues.length === 0,
    authIssues,
    oauthDebug,
    generatedAt: new Date().toISOString(),
  });
}
