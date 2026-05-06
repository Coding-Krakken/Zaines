/**
 * Regression tests for Issue #84 — Google Sign-In PKCE verifier failure.
 *
 * Root cause: NextAuth v5 requires `trustHost: true` in serverless environments
 * and explicit PKCE cookie configuration so the code verifier cookie survives
 * the OAuth redirect round-trip (AWS Lambda / Vercel).
 *
 * Error that prompted this:
 *   InvalidCheck: pkceCodeVerifier value could not be parsed.
 *   https://errors.authjs.dev#invalidcheck
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── module mocks — must be hoisted before any import of auth.ts ──────────────

const { mockNextAuth } = vi.hoisted(() => ({
  mockNextAuth: vi.fn((config: unknown) => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    // Expose the raw config so tests can inspect it.
    __config: config,
  })),
}));

vi.mock("next-auth", () => ({ default: mockNextAuth }));
vi.mock("next-auth/providers/resend", () => ({ default: vi.fn(() => ({})) }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn(() => ({})) }));
vi.mock("next-auth/providers/facebook", () => ({ default: vi.fn(() => ({})) }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn(() => ({})) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

// ── import after mocks ────────────────────────────────────────────────────────

import { authConfig } from "../lib/auth";

// ── suite ────────────────────────────────────────────────────────────────────

describe("authConfig — PKCE regression (Issue #84)", () => {
  let originalAuthSecret: string | undefined;
  let originalNextAuthSecret: string | undefined;

  beforeEach(() => {
    originalAuthSecret = process.env.AUTH_SECRET;
    originalNextAuthSecret = process.env.NEXTAUTH_SECRET;
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }
    if (originalNextAuthSecret === undefined) {
      delete process.env.NEXTAUTH_SECRET;
    } else {
      process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
    }
  });

  // ── trustHost ─────────────────────────────────────────────────────────────

  it("has trustHost set to true (required for Vercel/Lambda PKCE flow)", () => {
    expect(authConfig.trustHost).toBe(true);
  });

  // ── PKCE cookie structure ─────────────────────────────────────────────────

  it("defines a pkceCodeVerifier cookie configuration", () => {
    expect(authConfig.cookies?.pkceCodeVerifier).toBeDefined();
  });

  it("PKCE cookie name contains 'pkce.code_verifier'", () => {
    const name = authConfig.cookies?.pkceCodeVerifier?.name as string;
    expect(name).toContain("pkce.code_verifier");
  });

  it("PKCE cookie is httpOnly", () => {
    const opts = authConfig.cookies?.pkceCodeVerifier?.options as {
      httpOnly: boolean;
    };
    expect(opts.httpOnly).toBe(true);
  });

  it("PKCE cookie sameSite is 'lax' (required for OAuth redirect flow)", () => {
    const opts = authConfig.cookies?.pkceCodeVerifier?.options as {
      sameSite: string;
    };
    expect(opts.sameSite).toBe("lax");
  });

  it("PKCE cookie path is '/'", () => {
    const opts = authConfig.cookies?.pkceCodeVerifier?.options as {
      path: string;
    };
    expect(opts.path).toBe("/");
  });

  it("PKCE cookie maxAge is at least 5 minutes to survive the OAuth redirect", () => {
    const opts = authConfig.cookies?.pkceCodeVerifier?.options as {
      maxAge: number;
    };
    expect(opts.maxAge).toBeGreaterThanOrEqual(60 * 5);
  });

  // ── session strategy ──────────────────────────────────────────────────────

  it("uses database session strategy (required with Prisma adapter)", () => {
    expect(authConfig.session?.strategy).toBe("database");
  });

  // ── error pages ───────────────────────────────────────────────────────────

  it("routes auth errors to /auth/error page", () => {
    expect(authConfig.pages?.error).toBe("/auth/error");
  });
});
