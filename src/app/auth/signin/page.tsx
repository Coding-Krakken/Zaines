"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type MagicLinkState =
  | "idle"
  | "validating_email"
  | "sending_link"
  | "sent"
  | "invalid_email"
  | "provider_misconfigured"
  | "transient_failure";

type MagicLinkErrorResponse = {
  errorCode?:
    | "INVALID_EMAIL"
    | "AUTH_PROVIDER_MISCONFIGURED"
    | "AUTH_TRANSIENT_FAILURE";
  message?: string;
  retryable?: boolean;
  correlationId?: string;
};

function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkState, setMagicLinkState] = useState<MagicLinkState>("idle");
  const [message, setMessage] = useState("");
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const sendMagicLink = async () => {
    setMessage("");
    setCorrelationId(null);
    setMagicLinkState("validating_email");

    if (!isValidEmail(email.trim())) {
      setMagicLinkState("invalid_email");
      setMessage("Enter a valid email address.");
      return;
    }

    setMagicLinkState("sending_link");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          intent: "sign_in",
        }),
      });

      if (response.status === 202) {
        setMagicLinkState("sent");
        setMessage("Check your inbox for your sign-in link.");
      } else {
        const errorPayload: MagicLinkErrorResponse = await response.json();

        if (errorPayload.errorCode === "INVALID_EMAIL") {
          setMagicLinkState("invalid_email");
          setMessage("Enter a valid email address.");
        } else if (errorPayload.errorCode === "AUTH_PROVIDER_MISCONFIGURED") {
          setMagicLinkState("provider_misconfigured");
          setMessage(
            "Sign-in is temporarily unavailable. Please contact support.",
          );
        } else {
          setMagicLinkState("transient_failure");
          setMessage(
            "We couldn't send your sign-in link right now. Please retry.",
          );
        }

        if (errorPayload.correlationId) {
          setCorrelationId(errorPayload.correlationId);
        }
      }
    } catch {
      setMagicLinkState("transient_failure");
      setMessage("We couldn't send your sign-in link right now. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMagicLink();
  };

  const handleOAuthSignIn = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    setMessage("");

    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setMessage(`Failed to sign in with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md text-center">
            <Link
              href="/"
              className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="mb-2 text-3xl font-bold">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Sign in to manage your bookings and pet profiles
            </p>
          </div>
        </div>
      </section>

      {/* Sign In Form */}
      <section className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                We&apos;ll send you a magic link to sign in securely - no
                password needed!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {magicLinkState !== "sent" ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {message && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {message}
                        {correlationId
                          ? ` (Support code: ${correlationId})`
                          : ""}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={isLoading}
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuthSignIn("facebook")}
                      disabled={isLoading}
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Continue with Facebook
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <span className="font-medium text-primary">
                      You&apos;ll create one when you receive the magic link
                    </span>
                  </p>
                </form>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>

                  <div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Check your email!
                    </h3>
                    <p className="text-muted-foreground">
                      We sent a magic link to <strong>{email}</strong>
                    </p>
                  </div>

                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Click the link in the email to sign in. The link expires
                      in 15 minutes.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMagicLinkState("idle");
                        setMessage("");
                        setCorrelationId(null);
                      }}
                    >
                      Use a different email
                    </Button>

                    <Button
                      variant="ghost"
                      type="button"
                      className="w-full"
                      onClick={() => {
                        void sendMagicLink();
                      }}
                      disabled={isLoading}
                    >
                      Resend link
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive it? Check your spam folder or{" "}
                    <Link
                      href="/contact"
                      className="text-primary hover:underline"
                    >
                      contact support
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mx-auto mt-8 max-w-md space-y-4 text-center text-sm text-muted-foreground">
            <p>
              <strong>Why magic links?</strong> They&apos;re more secure than
              passwords and easier to use. No password to remember or type!
            </p>
            <p>
              Need help?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
