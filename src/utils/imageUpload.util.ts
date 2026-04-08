import { createHash } from "node:crypto";

/**
 * Maximum image file size in bytes (5 MB)
 */
export const MAX_CONTENT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Allowed image MIME types for content management
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Detects the MIME type of an image buffer by checking file signature (magic bytes)
 * @param buffer - The image file buffer
 * @returns The detected MIME type or null if not recognized
 */
export function detectImageMimeType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return "image/png";
  }

  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12
    && buffer[0] === 0x52
    && buffer[1] === 0x49
    && buffer[2] === 0x46
    && buffer[3] === 0x46
    && buffer[8] === 0x57
    && buffer[9] === 0x45
    && buffer[10] === 0x42
    && buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  // GIF: 47 49 46
  if (buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }

  return null;
}

/**
 * Gets file extension from MIME type
 * @param mimeType - The MIME type
 * @returns The file extension without the dot
 */
export function extensionFromMimeType(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return extensionMap[mimeType] || "bin";
}

/**
 * Generates a unique hash for the image file using SHA256
 * @param buffer - The image file buffer
 * @returns The SHA256 hash as a hexadecimal string
 */
export function generateImageHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Validates MIME type against allowed image types
 * @param mimeType - The MIME type to validate
 * @returns true if the MIME type is allowed
 */
export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType);
}
