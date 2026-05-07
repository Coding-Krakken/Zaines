import NextAuth, { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { prisma } from "./prisma";
import { isDatabaseConfigured } from "./prisma";

// NextAuth v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for deployments
// that have not yet migrated their environment variables.
const authSecret =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const isProduction = process.env.NODE_ENV === "production";
const hasDatabase = isDatabaseConfigured();
const hasResendProviderConfig =
  Boolean(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY) &&
  Boolean(process.env.EMAIL_FROM);
const useDatabaseSessions =
  process.env.AUTH_ENABLE_DATABASE_SESSIONS === "true" && hasDatabase;

const providers: NonNullable<NextAuthConfig["providers"]> = [
  ...(useDatabaseSessions && hasResendProviderConfig
    ? [
        Resend({
          from: process.env.EMAIL_FROM || "noreply@pawfectstays.com",
        }),
      ]
    : []),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
  ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
    ? [
        Facebook({
          clientId: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }),
      ]
    : []),
  // FIXED (Issue #101): Facebook provider is only included if BOTH environment variables
  // are set AND contain valid (non-placeholder) values. If Facebook provider is not included,
  // the signin page will automatically hide the Facebook button.
  // 
  // IMPLEMENTATION DETAILS:
  // - Provider is conditionally included only when FACEBOOK_CLIENT_ID is set and is NOT a placeholder
  // - If either env var is missing or contains placeholder value ("your_facebook_app_id_here"), 
  //   the Facebook provider is not added to the providers array
  // - This means the signin page won't show the Facebook button for incomplete configurations
  // - NextAuth automatically hides unavailable providers from signin UI
  // - This approach is safer than runtime checks and fails-fast during app initialization
  // 
  // TO ENABLE FACEBOOK OAUTH:
  // 1. Create a Facebook App at https://developers.facebook.com/apps/
  // 2. Copy Client ID and Client Secret
  // 3. Set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET in your environment variables
  // 4. VERIFY values are NOT placeholder strings like "your_facebook_app_id_here"
  // 5. Deploy to staging first to test the signin flow
  // 6. Do NOT deploy to production with unset or placeholder Facebook credentials
  // 
  // TROUBLESHOOTING:
  // - Facebook button not appearing? Check if FACEBOOK_CLIENT_ID is set in environment
  // - OAuth flow failing? Verify Facebook app is properly configured in Facebook Developer Console
  // - Invalid app ID error? Check that FACEBOOK_CLIENT_ID matches your Facebook app ID exactly
];

export const authConfig: NextAuthConfig = {
  ...(useDatabaseSessions ? { adapter: PrismaAdapter(prisma) } : {}),

  // Required for Vercel / AWS Lambda deployments: allows NextAuth to trust
  // the x-forwarded-host header when computing cookie domains during the
  // OAuth PKCE flow. Without this flag the PKCE verifier cookie is set with
  // the wrong domain and cannot be read back on the callback, producing:
  //   InvalidCheck: pkceCodeVerifier value could not be parsed
  trustHost: true,

  // Explicit secret resolves AUTH_SECRET/NEXTAUTH_SECRET naming ambiguity.
  // NextAuth v5 prefers AUTH_SECRET; providing it here makes both work.
  ...(authSecret ? { secret: authSecret } : {}),

  // Explicit PKCE cookie configuration ensures the verifier survives the
  // OAuth redirect across all serverless environments.
  cookies: {
    pkceCodeVerifier: {
      name: isProduction
        ? "__Secure-authjs.pkce.code_verifier"
        : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
        // 15 minutes is sufficient to complete the OAuth redirect flow.
        maxAge: 60 * 15,
      },
    },
  },

  providers,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = (user as any)?.role ?? token.role ?? "customer";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any)?.role ?? "customer";
      }
      return token;
    },
  },
  session: {
    strategy: useDatabaseSessions ? "database" : "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
