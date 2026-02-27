"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, AlertCircle, CheckCircle2 } from "lucide-react";
import { createIdempotencyKey } from "@/lib/idempotency";

const reviewSubmissionSchema = z.object({
  displayName: z.string().min(2, "Please enter your name.").max(80),
  rating: z.number().int().min(1, "Please provide a rating.").max(5),
  title: z.string().min(3, "Please add a title.").max(120),
  body: z.string().min(20, "Please share at least 20 characters.").max(3000),
  stayMonth: z.string().max(20).optional().or(z.literal("")),
});

type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

type ReviewSubmissionState =
  | "draft"
  | "submitting"
  | "moderation_pending"
  | "rejected_validation"
  | "submit_failed_retryable";

type ReviewErrorResponse = {
  errorCode?: "REVIEW_VALIDATION_FAILED" | "REVIEW_PERSISTENCE_FAILED";
  message?: string;
  retryable?: boolean;
  correlationId?: string;
};

type ReviewSuccessResponse = {
  reviewId?: string;
  moderationStatus?: "pending";
  message?: string;
};

export function ReviewSubmissionForm() {
  const [submissionState, setSubmissionState] = useState<ReviewSubmissionState>("draft");
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  const form = useForm<ReviewSubmissionInput>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: {
      displayName: "",
      rating: 5,
      title: "",
      body: "",
      stayMonth: "",
    },
  });

  const onSubmit = async (values: ReviewSubmissionInput) => {
    setSubmissionState("submitting");
    setCorrelationId(null);
    form.clearErrors("root");

    try {
      const response = await fetch("/api/reviews/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          idempotencyKey: createIdempotencyKey("review"),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as ReviewSuccessResponse & ReviewErrorResponse;

      if (response.status === 201 && body.reviewId && body.moderationStatus === "pending") {
        setSubmissionState("moderation_pending");
        setReviewId(body.reviewId);
        form.reset();
        return;
      }

      if (body.errorCode === "REVIEW_VALIDATION_FAILED" || response.status === 422) {
        setSubmissionState("rejected_validation");
        form.setError("root", {
          message: body.message || "Please fix highlighted fields before submitting.",
        });
        return;
      }

      setCorrelationId(body.correlationId ?? null);
      setSubmissionState("submit_failed_retryable");
      form.setError("root", {
        message: body.message || "Review submission failed. Please retry.",
      });
    } catch {
      setSubmissionState("submit_failed_retryable");
      form.setError("root", {
        message: "Review submission failed. Please retry.",
      });
    }
  };

  const rootError = form.formState.errors.root?.message;
  const currentRating = useWatch({ control: form.control, name: "rating" }) ?? 5;

  if (submissionState === "moderation_pending") {
    return (
      <div className="space-y-4">
        <Alert className="border-green-500/50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Thanks! Your review was received and is pending moderation.
            {reviewId ? <span className="block text-xs mt-2">Review ID: {reviewId}</span> : null}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => setSubmissionState("draft")}>Submit Another Review</Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {rootError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {rootError}
            {correlationId ? <span className="block text-xs mt-2">Reference ID: {correlationId}</span> : null}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Your Rating</Label>
        <div className="flex gap-2" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => form.setValue("rating", star, { shouldValidate: true })}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
              aria-label={`Set rating ${star} star${star > 1 ? "s" : ""}`}
              role="radio"
              aria-checked={star === currentRating}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoverRating || currentRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name</Label>
        <Input id="displayName" placeholder="Sarah M." {...form.register("displayName")} />
        {form.formState.errors.displayName && (
          <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Review Title</Label>
        <Input id="title" placeholder="Excellent boarding experience" {...form.register("title")} />
        {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Your Review</Label>
        <Textarea id="body" rows={5} placeholder="Tell us about your stay..." {...form.register("body")} />
        {form.formState.errors.body && <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stayMonth">Stay Month (Optional)</Label>
        <Input id="stayMonth" placeholder="2026-02" {...form.register("stayMonth")} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submissionState === "submitting"}>
        {submissionState === "submitting" ? "Submitting..." : "Submit Review"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">Reviews are moderated before publication.</p>
    </form>
  );
}
