"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createIdempotencyKey } from "@/lib/idempotency";

const contactSubmissionSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.email("Enter a valid email address."),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters.").max(5000),
});

type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

type ContactSubmissionState = "draft" | "submitting" | "submitted" | "submit_failed_retryable" | "throttled";

type ContactErrorCode = "CONTACT_VALIDATION_FAILED" | "CONTACT_RATE_LIMITED" | "CONTACT_PERSISTENCE_FAILED";

type ContactErrorResponse = {
  errorCode?: ContactErrorCode;
  message?: string;
  retryable?: boolean;
  correlationId?: string;
};

type ContactSuccessResponse = {
  submissionId?: string;
  status?: "received";
};

export function ContactSubmissionForm() {
  const antiAbuseToken = useMemo(() => "contact-form-web", []);
  const [submissionState, setSubmissionState] = useState<ContactSubmissionState>("draft");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  const form = useForm<ContactSubmissionInput>({
    resolver: zodResolver(contactSubmissionSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactSubmissionInput) => {
    setSubmissionState("submitting");
    setCorrelationId(null);
    form.clearErrors("root");

    try {
      const response = await fetch("/api/contact/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          antiAbuseToken,
          idempotencyKey: createIdempotencyKey("contact"),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as ContactSuccessResponse & ContactErrorResponse;

      if (response.status === 201 && body.submissionId) {
        setSubmissionState("submitted");
        setSubmissionId(body.submissionId);
        form.reset();
        return;
      }

      setCorrelationId(body.correlationId ?? null);

      if (body.errorCode === "CONTACT_RATE_LIMITED" || response.status === 429) {
        setSubmissionState("throttled");
        form.setError("root", {
          message: body.message || "Too many attempts. Please wait and try again.",
        });
        return;
      }

      if (body.errorCode === "CONTACT_VALIDATION_FAILED" || response.status === 422) {
        setSubmissionState("draft");
        form.setError("root", {
          message: body.message || "Please review your details and try again.",
        });
        return;
      }

      setSubmissionState("submit_failed_retryable");
      form.setError("root", {
        message: body.message || "We couldn't submit your message right now. Please retry.",
      });
    } catch {
      setSubmissionState("submit_failed_retryable");
      form.setError("root", {
        message: "We couldn't submit your message right now. Please retry.",
      });
    }
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Us a Message</CardTitle>
        <CardDescription>
          Fill out the form below and we&apos;ll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissionState === "submitted" ? (
          <div className="space-y-4">
            <Alert className="border-green-500/50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Thanks — your message was received.
                {submissionId ? <span className="block text-xs mt-2">Confirmation ID: {submissionId}</span> : null}
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => setSubmissionState("draft")}>Send Another Message</Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {rootError && (
              <Alert variant={submissionState === "throttled" ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {rootError}
                  {correlationId ? <span className="block text-xs mt-2">Reference ID: {correlationId}</span> : null}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" {...form.register("fullName")} />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="(315) 657-1332" {...form.register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us how we can help..."
                className="min-h-[150px]"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submissionState === "submitting"}>
              {submissionState === "submitting" ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
