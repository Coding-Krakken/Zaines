"use client";

import { useState, useMemo } from "react";
import { useActivityPolling } from "@/hooks/useActivityPolling";

interface ActivityTimelineProps {
  bookingId: string;
}

const ACTIVITY_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  feeding: { label: "Feeding", emoji: "🍽️" },
  walk: { label: "Walk", emoji: "🚶" },
  play: { label: "Play", emoji: "🎾" },
  bathroom: { label: "Bathroom", emoji: "🚽" },
  medication: { label: "Medication", emoji: "💊" },
  grooming: { label: "Grooming", emoji: "✂️" },
};

export function ActivityTimeline({ bookingId }: ActivityTimelineProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const {
    activities,
    isLoading,
    isError,
    error,
    hasMore,
    filteredActivities,
    loadMore,
    refresh,
    setActivityFilter,
  } = useActivityPolling({
    bookingId,
    pollIntervalMs: 30000, // 30s SLA
  });

  // Update filter when selected types change
  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newTypes);
    setActivityFilter(newTypes);
  };

  // Group activities by date for better visualization
  const groupedActivities = useMemo(() => {
    const groups: Record<string, typeof filteredActivities> = {};

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.performedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  return (
    <div className="space-y-6" role="region" aria-label="Activity Timeline">
      {/* Error state */}
      {isError && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-red-800">
            Failed to load activities: {error?.message}
          </p>
          <button
            onClick={refresh}
            className="mt-2 px-3 py-1 bg-red-100 text-red-900 text-sm rounded hover:bg-red-200"
            aria-label="Retry loading activities"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Filter by Activity Type</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACTIVITY_TYPE_LABELS).map(([type, { label, emoji }]) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedTypes.includes(type)
                  ? "bg-blue-50 border-blue-300 text-blue-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              aria-pressed={selectedTypes.includes(type)}
              aria-label={`Filter by ${label}`}
            >
              <span className="mr-1">{emoji}</span>
              {label}
            </button>
          ))}
          {selectedTypes.length > 0 && (
            <button
              onClick={() => {
                setSelectedTypes([]);
                setActivityFilter([]);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              aria-label="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && filteredActivities.length === 0 && (
        <div
          className="p-8 text-center"
          role="status"
          aria-live="polite"
          aria-label="Loading activities"
        >
          <div className="inline-block animate-spin">⏳</div>
          <p className="mt-2 text-sm text-gray-600">Loading activity timeline...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredActivities.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {selectedTypes.length > 0
              ? "No activities match the selected filters."
              : "No activities recorded yet."}
          </p>
        </div>
      )}

      {/* Timeline */}
      {Object.entries(groupedActivities).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date} className="space-y-4">
              <h4 className="font-medium text-gray-900 sticky top-0 bg-white py-2">
                {date}
              </h4>

              <div className="space-y-3">
                {dayActivities.map((activity) => {
                  const typeInfo = ACTIVITY_TYPE_LABELS[activity.type] || {
                    label: activity.type,
                    emoji: "📝",
                  };
                  const time = new Date(activity.performedAt).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit" }
                  );

                  return (
                    <div
                      key={activity.id}
                      className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      role="article"
                    >
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 text-xl mt-1">
                        {typeInfo.emoji}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h5 className="font-medium text-sm text-gray-900">
                            {typeInfo.label}
                          </h5>
                          <time className="text-xs text-gray-500" dateTime={activity.performedAt.toString()}>
                            {time}
                          </time>
                        </div>

                        {activity.pet && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">{activity.pet.name}</span>
                          </p>
                        )}

                        {activity.description && (
                          <p className="text-sm text-gray-700 mt-2">
                            {activity.description}
                          </p>
                        )}

                        {activity.notes && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            Notes: {activity.notes}
                          </p>
                        )}

                        {activity.performedBy && (
                          <p className="text-xs text-gray-500 mt-2">
                            By {activity.performedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            aria-label="Load more activities"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 pt-4 border-t">
        <p>
          Total activities shown: {filteredActivities.length}
          {hasMore && " (more available)"}
        </p>
      </div>
    </div>
  );
}
