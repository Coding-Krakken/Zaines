import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getCorrelationId } from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

const MANAGED_OAUTH_PROVIDERS = new Set(["google", "facebook"]);

type DeleteBody = {
  provider?: string;
};

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [accounts, hasPasswordCredential] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, type: true },
    }),
    (
      prisma as unknown as {
        passwordCredential?: {
          findUnique: (args: { where: { userId: string }; select: { userId: true } }) => Promise<{ userId: string } | null>;
        };
      }
    ).passwordCredential?.findUnique({
      where: { userId: session.user.id },
      select: { userId: true },
    }) ?? Promise.resolve(null),
  ]);

  const providers = [...new Set(accounts.map((entry) => entry.provider))].sort();

  return NextResponse.json({
    providers,
    canLink: [...MANAGED_OAUTH_PROVIDERS],
    hasPasswordCredential: Boolean(hasPasswordCredential),
  });
}

export async function DELETE(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  logSecurityEvent({
    route: "/api/auth/linked-providers",
    event: "AUTH_PROVIDER_UNLINK_ATTEMPT",
    correlationId,
  });

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const provider = body.provider?.trim().toLowerCase();

  if (!provider || !MANAGED_OAUTH_PROVIDERS.has(provider)) {
    logSecurityEvent({
      route: "/api/auth/linked-providers",
      event: "AUTH_PROVIDER_UNLINK_INVALID_PROVIDER",
      correlationId,
      level: "warn",
    });
    return NextResponse.json({ error: "Unsupported provider" }, { status: 422 });
  }

  const [accounts, hasPasswordCredential] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
    (
      prisma as unknown as {
        passwordCredential?: {
          findUnique: (args: { where: { userId: string }; select: { userId: true } }) => Promise<{ userId: string } | null>;
        };
      }
    ).passwordCredential?.findUnique({
      where: { userId: session.user.id },
      select: { userId: true },
    }) ?? Promise.resolve(null),
  ]);

  const linkedProviders = [...new Set(accounts.map((entry) => entry.provider))];

  if (!linkedProviders.includes(provider)) {
    logSecurityEvent({
      route: "/api/auth/linked-providers",
      event: "AUTH_PROVIDER_UNLINK_NOT_FOUND",
      correlationId,
      level: "warn",
    });
    return NextResponse.json({ error: "Provider not linked" }, { status: 404 });
  }

  const loginMethodCount = linkedProviders.length + (hasPasswordCredential ? 1 : 0);
  if (loginMethodCount <= 1) {
    logSecurityEvent({
      route: "/api/auth/linked-providers",
      event: "AUTH_PROVIDER_UNLINK_BLOCKED_LAST_METHOD",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      { error: "At least one sign-in method must remain linked." },
      { status: 409 },
    );
  }

  await prisma.account.deleteMany({
    where: {
      userId: session.user.id,
      provider,
    },
  });

  logSecurityEvent({
    route: "/api/auth/linked-providers",
    event: "AUTH_PROVIDER_UNLINKED",
    correlationId,
    context: { provider },
  });

  return NextResponse.json({ state: "unlinked", provider });
}
