import type * as pdfjs from "pdfjs-dist";
import { extractLineAmountFromRows } from "./pdfTextRows";
import type { ScheduleCLine } from "./acroFormMatch";

function splitOcrTextToLines(text: string): string[] {
  const linesOut: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t) linesOut.push(t);
  }
  return linesOut;
}

/**
 * Run Tesseract on a canvas. Loads ~2MB+ on first use; data never leaves the tab.
 */
export async function recognizeCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { logger: () => {} });
  try {
    const {
      data: { text },
    } = await worker.recognize(canvas as HTMLCanvasElement);
    return splitOcrTextToLines(text);
  } finally {
    await worker.terminate();
  }
}

/** OCR a JPEG (or other image decoded to canvas) into line strings. */
export async function ocrImageCanvas(canvas: HTMLCanvasElement): Promise<string[]> {
  return recognizeCanvas(canvas);
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
    linesOut.push(...(await recognizeCanvas(canvas)));
  }
  return linesOut;
}

export function extractLinesFromOcrRows(
  ocrLines: string[],
): Partial<Record<ScheduleCLine, string>> {
  const out: Partial<Record<ScheduleCLine, string>> = {};
  for (const line of [13, 30, 31] as const) {
    const v = extractLineAmountFromRows(ocrLines, line);
    if (v !== undefined) out[line] = v;
  }
  return out;
}
