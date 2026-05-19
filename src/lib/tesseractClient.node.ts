import { createRequire } from "node:module";
import type { OcrWorker } from "./tesseractClient.types";

const nodeRequire = createRequire(import.meta.url);

/** Node / Vitest: load CJS main via require (avoids ESM `self` in Node). */
export async function createOcrWorker(): Promise<OcrWorker> {
  const { createWorker } = nodeRequire("tesseract.js") as {
    createWorker: (
      langs?: string,
      oem?: number,
      options?: { logger?: () => void },
    ) => Promise<OcrWorker>;
  };
  return createWorker("eng", 1, { logger: () => {} });
}
