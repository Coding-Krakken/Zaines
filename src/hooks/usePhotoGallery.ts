import { useEffect, useState, useRef, useCallback } from "react";

interface Photo {
  id: string;
  imageUrl: string;
  caption?: string;
  uploadedBy?: string;
  uploadedAt: Date | string;
  pet?: { id: string; name: string };
}

interface PhotosApiResponse {
  items: Array<Omit<Photo, "uploadedAt"> & { uploadedAt: string }>;
  hasMore: boolean;
  nextCursor: string | null;
}

interface UsePhotoGalleryOptions {
  bookingId: string;
  enabled?: boolean;
  pollIntervalMs?: number; // Default: 30000 (30 seconds)
  petId?: string;
}

interface UsePhotoGalleryResult {
  photos: Photo[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalPhotos: number;
}

/**
 * Hook for polling and managing pet photos
 * Handles cursor-based pagination for gallery
 */
export function usePhotoGallery({
  bookingId,
  enabled = true,
  pollIntervalMs = 30000,
  petId,
}: UsePhotoGalleryOptions): UsePhotoGalleryResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalPhotos, setTotalPhotos] = useState(0);

  const pollTimeoutRef = useRef<NodeJS.Timeout>(null);
  const abortControllerRef = useRef<AbortController>(null);

  // Fetch photos
  const fetchPhotos = useCallback(
    async (cursor?: string, append = false) => {
      try {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        abortControllerRef.current = new AbortController();

        const params = new URLSearchParams({
          limit: "20",
          ...(cursor && { cursor }),
          ...(petId && { petId }),
        });

        const response = await fetch(
          `/api/bookings/${bookingId}/photos?${params}`,
          {
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.status}`);
        }

        const data = (await response.json()) as PhotosApiResponse;
        const newPhotos = data.items.map((item) => ({
          ...item,
          uploadedAt: new Date(item.uploadedAt),
        }));

        if (append) {
          setPhotos((prev) => [...prev, ...newPhotos]);
        } else {
          setPhotos(newPhotos);
        }

        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        setTotalPhotos(newPhotos.length);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setIsError(true);
          setError(err);
          console.error("Photo gallery polling error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [bookingId, petId]
  );

  // Load more handler
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchPhotos(nextCursor ?? undefined, true);
  }, [hasMore, isLoading, nextCursor, fetchPhotos]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetchPhotos();
  }, [fetchPhotos]);

  // Initial load and polling setup
  useEffect(() => {
    if (!enabled || !bookingId) return;

    // Defer initial fetch to avoid synchronous state updates during effect execution.
    const initialFetchTimer = setTimeout(() => {
      void fetchPhotos();
    }, 0);

    // Set up polling interval
    pollTimeoutRef.current = setInterval(() => {
      fetchPhotos();
    }, pollIntervalMs);

    return () => {
      clearTimeout(initialFetchTimer);
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [enabled, bookingId, pollIntervalMs, petId, fetchPhotos]);

  return {
    photos,
    isLoading,
    isError,
    error,
    hasMore,
    nextCursor,
    loadMore,
    refresh,
    totalPhotos,
  };
}
