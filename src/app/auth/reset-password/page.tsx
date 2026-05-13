"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasTokenContext = useMemo(() => token.trim().length > 0, [token]);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const payload = (await response.json()) as {
        message?: string;
        resetUrl?: string;
      };

      if (!response.ok) {
        setError(payload.message || "Unable to process your request.");
        return;
      }

      setMessage(
        payload.resetUrl
          ? `${payload.message} (Dev reset link: ${payload.resetUrl})`
          : payload.message || "If the account exists, reset instructions have been sent.",
      );
    } catch {
      setError("Unable to process your request right now. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(payload.message || "Unable to reset password.");
        return;
      }

      setMessage(payload.message || "Password reset complete.");
      setPassword("");
    } catch {
      setError("Unable to reset password right now. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <Card className="mx-auto max-w-lg border-stone-200 bg-white">
        <CardHeader>
          <CardTitle>{hasTokenContext ? "Set a New Password" : "Reset Password"}</CardTitle>
          <CardDescription>
            {hasTokenContext
              ? "Create a new secure password for your account."
              : "Enter your account email and we will send reset instructions."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {message ? (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <form className="space-y-4" onSubmit={hasTokenContext ? submitNewPassword : requestReset}>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />
            </div>

            {hasTokenContext ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="token">Reset Token</Label>
                  <Input
                    id="token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    disabled={busy}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={busy}
                    required
                  />
                </div>
              </>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Working..."
                : hasTokenContext
                  ? "Update Password"
                  : "Send Reset Instructions"}
            </Button>
          </form>

          <div className="text-center text-sm text-stone-600">
            <Link href="/auth/signin" className="text-amber-700 hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-600">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
