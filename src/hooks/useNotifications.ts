import { useEffect, useState, useRef, useCallback } from "react";

interface Activity {
  id: string;
  type: string;
  description?: string;
  performedBy?: string;
  performedAt: Date | string;
  pet?: { id: string; name: string };
}

interface Photo {
  id: string;
  imageUrl: string;
  caption?: string;
  uploadedBy?: string;
  uploadedAt: Date | string;
}

interface Message {
  id: string;
  content: string;
  senderType: "customer" | "staff";
  senderName: string;
  sentAt: Date | string;
}

interface NotificationEvent {
  type: "activity" | "photo" | "message";
  id: string;
  timestamp: Date;
  title: string;
  body: string;
}

interface UseNotificationsOptions {
  bookingId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
  onNotification?: (event: NotificationEvent) => void;
}

interface UseNotificationsResult {
  pendingNotifications: NotificationEvent[];
  newEventCount: number;
  lastPollTime: Date | null;
  pollError: Error | null;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
}

/**
 * Hook for managing real-time notifications via polling
 * Tracks new activities, photos, and messages
 * Implements SLA: delivers events within 30s in polling mode
 */
export function useNotifications({
  bookingId,
  enabled = true,
  pollIntervalMs = 30000, // 30s SLA
  onNotification,
}: UseNotificationsOptions): UseNotificationsResult {
  const [pendingNotifications, setPendingNotifications] = useState<NotificationEvent[]>([]);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [pollError, setPollError] = useState<Error | null>(null);
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());

  const pollTimeoutRef = useRef<NodeJS.Timeout>(null);
  const abortControllerRef = useRef<AbortController>(null);

  // Poll for new notifications
  const poll = useCallback(async () => {
    try {
      setPollError(null);

      abortControllerRef.current = new AbortController();

      const params = new URLSearchParams({
        ...(lastPollTime && { since: lastPollTime.toISOString() }),
      });

      const response = await fetch(
        `/api/bookings/${bookingId}/notifications?${params}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Notification poll failed: ${response.status}`);
      }

      const data = await response.json();
      const now = new Date(data.meta.timestamp);

      // Process new activities
      const newActivities: NotificationEvent[] = (data.events.activities || [])
        .filter((activity: Activity) => !seenEventIds.has(activity.id))
        .map((activity: Activity) => ({
          type: "activity" as const,
          id: activity.id,
          timestamp: new Date(activity.performedAt),
          title: `Activity: ${activity.type}`,
          body: `${activity.pet?.name || "Pet"} - ${activity.description || activity.type} (by ${activity.performedBy})`,
        }));

      // Process new photos
      const newPhotos: NotificationEvent[] = (data.events.photos || [])
        .filter((photo: Photo) => !seenEventIds.has(photo.id))
        .map((photo: Photo) => ({
          type: "photo" as const,
          id: photo.id,
          timestamp: new Date(photo.uploadedAt),
          title: "New photo shared",
          body: `${photo.caption || "Photo"} uploaded by ${photo.uploadedBy}`,
        }));

      // Process new messages
      const newMessages: NotificationEvent[] = (data.events.messages || [])
        .filter((message: Message) => !seenEventIds.has(message.id))
        .map((message: Message) => ({
          type: "message" as const,
          id: message.id,
          timestamp: new Date(message.sentAt),
          title: `Message from ${message.senderName}`,
          body: message.content.substring(0, 100),
        }));

      const allNewEvents = [...newActivities, ...newPhotos, ...newMessages];

      // Update seen events
      const newSeenIds = new Set(seenEventIds);
      allNewEvents.forEach((evt) => newSeenIds.add(evt.id));
      setSeenEventIds(newSeenIds);

      // Add to pending notifications
      if (allNewEvents.length > 0) {
        setPendingNotifications((prev) => {
          // Limit to 50 notifications in UI
          const updated = [...prev, ...allNewEvents];
          return updated.slice(-50);
        });

        // Trigger callback for each new event
        allNewEvents.forEach((evt) => {
          onNotification?.(evt);
        });
      }

      setLastPollTime(now);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setPollError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("Notification polling error:", err);
      }
    }
  }, [bookingId, lastPollTime, seenEventIds, onNotification]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setPendingNotifications([]);
  }, []);

  // Mark notification as read (remove from display)
  const markNotificationRead = useCallback((id: string) => {
    setPendingNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Set up polling
  useEffect(() => {
    if (!enabled || !bookingId) return;

    // Initial poll
    poll();

    // Set up polling interval
    pollTimeoutRef.current = setInterval(() => {
      poll();
    }, pollIntervalMs);

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [enabled, bookingId, pollIntervalMs, poll]);

  return {
    pendingNotifications,
    newEventCount: pendingNotifications.length,
    lastPollTime,
    pollError,
    clearNotifications,
    markNotificationRead,
  };
}
