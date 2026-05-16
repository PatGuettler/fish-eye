import * as pdfjs from "pdfjs-dist";
import { findBestAcroValues } from "./acroFormMatch";
import type { ScheduleCLine } from "./acroFormMatch";
import { extractLinesFromOcrRows, ocrPdfToLineStrings } from "./ocrExtract";
import {
  clusterItemsIntoRows,
  extractLineAmountFromRows,
  type PdfTextItem,
  rowsToMergedStrings,
} from "./pdfTextRows";
import {
  normalizeExtractedScheduleC,
  type ScheduleCExtracted,
} from "./scheduleCExtract";

export type ParseScheduleCResult =
  | { ok: true; data: ScheduleCExtracted; source: string }
  | { ok: false; error: string };

function configureWorker(): void {
  const workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
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
      if (short && short !== fieldName) map.set(short, v);
    }
  }
  return map;
}

async function collectTextItems(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<PdfTextItem[]> {
  const merged: PdfTextItem[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    for (const raw of content.items) {
      const it = raw as { str?: string; transform?: number[] };
      if (!it.str || !it.transform || it.transform.length < 6) continue;
      const tx = it.transform[4];
      const ty = it.transform[5];
      const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
      merged.push({ str: it.str, x: vx, y: vy });
    }
  }
  return merged;
}

function parseAmountNearLineLabels(
  items: PdfTextItem[],
  lineNum: ScheduleCLine,
): string | undefined {
  const label = new RegExp(`^${lineNum}\\b`);
  const rows = items.filter((it) => label.test(it.str.trim()));
  if (rows.length === 0) return undefined;
  const anchor = rows.reduce((a, b) => (a.x < b.x ? a : b));
  const rowY = anchor.y;
  const tolerance = 8;
  const amounts = items.filter((it) => {
    if (Math.abs(it.y - rowY) > tolerance) return false;
    if (it.x <= anchor.x + 2) return false;
    const t = it.str.trim();
    if (label.test(t)) return false;
    const s = t.replace(/,/g, "").replace(/^\$/, "");
    return (
      /^-?\d*\.?\d+$/.test(s) ||
      /^\(\s*[\d.]+\s*\)$/.test(t) ||
      /^-\([\d.]+\)$/.test(t)
    );
  });
  if (amounts.length === 0) return undefined;
  amounts.sort((a, b) => b.x - a.x);
  return amounts[0].str;
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
      const tx = it.transform[4];
      const ty = it.transform[5];
      const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
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

async function extractViaLegacyHeuristic(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<Partial<Record<ScheduleCLine, string>>> {
  const items = await collectTextItems(pdf);
  const out: Partial<Record<ScheduleCLine, string>> = {};
  for (const line of [13, 30, 31] as const) {
    const v = parseAmountNearLineLabels(items, line);
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
  merged: Partial<Record<ScheduleCLine, string>>,
  legacy: Partial<Record<ScheduleCLine, string>>,
): number {
  let n = 0;
  for (const line of [13, 30, 31] as const) {
    const v = pickRaw(line, acro, merged, legacy);
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
    const acro = findBestAcroValues(fields, 55);
    const merged = await extractViaMergedRows(pdf);
    const legacy = await extractViaLegacyHeuristic(pdf);

    let ocr: Partial<Record<ScheduleCLine, string>> = {};
    const preOcrCount = countNonemptyFromLayers(acro, merged, legacy);
    if (preOcrCount < 3 && typeof document !== "undefined") {
      try {
        const ocrLines = await ocrPdfToLineStrings(pdf);
        ocr = extractLinesFromOcrRows(ocrLines);
      } catch {
        /* OCR optional; ignore if worker fails */
      }
    }

    const r13 = pickRaw(13, acro, merged, legacy, ocr);
    const r30 = pickRaw(30, acro, merged, legacy, ocr);
    const r31 = pickRaw(31, acro, merged, legacy, ocr);

    const dataOut = normalizeExtractedScheduleC({
      box13Raw: r13,
      box30Raw: r30,
      box31Raw: r31,
    });

    const sources: string[] = [];
    if ([13, 30, 31].some((l) => l in acro)) sources.push("acroform");
    if ([13, 30, 31].some((l) => l in merged)) sources.push("text-rows");
    if ([13, 30, 31].some((l) => l in legacy)) sources.push("text-heuristic");
    if ([13, 30, 31].some((l) => l in ocr)) sources.push("ocr");
    const source = sources.length > 0 ? sources.join("+") : "unknown";

    if ([r13, r30, r31].every((v) => v === undefined)) {
      return {
        ok: false,
        error:
          "Could not read lines 13, 30, and 31. Use the official IRS fillable Schedule C, a PDF with a text layer, or a clearer scan — OCR ran in-browser but may still miss values on complex layouts.",
      };
    }

    return { ok: true, data: dataOut, source };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
