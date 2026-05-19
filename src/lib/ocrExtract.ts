import type * as pdfjs from "pdfjs-dist";
import { decodeJpegToCanvas } from "../parser/format/image/decodeImage";
import { extractScheduleCLineValuesFromRows } from "./formLineValues";
import { preprocessCanvasForOcr } from "./imagePreprocess";
import {
  dedupeRowStrings,
  ocrWordsFromPage,
  rowStringsFromOcrPage,
  splitPlainOcrText,
  type OcrWordLike,
} from "./ocrPageRows";
import type { OcrPageData, OcrWorker } from "./tesseractClient.types";
import type { ScheduleCLine } from "./acroFormMatch";

/** Tesseract page segmentation modes useful for forms + scattered field text. */
const OCR_PSM_MODES = ["6", "11", "3"] as const;

async function createOcrWorkerForEnv(): Promise<OcrWorker> {
  if (typeof window !== "undefined") {
    const { createOcrWorker } = await import("./tesseractClient.browser");
    return createOcrWorker();
  }
  const { createOcrWorker } = await import(
    /* @vite-ignore */ "./tesseractClient.node"
  );
  return createOcrWorker();
}

function canDecodeJpegInBrowser(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

async function recognizePageOnce(
  worker: OcrWorker,
  image: unknown,
  psm: string,
): Promise<OcrPageData> {
  if (worker.setParameters) {
    await worker.setParameters({
      tessedit_pageseg_mode: psm,
      user_defined_dpi: "300",
    });
  }
  const { data } = await worker.recognize(image, {}, { text: true });
  return data;
}

function rowsFromOcrData(data: OcrPageData): string[] {
  return dedupeRowStrings([
    ...rowStringsFromOcrPage(data),
    ...splitPlainOcrText(data.text ?? ""),
  ]);
}

function wordsFromOcrData(data: OcrPageData): OcrWordLike[] {
  return ocrWordsFromPage(data);
}

function dedupeOcrWords(words: OcrWordLike[]): OcrWordLike[] {
  const seen = new Set<string>();
  const out: OcrWordLike[] = [];
  for (const w of words) {
    const key = `${w.text.toLowerCase()}\0${Math.round(w.x)}\0${Math.round(w.y)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

export type OcrRecognitionBundle = {
  readonly rowStrings: string[];
  readonly words: OcrWordLike[];
};

/**
 * Run Tesseract with multiple segmentation modes and spatial row clustering.
 * Loads ~2MB+ on first use; data never leaves the tab.
 */
export async function recognizeCanvasToBundle(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<OcrRecognitionBundle> {
  const prepped =
    typeof document !== "undefined"
      ? preprocessCanvasForOcr(canvas as HTMLCanvasElement)
      : canvas;

  const worker = await createOcrWorkerForEnv();
  const mergedRows: string[] = [];
  const mergedWords: OcrWordLike[] = [];
  try {
    for (const psm of OCR_PSM_MODES) {
      const data = await recognizePageOnce(worker, prepped, psm);
      mergedRows.push(...rowsFromOcrData(data));
      mergedWords.push(...wordsFromOcrData(data));
    }
  } finally {
    await worker.terminate();
  }
  return {
    rowStrings: dedupeRowStrings(mergedRows),
    words: dedupeOcrWords(mergedWords),
  };
}

export async function recognizeCanvasToRows(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<string[]> {
  return (await recognizeCanvasToBundle(canvas)).rowStrings;
}

/** @deprecated Prefer {@link recognizeCanvasToRows}. */
export async function recognizeCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<string[]> {
  return recognizeCanvasToRows(canvas);
}

/** OCR a JPEG in the browser (decode → canvas) or Node (buffer recognize). */
export async function ocrJpegBytes(bytes: ArrayBuffer): Promise<OcrRecognitionBundle> {
  if (canDecodeJpegInBrowser()) {
    const canvas = await decodeJpegToCanvas(bytes);
    return recognizeCanvasToBundle(canvas);
  }

  const worker = await createOcrWorkerForEnv();
  const mergedRows: string[] = [];
  const mergedWords: OcrWordLike[] = [];
  try {
    const input =
      typeof Buffer !== "undefined" ? Buffer.from(bytes) : bytes;
    for (const psm of OCR_PSM_MODES) {
      const data = await recognizePageOnce(worker, input, psm);
      mergedRows.push(...rowsFromOcrData(data));
      mergedWords.push(...wordsFromOcrData(data));
    }
  } finally {
    await worker.terminate();
  }
  return {
    rowStrings: dedupeRowStrings(mergedRows),
    words: dedupeOcrWords(mergedWords),
  };
}

/** @deprecated Use {@link ocrJpegBytes}. */
export async function ocrImageCanvas(canvas: HTMLCanvasElement): Promise<string[]> {
  return recognizeCanvasToRows(canvas);
}

/**
 * Renders each page to a canvas and runs Tesseract in the browser.
 * Use only when the PDF has no usable text layer (scanned) or extraction gaps remain.
 */
export async function ocrPdfToLineStrings(
  pdf: pdfjs.PDFDocumentProxy,
  scale = 2,
): Promise<string[]> {
  if (typeof document === "undefined") {
    return [];
  }
  const linesOut: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    await renderTask.promise;
    linesOut.push(...(await recognizeCanvasToRows(canvas)));
  }
  return linesOut;
}

export function extractLinesFromOcrRows(
  ocrLines: string[],
): Partial<Record<ScheduleCLine, string>> {
  return extractScheduleCLineValuesFromRows(ocrLines);
}
