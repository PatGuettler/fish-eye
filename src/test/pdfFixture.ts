import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const F1040SC_PDF_PATH = resolve(PROJECT_ROOT, "f1040sc.pdf");
const WORKER_PATH = resolve(
  PROJECT_ROOT,
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
);

/** Canonical Schedule C line raw strings in the committed f1040sc.pdf fixture. */
export const F1040SC_EXPECTED_RAW = {
  box13: "You 13",
  box30: "you 30",
  box31: "you 31",
} as const;

export const F1040SC_EXPECTED_NORMALIZED = {
  box13: 0,
  box30: 0,
  box31: 0,
} as const;

let workerReady = false;

export function configurePdfWorker(): void {
  if (workerReady) return;
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(WORKER_PATH).href;
  workerReady = true;
}

export function assertF1040scPdfPresent(): void {
  if (!existsSync(F1040SC_PDF_PATH)) {
    throw new Error(
      `Missing fixture PDF at ${F1040SC_PDF_PATH}. Add f1040sc.pdf at the repository root.`,
    );
  }
}

export function readF1040scPdfBytes(): ArrayBuffer {
  assertF1040scPdfPresent();
  const fileBuf = readFileSync(F1040SC_PDF_PATH);
  return fileBuf.buffer.slice(
    fileBuf.byteOffset,
    fileBuf.byteOffset + fileBuf.byteLength,
  ) as ArrayBuffer;
}

export async function openF1040scPdf(): Promise<pdfjs.PDFDocumentProxy> {
  configurePdfWorker();
  const data = readF1040scPdfBytes();
  return pdfjs.getDocument({ data, useSystemFonts: true }).promise;
}
