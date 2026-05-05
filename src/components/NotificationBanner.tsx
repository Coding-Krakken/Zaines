"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationBannerProps {
  bookingId: string;
}

export function NotificationBanner({ bookingId }: NotificationBannerProps) {
  const dismissTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  const { pendingNotifications, clearNotifications, markNotificationRead, newEventCount } =
    useNotifications({
      bookingId,
      pollIntervalMs: 30000,
      onNotification: (event) => {
        const existingTimer = dismissTimersRef.current[event.id];
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Automatically hide notification after 5 seconds
        dismissTimersRef.current[event.id] = setTimeout(() => {
          markNotificationRead(event.id);
          delete dismissTimersRef.current[event.id];
        }, 5000);
      },
    });

  useEffect(() => {
    return () => {
      Object.values(dismissTimersRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      dismissTimersRef.current = {};
    };
  }, []);

  if (pendingNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-40 space-y-2 max-w-sm"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {pendingNotifications.slice(-3).map((notification) => {
        const bgColor =
          notification.type === "activity"
            ? "bg-blue-50 border-blue-200"
            : notification.type === "photo"
            ? "bg-green-50 border-green-200"
            : "bg-purple-50 border-purple-200";

        const textColor =
          notification.type === "activity"
            ? "text-blue-900"
            : notification.type === "photo"
            ? "text-green-900"
            : "text-purple-900";

        const emoji =
          notification.type === "activity"
            ? "📋"
            : notification.type === "photo"
            ? "📸"
            : "💬";

        return (
          <div
            key={notification.id}
            className={`p-3 border rounded-lg shadow-md ${bgColor} animate-slide-in`}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${textColor}`}>
                  {notification.title}
                </p>
                <p className={`text-xs ${textColor} opacity-75 mt-1`}>
                  {notification.body}
                </p>
              </div>
              <button
                onClick={() => markNotificationRead(notification.id)}
                className={`flex-shrink-0 text-lg hover:opacity-75 ${textColor}`}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      {newEventCount > 3 && (
        <div className="p-2 text-center text-xs text-gray-600">
          +{newEventCount - 3} more notifications
        </div>
      )}

      <div className="text-center">
        <button
          onClick={clearNotifications}
          className="text-xs text-gray-600 hover:text-gray-900 underline"
          aria-label="Clear all notifications"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

// CSS for animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slide-in {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `;
  if (!document.head.querySelector("style[data-notifications]")) {
    style.setAttribute("data-notifications", "true");
    document.head.appendChild(style);
  }
}
