"use client";

import { useMemo, useState } from "react";
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
  stepAccountGuestSchema,
  type StepAccountData,
} from "@/lib/validations/booking-wizard";
import { toast } from "sonner";

interface StepAccountProps {
  data: Partial<StepAccountData>;
  onUpdate: (data: Partial<StepAccountData>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
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
  onCancel,
}: StepAccountProps) {
  const { data: session, status } = useSession();
  const [firstName, setFirstName] = useState(data.firstName || "");
  const [lastName, setLastName] = useState(data.lastName || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [email, setEmail] = useState(data.email || session?.user?.email || "");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string>("");
  const [magicLinkCorrelationId, setMagicLinkCorrelationId] = useState<
    string | null
  >(null);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const sessionDefaults = useMemo(() => {
    const fullName = session?.user?.name?.trim() || "";
    const [givenName, ...rest] = fullName ? fullName.split(/\s+/) : [""];

    return {
      email: session?.user?.email || "",
      firstName: givenName || "",
      lastName: rest.join(" ") || givenName || "",
    };
  }, [session?.user?.email, session?.user?.name]);

  const resolvedFirstName = firstName || sessionDefaults.firstName;
  const resolvedLastName = lastName || sessionDefaults.lastName;
  const resolvedEmail = email || sessionDefaults.email;

  const handleSendMagicLink = async () => {
    setMagicLinkError("");
    setMagicLinkCorrelationId(null);

    // Validate email
    const validation = stepAccountSchema.shape.email.safeParse(
      resolvedEmail.trim(),
    );

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
          email: resolvedEmail.trim(),
          intent: "manage_booking",
        }),
      });

      if (response.status === 202) {
        const body = (await response
          .json()
          .catch(() => ({}))) as MagicLinkSuccessResponse;
        setMagicLinkSent(true);
        onUpdate({
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          email: resolvedEmail.trim(),
          phone,
        });
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
    const accountData = {
      firstName: resolvedFirstName.trim(),
      lastName: resolvedLastName.trim(),
      email: resolvedEmail.trim(),
      phone: phone.trim(),
    };

    const validation = stepAccountSchema.safeParse(accountData);

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    onUpdate(accountData);

    if (!isAuthenticated) {
      toast.success(
        "Proceeding as guest. You can sign in later to manage your booking.",
      );
    }

    onNext();
  };

  const handleContinueAsGuest = () => {
    const guestData = {
      email: resolvedEmail.trim(),
    };

    const validation = stepAccountGuestSchema.safeParse(guestData);

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    // Use available data, providing defaults for optional fields
    const accountData = {
      firstName: resolvedFirstName || "Guest",
      lastName: resolvedLastName || "User",
      email: resolvedEmail.trim(),
      phone: phone.trim() || "0000000000",
    };

    onUpdate(accountData);
    onNext();
  };

  if (isLoading) {
    return (
      <Card className="border-border/70 bg-background">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-background">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={resolvedFirstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="focus-ring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={resolvedLastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="focus-ring"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="3155551234"
              required
              className="focus-ring"
            />
          </div>
        </div>

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
                  value={resolvedEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMagicLink();
                    }
                  }}
                  required
                  className="focus-ring"
                />
              </div>

              {magicLinkSent ? (
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-2">
                      <p className="font-semibold">
                        Magic link sent to {resolvedEmail}
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
                    disabled={!resolvedEmail || isSendingMagicLink}
                    className="focus-ring w-full"
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
                  disabled={!resolvedEmail}
                  variant="secondary"
                  className="focus-ring w-full"
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
          <div className="flex gap-2">
            <Button variant="outline" className="focus-ring" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {onCancel && (
              <Button variant="destructive" className="focus-ring" onClick={onCancel}>
                Cancel Booking
              </Button>
            )}
          </div>
          <Button
            className="focus-ring"
            onClick={handleNext}
            disabled={
              !resolvedEmail || !resolvedFirstName || !resolvedLastName || !phone
            }
          >
            Continue to Pet Profiles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
