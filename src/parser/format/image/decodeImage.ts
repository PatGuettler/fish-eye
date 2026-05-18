/** Max longest edge before OCR (keeps Tesseract fast on phone photos). */
export const IMAGE_OCR_MAX_DIMENSION = 2500;

/** Reject huge files before decode. */
export const IMAGE_MAX_BYTES = 12 * 1024 * 1024;

export function isJpegBytes(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 3) return false;
  const u = new Uint8Array(bytes, 0, 3);
  return u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff;
}

export function downscaleDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Decode JPEG bytes to a canvas scaled for in-browser OCR. */
export async function decodeJpegToCanvas(
  bytes: ArrayBuffer,
  maxDimension = IMAGE_OCR_MAX_DIMENSION,
): Promise<HTMLCanvasElement> {
  if (!isJpegBytes(bytes)) {
    throw new Error("File is not a valid JPEG image.");
  }
  if (bytes.byteLength > IMAGE_MAX_BYTES) {
    throw new Error(
      `Image is too large (max ${Math.round(IMAGE_MAX_BYTES / (1024 * 1024))} MB).`,
    );
  }
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") {
    throw new Error("Image decoding requires a browser environment.");
  }

  const blob = new Blob([bytes], { type: "image/jpeg" });
  const bitmap = await createImageBitmap(blob);
  try {
    const { width, height } = downscaleDimensions(
      bitmap.width,
      bitmap.height,
      maxDimension,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare image for OCR.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas;
  } finally {
    bitmap.close();
  }
}
