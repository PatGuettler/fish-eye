import type * as pdfjs from "pdfjs-dist";
import { extractLineAmountFromRows } from "./pdfTextRows";
import type { ScheduleCLine } from "./acroFormMatch";

/**
 * Renders each page to a canvas and runs Tesseract in the browser.
 * Use only when the PDF has no usable text layer (scanned) or extraction gaps remain.
 * Loads ~2MB+ chunk on first use; data never leaves the tab.
 */
export async function ocrPdfToLineStrings(
  pdf: pdfjs.PDFDocumentProxy,
  scale = 2,
): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { logger: () => {} });
  const linesOut: string[] = [];
  try {
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
      const {
        data: { text },
      } = await worker.recognize(canvas);
      for (const line of text.split(/\r?\n/)) {
        const t = line.trim();
        if (t) linesOut.push(t);
      }
    }
  } finally {
    await worker.terminate();
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
