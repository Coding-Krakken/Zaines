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

  return NextResponse.json({
    capabilities,
    generatedAt: new Date().toISOString(),
  });
}
