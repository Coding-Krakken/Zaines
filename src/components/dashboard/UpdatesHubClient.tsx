"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BookingOption = {
  id: string;
  bookingNumber: string;
  checkInDate: string;
  status: string;
};

type TimelineItem =
  | {
      id: string;
      entityId: string;
      type: "message";
      occurredAt: string;
      booking: { id: string; bookingNumber: string } | null;
      senderType: string;
      senderName: string;
      content: string;
    }
  | {
      id: string;
      entityId: string;
      type: "photo";
      occurredAt: string;
      booking: { id: string; bookingNumber: string } | null;
      pet: { id: string; name: string };
      imageUrl: string;
      caption: string | null;
      uploadedBy: string | null;
    };

type FeedMode = "all" | "messages" | "photos";
type ContextMode = "all" | "booking-linked" | "unassigned";

export function UpdatesHubClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [contextMode, setContextMode] = useState<ContextMode>("all");
  const [messageDraft, setMessageDraft] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("none");
  const [expandedPhoto, setExpandedPhoto] = useState<Extract<TimelineItem, { type: "photo" }> | null>(null);
  const [sharingPhotoId, setSharingPhotoId] = useState<string | null>(null);

  const cleanMessageContent = useCallback((content: string) => {
    return content
      .replace(/\(Frame:\s*[^)]+\)/gi, "")
      .replace(/\[frame:[^\]]+\]/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }, []);

  const handleSharePhoto = useCallback(
    async (photo: Extract<TimelineItem, { type: "photo" }>) => {
      setSharingPhotoId(photo.id);
      try {
        const sharePayload = {
          title: `${photo.pet.name} update photo`,
          text: photo.caption || `${photo.pet.name} photo update`,
          url: photo.imageUrl,
        };

        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share(sharePayload);
        } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(photo.imageUrl);
        } else {
          window.open(photo.imageUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        // Ignore user-cancelled share flows.
      } finally {
        setSharingPhotoId(null);
      }
    },
    [],
  );

  const loadUpdates = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        mode: feedMode,
        limit: "80",
      });
      const response = await fetch(`/api/dashboard/updates?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        items?: TimelineItem[];
        bookings?: BookingOption[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load updates");
      }

      setItems(data.items ?? []);
      setBookings(data.bookings ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load updates");
    } finally {
      setIsLoading(false);
    }
  }, [feedMode]);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates]);

  const filteredItems = useMemo(() => {
    if (contextMode === "all") {
      return items;
    }

    if (contextMode === "booking-linked") {
      return items.filter((item) => Boolean(item.booking));
    }

    return items.filter((item) => !item.booking);
  }, [contextMode, items]);

  async function handleSendMessage() {
    const content = messageDraft.trim();
    if (!content) return;

    setIsSending(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          bookingId: selectedBookingId === "none" ? undefined : selectedBookingId,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to send message");
      }

      setMessageDraft("");
      setSelectedBookingId("none");
      await loadUpdates();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-300">Customer Updates</p>
        <h1 className="mt-2 text-3xl font-semibold">One timeline for messages and photos</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          Stay in sync with care updates in one place. Send account-level messages without choosing a
          booking, or attach context when it matters.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Context (optional)</p>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger>
                  <SelectValue placeholder="No booking (account-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No booking (account-level)</SelectItem>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.bookingNumber} • {booking.status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Message</p>
              <Textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Ask a question or share an update..."
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">{messageDraft.length}/5000</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSendMessage} disabled={isSending || !messageDraft.trim()}>
                {isSending ? "Sending..." : "Send Message"}
              </Button>
              <Button variant="outline" onClick={() => void loadUpdates()} disabled={isLoading}>
                Refresh Feed
              </Button>
            </div>

            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Account-level messaging is live now. Account-level photo uploads are next in the rollout;
              current photos still originate from booking activity.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Unified Timeline</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={feedMode} onValueChange={(value) => setFeedMode(value as FeedMode)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All content</SelectItem>
                  <SelectItem value="messages">Messages only</SelectItem>
                  <SelectItem value="photos">Photos only</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={contextMode}
                onValueChange={(value) => setContextMode(value as ContextMode)}
              >
                <SelectTrigger className="w-[210px]">
                  <SelectValue placeholder="Context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All context</SelectItem>
                  <SelectItem value="booking-linked">Booking-linked only</SelectItem>
                  <SelectItem value="unassigned">Unassigned only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading updates...</div>
            ) : filteredItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No updates matched this view.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const when = new Date(item.occurredAt).toLocaleString();
                  const bookingBadge = item.booking ? `Booking ${item.booking.bookingNumber}` : "Account-level";

                  if (item.type === "message") {
                    return (
                      <article key={item.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">Message</span>
                          <span>{bookingBadge}</span>
                          <span>{when}</span>
                        </div>
                        <p className="mt-2 text-sm">{cleanMessageContent(item.content)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.senderType === "customer" ? "You" : item.senderName}
                        </p>
                      </article>
                    );
                  }

                  return (
                    <article key={item.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">Photo</span>
                        <span>{bookingBadge}</span>
                        <span>{when}</span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="relative h-[120px] overflow-hidden rounded-md bg-muted">
                          <Image
                            src={item.imageUrl}
                            alt={item.caption || `${item.pet.name} photo`}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.pet.name}</p>
                          {item.caption ? <p className="text-sm">{item.caption}</p> : null}
                          <p className="text-xs text-muted-foreground">
                            Uploaded by {item.uploadedBy || "Staff"}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedPhoto(item)}
                            >
                              <ExternalLink className="mr-1 size-4" />
                              Open
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={item.imageUrl}
                                download={`${item.pet.name.toLowerCase().replace(/\s+/g, "-")}-update.jpg`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="mr-1 size-4" />
                                Download
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleSharePhoto(item)}
                              disabled={sharingPhotoId === item.id}
                            >
                              <Share2 className="mr-1 size-4" />
                              {sharingPhotoId === item.id ? "Sharing..." : "Share"}
                            </Button>
                          </div>
                          {item.booking ? (
                            <Link
                              className="text-xs text-primary underline"
                              href={`/dashboard/bookings/${item.booking.id}`}
                            >
                              Open booking details
                            </Link>
                          ) : (
                            <p className="text-xs text-muted-foreground">No booking linked</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(expandedPhoto)} onOpenChange={(open) => !open && setExpandedPhoto(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          {expandedPhoto ? (
            <>
              <DialogHeader>
                <DialogTitle>{expandedPhoto.pet.name} Photo Update</DialogTitle>
                <DialogDescription>
                  {expandedPhoto.caption || "Care photo update"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="relative h-[70vh] min-h-[340px] w-full overflow-hidden rounded-md bg-muted">
                  <Image
                    src={expandedPhoto.imageUrl}
                    alt={expandedPhoto.caption || `${expandedPhoto.pet.name} photo`}
                    fill
                    className="object-contain"
                    sizes="95vw"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a
                      href={expandedPhoto.imageUrl}
                      download={`${expandedPhoto.pet.name.toLowerCase().replace(/\s+/g, "-")}-update.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1 size-4" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" onClick={() => void handleSharePhoto(expandedPhoto)}>
                    <Share2 className="mr-1 size-4" />
                    Share
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
