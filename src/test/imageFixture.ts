import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJpegDimensions } from "../parser/format/image/decodeImage";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Committed Schedule C photo fixture (repo root). */
export const SCHEDULC_JPEG_PATH = resolve(PROJECT_ROOT, "schedulC.jpg");

export function assertSchedulCJpegPresent(): void {
  if (!existsSync(SCHEDULC_JPEG_PATH)) {
    throw new Error(
      `Missing fixture JPEG at ${SCHEDULC_JPEG_PATH}. Add schedulC.jpg at the repository root.`,
    );
  }
}

export function readSchedulCJpegBytes(): ArrayBuffer {
  assertSchedulCJpegPresent();
  const fileBuf = readFileSync(SCHEDULC_JPEG_PATH);
  return fileBuf.buffer.slice(
    fileBuf.byteOffset,
    fileBuf.byteOffset + fileBuf.byteLength,
  ) as ArrayBuffer;
}

export function schedulCJpegDimensions(): { width: number; height: number } {
  const bytes = readSchedulCJpegBytes();
  const dims = readJpegDimensions(bytes);
  if (!dims) {
    throw new Error("Could not read dimensions from schedulC.jpg");
  }
  return dims;
}
