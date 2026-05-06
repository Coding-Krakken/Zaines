"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCheckIn() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Check-in failed");
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/admin"), 2000);
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Check-In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Booking ID: <span className="font-mono text-foreground">{id}</span>
          </p>

          {status === "success" && (
            <div className="rounded-md bg-green-50 p-4 text-green-800 text-sm">
              ✅ Guest successfully checked in.{" "}
              <Link href="/admin" className="font-medium underline">
                Back to dashboard
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md bg-red-50 p-4 text-red-800 text-sm">
              ❌ {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCheckIn}
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? "Checking in…" : "Confirm Check-In"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
