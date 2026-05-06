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

const providers: NonNullable<NextAuthConfig["providers"]> = [
  ...(hasDatabase
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
];

export const authConfig: NextAuthConfig = {
  ...(hasDatabase ? { adapter: PrismaAdapter(prisma) } : {}),

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
    strategy: hasDatabase ? "database" : "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
