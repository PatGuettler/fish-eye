import * as pdfjs from "pdfjs-dist";

export function configurePdfWorker(): void {
  if (pdfjs.GlobalWorkerOptions.workerSrc) return;
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    return;
  }
  /** Node / Vitest when worker was not preset (e.g. future SSR use). */
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "../../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
}

export function cloneArrayBuffer(data: ArrayBuffer): ArrayBuffer {
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(new Uint8Array(data));
  return copy;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<pdfjs.PDFDocumentProxy> {
  configurePdfWorker();
  return pdfjs
    .getDocument({ data: cloneArrayBuffer(data), useSystemFonts: true })
    .promise;
}
