"use client";

import { useState, useRef, useEffect } from "react";
import { usePhotoGallery } from "@/hooks/usePhotoGallery";
import Image from "next/image";

interface PhotoGalleryProps {
  bookingId: string;
  petId?: string;
}

export function PhotoGallery({ bookingId, petId }: PhotoGalleryProps) {
  const { photos, isLoading, isError, error, hasMore, totalPhotos, loadMore, refresh } =
    usePhotoGallery({
      bookingId,
      pollIntervalMs: 30000, // 30s polling
      petId,
    });

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (selectedPhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : null
        );
      } else if (e.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev < photos.length - 1 ? prev + 1 : null
        );
      } else if (e.key === "Escape") {
        setSelectedPhotoIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  return (
    <div className="space-y-6" role="region" aria-label="Photo Gallery">
      {/* Error state */}
      {isError && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-red-800">
            Failed to load photos: {error?.message}
          </p>
          <button
            onClick={refresh}
            className="mt-2 px-3 py-1 bg-red-100 text-red-900 text-sm rounded hover:bg-red-200"
            aria-label="Retry loading photos"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && photos.length === 0 && (
        <div
          className="p-8 text-center"
          role="status"
          aria-live="polite"
          aria-label="Loading photos"
        >
          <div className="inline-block animate-spin text-2xl">📸</div>
          <p className="mt-2 text-sm text-gray-600">Loading photos...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && photos.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">No photos shared yet.</p>
        </div>
      )}

      {/* Gallery grid */}
      {photos.length > 0 && (
        <div>
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm">
              Photo Gallery ({totalPhotos} {totalPhotos === 1 ? "photo" : "photos"})
            </h3>
          </div>

          {/* Grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            role="grid"
          >
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(idx)}
                className="relative group overflow-hidden rounded-lg aspect-square bg-gray-100 hover:shadow-md transition-shadow"
                aria-label={`Open photo ${idx + 1}: ${photo.caption || "Photo"}`}
              >
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                  {photo.caption && (
                    <div className="w-full p-2 bg-black/50 text-white text-xs truncate">
                      {photo.caption}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                aria-label="Load more photos"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={(e) => {
            if (e.target === lightboxRef.current) {
              setSelectedPhotoIndex(null);
            }
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl"
            aria-label="Close lightbox"
          >
            ✕
          </button>

          {/* Previous button */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
              className="absolute left-4 text-white hover:text-gray-300 text-3xl"
              aria-label="Previous photo"
            >
              ❮
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full max-w-2xl max-h-[80vh]">
            <Image
              src={photos[selectedPhotoIndex]!.imageUrl}
              alt={photos[selectedPhotoIndex]!.caption || `Photo ${selectedPhotoIndex + 1}`}
              fill
              className="object-contain"
              priority
              sizes="90vw"
            />
          </div>

          {/* Next button */}
          {selectedPhotoIndex < photos.length - 1 && (
            <button
              onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
              className="absolute right-4 text-white hover:text-gray-300 text-3xl"
              aria-label="Next photo"
            >
              ❯
            </button>
          )}

          {/* Photo info */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-4">
            <div className="text-sm">
              {photos[selectedPhotoIndex]?.caption && (
                <p className="font-medium mb-2">{photos[selectedPhotoIndex].caption}</p>
              )}
              <div className="flex justify-between text-xs text-gray-300">
                <span>
                  Photo {selectedPhotoIndex + 1} of {photos.length}
                </span>
                <span>
                  By {photos[selectedPhotoIndex]?.uploadedBy}
                  {" • "}
                  {new Date(photos[selectedPhotoIndex]!.uploadedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="absolute bottom-20 left-0 right-0 text-center text-xs text-gray-400">
            <p>← / → to navigate • ESC to close</p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 pt-4 border-t">
        <p>
          Photos shown: {photos.length}
          {hasMore && " (more available)"}
        </p>
      </div>
    </div>
  );
}
