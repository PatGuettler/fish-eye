import * as pdfjs from "pdfjs-dist";
import {
  normalizeExtractedScheduleC,
  type ScheduleCExtracted,
} from "./scheduleCExtract";

export type ParseScheduleCResult =
  | { ok: true; data: ScheduleCExtracted; source: "acroform" | "text-heuristic" }
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

/** Common IRS / vendor field naming patterns for Schedule C lines. */
const LINE_13_KEYS = [
  /^l_?13$/i,
  /^line_?13$/i,
  /^f1_13(_[0-9]+)?$/i,
  /^c1_13$/i,
  /^scheduleC.*13/i,
  /^sc.*l13$/i,
  /^p1_t13/i,
];
const LINE_30_KEYS = [/^l_?30$/i, /^line_?30$/i, /^f1_30/i, /^c1_30$/i, /^sc.*l30$/i];
const LINE_31_KEYS = [/^l_?31$/i, /^line_?31$/i, /^f1_31/i, /^c1_31$/i, /^sc.*l31$/i];

function firstMatchingField(
  fields: FieldMap,
  patterns: RegExp[],
): string | undefined {
  for (const [name, val] of fields) {
    for (const re of patterns) {
      if (re.test(name)) return val;
    }
  }
  return undefined;
}

function parseAmountNearLineLabels(
  items: { str: string; x: number; y: number }[],
  lineNum: 13 | 30 | 31,
): string | undefined {
  const label = new RegExp(`^${lineNum}\\b`);
  const rows = items.filter((it) => label.test(it.str.trim()));
  if (rows.length === 0) return undefined;
  const anchor = rows.reduce((a, b) => (a.x < b.x ? a : b));
  const rowY = anchor.y;
  const tolerance = 6;
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

async function extractViaTextHeuristic(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<ScheduleCExtracted | null> {
  const merged: { str: string; x: number; y: number }[] = [];
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
  const r13 = parseAmountNearLineLabels(merged, 13);
  const r30 = parseAmountNearLineLabels(merged, 30);
  const r31 = parseAmountNearLineLabels(merged, 31);
  if (r13 == null && r30 == null && r31 == null) return null;
  return normalizeExtractedScheduleC({
    box13Raw: r13,
    box30Raw: r30,
    box31Raw: r31,
  });
}

export async function parseScheduleCPdfBytes(
  data: ArrayBuffer,
): Promise<ParseScheduleCResult> {
  try {
    configureWorker();
    const pdf = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
    const fields = await collectAcroFormFieldsAsync(pdf);
    const b13 = firstMatchingField(fields, LINE_13_KEYS);
    const b30 = firstMatchingField(fields, LINE_30_KEYS);
    const b31 = firstMatchingField(fields, LINE_31_KEYS);
    if (b13 != null || b30 != null || b31 != null) {
      return {
        ok: true,
        source: "acroform",
        data: normalizeExtractedScheduleC({
          box13Raw: b13,
          box30Raw: b30,
          box31Raw: b31,
        }),
      };
    }
    const heuristic = await extractViaTextHeuristic(pdf);
    if (heuristic) {
      return { ok: true, source: "text-heuristic", data: heuristic };
    }
    return {
      ok: false,
      error:
        "Could not find Schedule C lines 13, 30, and 31. Try an IRS fillable Schedule C PDF or ensure line numbers are visible in the text layer.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
