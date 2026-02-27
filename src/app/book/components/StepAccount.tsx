"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  stepAccountSchema,
  type StepAccountData,
} from "@/lib/validations/booking-wizard";
import { toast } from "sonner";

interface StepAccountProps {
  data: Partial<StepAccountData>;
  onUpdate: (data: Partial<StepAccountData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type MagicLinkErrorCode =
  | "INVALID_EMAIL"
  | "AUTH_PROVIDER_MISCONFIGURED"
  | "AUTH_TRANSIENT_FAILURE";

type MagicLinkErrorResponse = {
  errorCode?: MagicLinkErrorCode;
  message?: string;
  retryable?: boolean;
  correlationId?: string;
};

type MagicLinkSuccessResponse = {
  state?: "sent";
  message?: string;
};

export function StepAccount({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepAccountProps) {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState(data.email || session?.user?.email || "");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string>("");
  const [magicLinkCorrelationId, setMagicLinkCorrelationId] = useState<
    string | null
  >(null);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const handleSendMagicLink = async () => {
    setMagicLinkError("");
    setMagicLinkCorrelationId(null);

    // Validate email
    const validation = stepAccountSchema.safeParse({ email });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsSendingMagicLink(true);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          intent: "manage_booking",
        }),
      });

      if (response.status === 202) {
        const body = (await response
          .json()
          .catch(() => ({}))) as MagicLinkSuccessResponse;
        setMagicLinkSent(true);
        onUpdate({ email: email.trim() });
        toast.success(
          body.message || "Check your email for your secure sign-in link.",
        );
        return;
      }

      const errorPayload = (await response
        .json()
        .catch(() => ({}))) as MagicLinkErrorResponse;
      setMagicLinkCorrelationId(errorPayload.correlationId ?? null);

      if (
        errorPayload.errorCode === "INVALID_EMAIL" ||
        response.status === 422
      ) {
        setMagicLinkError("Enter a valid email address.");
        toast.error("Enter a valid email address.");
        return;
      }

      if (errorPayload.errorCode === "AUTH_PROVIDER_MISCONFIGURED") {
        setMagicLinkError(
          "Sign-in is temporarily unavailable. Please contact support.",
        );
        toast.error(
          "Sign-in is temporarily unavailable. Please contact support.",
        );
        return;
      }

      setMagicLinkError(
        "We couldn't send your sign-in link right now. Please retry.",
      );
      toast.error(
        "We couldn't send your sign-in link right now. Please retry.",
      );
    } catch {
      setMagicLinkError(
        "We couldn't send your sign-in link right now. Please retry.",
      );
      toast.error(
        "We couldn't send your sign-in link right now. Please retry.",
      );
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleNext = () => {
    if (!isAuthenticated) {
      // For guest checkout - just validate email and proceed
      const validation = stepAccountSchema.safeParse({ email });

      if (!validation.success) {
        toast.error("Please enter a valid email address");
        return;
      }

      onUpdate({ email });
      toast.success(
        "Proceeding as guest. You can sign in later to manage your booking.",
      );
    }

    onNext();
  };

  const handleContinueAsGuest = () => {
    const validation = stepAccountSchema.safeParse({ email });

    if (!validation.success) {
      toast.error("Please enter a valid email address to continue as guest");
      return;
    }

    onUpdate({ email });
    onNext();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account & Contact
        </CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "You&apos;re signed in and ready to book"
            : "Sign in or continue as a guest"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthenticated ? (
          <>
            {/* Authenticated User View */}
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">
                    Signed in as {session.user?.name || "User"}
                  </span>
                  <span className="text-sm">{session.user?.email}</span>
                </div>
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Account Benefits</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>View and manage bookings from your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>Saved pet profiles for faster future bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>Real-time activity updates and photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>Booking history and loyalty rewards</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Not Authenticated View */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMagicLink();
                    }
                  }}
                  required
                />
              </div>

              {magicLinkSent ? (
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-2">
                      <p className="font-semibold">
                        Magic link sent to {email}
                      </p>
                      <p className="text-sm">
                        Check your email and click the link to sign in. You can
                        continue booking while waiting for the email, or sign in
                        to sync your booking.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {magicLinkError ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {magicLinkError}
                        {magicLinkCorrelationId ? (
                          <span className="mt-2 block text-xs">
                            Reference ID: {magicLinkCorrelationId}
                          </span>
                        ) : null}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <Button
                    onClick={handleSendMagicLink}
                    disabled={!email || isSendingMagicLink}
                    className="w-full"
                    variant="outline"
                  >
                    {isSendingMagicLink ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Magic Link...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Magic Link to Sign In
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-4">
                <h3 className="mb-2 font-semibold">Continue as Guest</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  You can complete your booking without signing in. We&apos;ll
                  send confirmation to your email. To access your booking
                  dashboard later, you can create an account anytime.
                </p>
                <Button
                  onClick={handleContinueAsGuest}
                  disabled={!email}
                  variant="secondary"
                  className="w-full"
                >
                  Continue as Guest
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!isAuthenticated && !email}>
            Continue to Pet Profiles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
