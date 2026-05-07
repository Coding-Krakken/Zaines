"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type ContactSubmissionProps = {
  submissionId: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  status: "open" | "resolved";
};

export function ContactSubmissionCard(props: ContactSubmissionProps) {
  const [status, setStatus] = useState<"open" | "resolved">(props.status);
  const [updating, setUpdating] = useState(false);

  const handleMarkResolved = async () => {
    setUpdating(true);
    try {
      const response = await fetch(
        `/api/admin/contact-submissions/${props.submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: status === "open" ? "resolved" : "open",
          }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as { status: "open" | "resolved" };
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to update submission status:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base">{props.fullName}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(props.createdAt).toLocaleString()} • ID: {props.submissionId}
          </p>
        </div>
        <Badge variant={status === "open" ? "default" : "secondary"}>
          {status}
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          <span className="font-medium">Email:</span> {props.email}
        </p>
        <p className="text-sm">
          <span className="font-medium">Phone:</span> {props.phone || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Message</p>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {props.message}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkResolved}
          disabled={updating}
        >
          {updating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Updating…
            </>
          ) : (
            status === "open"
              ? "Mark Resolved"
              : "Mark Open"
          )}
        </Button>
      </div>
    </div>
  );
}
