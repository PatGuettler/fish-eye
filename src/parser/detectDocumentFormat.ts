import type { DocumentFormatKind } from "./core/DocumentFormatKind";
import { isJpegBytes } from "./format/image/decodeImage";

export function isPdfBytes(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 4) return false;
  const u = new Uint8Array(bytes, 0, 4);
  return (
    u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46
  );
}

const JPEG_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
]);

const PDF_MIME_TYPES = new Set(["application/pdf"]);

/**
 * Infer document format from MIME type and/or magic bytes.
 * Returns null when the file type is not supported.
 */
export function detectDocumentFormat(
  bytes: ArrayBuffer,
  mimeType?: string,
): DocumentFormatKind | null {
  const mime = mimeType?.trim().toLowerCase();
  if (mime && PDF_MIME_TYPES.has(mime)) return "pdf";
  if (mime && JPEG_MIME_TYPES.has(mime)) return "jpeg";
  if (isPdfBytes(bytes)) return "pdf";
  if (isJpegBytes(bytes)) return "jpeg";
  return null;
}

export function mimeTypeForFormat(kind: DocumentFormatKind): string {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}
