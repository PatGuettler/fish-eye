import * as pdfjs from "pdfjs-dist";
import { extractScheduleCAcroValues } from "./acroFormMatch";
import type { ScheduleCLine } from "./acroFormMatch";
import { extractLinesFromOcrRows, ocrPdfToLineStrings } from "./ocrExtract";
import {
  clusterItemsIntoRows,
  extractLineAmountFromRows,
  type PdfTextItem,
  rowsToMergedStrings,
} from "./pdfTextRows";
import {
  collectPageViewportItems,
  parseAmountForLineFromPageItems,
} from "./scheduleCLayoutExtract";
import {
  normalizeExtractedScheduleC,
  type ScheduleCBoxRaw,
  type ScheduleCExtracted,
} from "./scheduleCExtract";

export type ParseScheduleCResult =
  | { ok: true; data: ScheduleCExtracted; raw: ScheduleCBoxRaw; source: string }
  | { ok: false; error: string };

function configureWorker(): void {
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
    "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
}

type FieldMap = Map<string, string>;

async function collectAcroFormFieldsAsync(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<FieldMap> {
  const map = new Map<string, string>();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const annotations = await page.getAnnotations({ intent: "display" });
    for (const a of annotations) {
      const subtype = (a as { subtype?: string }).subtype;
      if (subtype !== "Widget") continue;
      const fieldName = String(
        (a as { fieldName?: string }).fieldName ?? "",
      ).trim();
      if (!fieldName) continue;
      const fieldValue = (a as { fieldValue?: string | null }).fieldValue;
      const v =
        fieldValue == null || fieldValue === ""
          ? ""
          : String(fieldValue);
      map.set(fieldName, v);
      const short = fieldName.split(/[[\].]/).pop();
      if (
        short &&
        short !== fieldName &&
        !/^\d+$/.test(short) &&
        short.length > 1
      ) {
        map.set(short, v);
      }
    }
  }
  return map;
}

async function extractViaLayout(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<Partial<Record<ScheduleCLine, string>>> {
  const out: Partial<Record<ScheduleCLine, string>> = {};
  for (const line of [13, 30, 31] as const) {
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const { items, width } = await collectPageViewportItems(page);
      const v = parseAmountForLineFromPageItems(items, width, line);
      if (v !== undefined) {
        out[line] = v;
        break;
      }
    }
  }
  return out;
}

async function extractViaMergedRows(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<Partial<Record<ScheduleCLine, string>>> {
  const out: Partial<Record<ScheduleCLine, string>> = {};
  const rowStrings: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pageItems: PdfTextItem[] = [];
    for (const raw of content.items) {
      const it = raw as { str?: string; transform?: number[] };
      if (!it.str || !it.transform || it.transform.length < 6) continue;
      const [vx, vy] = viewport.convertToViewportPoint(
        it.transform[4],
        it.transform[5],
      );
      pageItems.push({ str: it.str, x: vx, y: vy });
    }
    const clusters = clusterItemsIntoRows(pageItems, 5);
    rowStrings.push(...rowsToMergedStrings(clusters));
  }
  for (const line of [13, 30, 31] as const) {
    const v = extractLineAmountFromRows(rowStrings, line);
    if (v !== undefined) out[line] = v;
  }
  return out;
}

function pickRaw(
  line: ScheduleCLine,
  ...layers: Partial<Record<ScheduleCLine, string>>[]
): string | undefined {
  let emptyHit: string | undefined;
  for (const layer of layers) {
    if (!Object.prototype.hasOwnProperty.call(layer, line)) continue;
    const v = layer[line];
    if (v === undefined) continue;
    const s = String(v);
    if (s.trim() !== "") return s;
    emptyHit ??= s;
  }
  return emptyHit;
}

function countNonemptyFromLayers(
  acro: Partial<Record<ScheduleCLine, string>>,
  layout: Partial<Record<ScheduleCLine, string>>,
  merged: Partial<Record<ScheduleCLine, string>>,
): number {
  let n = 0;
  for (const line of [13, 30, 31] as const) {
    const v = pickRaw(line, acro, layout, merged);
    if (v !== undefined && v.trim() !== "") n++;
  }
  return n;
}

export async function parseScheduleCPdfBytes(
  data: ArrayBuffer,
): Promise<ParseScheduleCResult> {
  try {
    configureWorker();
    const pdf = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
    const fields = await collectAcroFormFieldsAsync(pdf);
    const acro = extractScheduleCAcroValues(fields);
    const layout = await extractViaLayout(pdf);
    const merged = await extractViaMergedRows(pdf);

    let ocr: Partial<Record<ScheduleCLine, string>> = {};
    const preOcrCount = countNonemptyFromLayers(acro, layout, merged);
    if (preOcrCount < 3 && typeof document !== "undefined") {
      try {
        const ocrLines = await ocrPdfToLineStrings(pdf);
        ocr = extractLinesFromOcrRows(ocrLines);
      } catch {
        /* OCR optional; ignore if worker fails */
      }
    }

    const r13 = pickRaw(13, acro, layout, merged, ocr);
    const r30 = pickRaw(30, acro, layout, merged, ocr);
    const r31 = pickRaw(31, acro, layout, merged, ocr);

    const dataOut = normalizeExtractedScheduleC({
      box13Raw: r13,
      box30Raw: r30,
      box31Raw: r31,
    });

    const raw: ScheduleCBoxRaw = {
      box13: r13 ?? "",
      box30: r30 ?? "",
      box31: r31 ?? "",
    };

    const sources: string[] = [];
    if ([13, 30, 31].some((l) => l in acro)) sources.push("acroform");
    if ([13, 30, 31].some((l) => l in layout)) sources.push("layout");
    if ([13, 30, 31].some((l) => l in merged)) sources.push("text-rows");
    if ([13, 30, 31].some((l) => l in ocr)) sources.push("ocr");
    const source = sources.length > 0 ? sources.join("+") : "unknown";

    if ([r13, r30, r31].every((v) => v === undefined)) {
      return {
        ok: false,
        error:
          "Could not read lines 13, 30, and 31. Use the official IRS fillable Schedule C, a PDF with a text layer, or a clearer scan — OCR ran in-browser but may still miss values on complex layouts.",
      };
    }

    return { ok: true, data: dataOut, raw, source };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
