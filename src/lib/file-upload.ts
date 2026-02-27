/**
 * File upload utilities for vaccine PDFs and photos
 * Supports both Vercel Blob and local storage for development
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_PDF_TYPES = ["application/pdf"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number = MAX_FILE_SIZE,
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Upload vaccine PDF
 * Returns the URL where the file is accessible
 */
export async function uploadVaccinePDF(
  file: File,
  petId: string,
): Promise<{ url: string; fileName: string }> {
  // Validate file
  const validation = validateFile(file, ALLOWED_PDF_TYPES);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check if Vercel Blob is configured
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken) {
    // Use Vercel Blob
    const { put } = await import("@vercel/blob");

    const fileName = `vaccines/${petId}/${Date.now()}-${file.name}`;
    const blob = await put(fileName, file, {
      access: "public",
      token: blobToken,
    });

    return {
      url: blob.url,
      fileName: file.name,
    };
  } else {
    // Development mode: Use FormData to upload to API route
    const formData = new FormData();
    formData.append("file", file);
    formData.append("petId", petId);

    const response = await fetch("/api/upload/vaccine", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return {
      url: data.url,
      fileName: file.name,
    };
  }
}

/**
 * Upload pet photo
 */
export async function uploadPetPhoto(
  file: File,
  petId: string,
  bookingId?: string,
): Promise<{ url: string; fileName: string }> {
  // Validate file
  const validation = validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024); // 5MB for images
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken) {
    const { put } = await import("@vercel/blob");

    const fileName = `photos/${bookingId || petId}/${Date.now()}-${file.name}`;
    const blob = await put(fileName, file, {
      access: "public",
      token: blobToken,
    });

    return {
      url: blob.url,
      fileName: file.name,
    };
  } else {
    // Development mode
    const formData = new FormData();
    formData.append("file", file);
    formData.append("petId", petId);
    if (bookingId) formData.append("bookingId", bookingId);

    const response = await fetch("/api/upload/photo", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return {
      url: data.url,
      fileName: file.name,
    };
  }
}

/**
 * Convert File to base64 (for signature canvas)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
