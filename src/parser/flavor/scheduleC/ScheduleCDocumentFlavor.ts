import type * as pdfjs from "pdfjs-dist";
import { extractScheduleCAcroValues } from "../../../lib/acroFormMatch";
import type { ScheduleCLine } from "../../../lib/acroFormMatch";
import { extractLinesFromOcrRows, ocrPdfToLineStrings } from "../../../lib/ocrExtract";
import { extractLineAmountFromRows } from "../../../lib/pdfTextRows";
import {
  collectPageViewportItems,
  parseAmountForLineFromPageItems,
} from "../../../lib/scheduleCLayoutExtract";
import {
  normalizeExtractedScheduleC,
  type ScheduleCBoxRaw,
  type ScheduleCExtracted,
} from "../../../lib/scheduleCExtract";
import type { DocumentFormatKind } from "../../core/DocumentFormatKind";
import { DocumentFlavor } from "../../core/DocumentFlavor";
import {
  isPdfParsedContent,
  type ParsedDocumentContent,
} from "../../core/ParsedDocumentContent";
import type { FlavorParseOutcome, ParsedDocumentItem } from "../../core/types";
import { buildScheduleCParsedDocumentItems } from "./scheduleCParsedItems";

export type ParseScheduleCResult =
  | {
      ok: true;
      data: ScheduleCExtracted;
      raw: ScheduleCBoxRaw;
      source: string;
      items: ParsedDocumentItem[];
    }
  | { ok: false; error: string };

export class ScheduleCDocumentFlavor extends DocumentFlavor<
  ScheduleCExtracted,
  ScheduleCBoxRaw
> {
  override readonly flavorId = "schedule-c";

  override readonly supportedFormats: readonly DocumentFormatKind[] = ["pdf"];

  override async parse(
    content: ParsedDocumentContent,
  ): Promise<FlavorParseOutcome<ScheduleCExtracted, ScheduleCBoxRaw>> {
    if (!isPdfParsedContent(content)) {
      return {
        ok: false,
        error: "Schedule C flavor requires PDF document content.",
      };
    }

    try {
      const { pdf, fields, rowStrings } = content;
      const fieldMap = new Map(fields);
      const acro = extractScheduleCAcroValues(fieldMap);
      const layout = await extractViaLayout(pdf);
      const merged = extractViaMergedRows(rowStrings);

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

      const items = buildScheduleCParsedDocumentItems(fieldMap, rowStrings, raw);

      const sources: string[] = [];
      if ([13, 30, 31].some((l) => l in acro)) sources.push("acroform");
      if ([13, 30, 31].some((l) => l in layout)) sources.push("layout");
      if ([13, 30, 31].some((l) => l in merged)) sources.push("text-rows");
      if ([13, 30, 31].some((l) => l in ocr)) sources.push("ocr");
      const source = sources.length > 0 ? sources.join("+") : "unknown";

      if ([r13, r30, r31].every((v) => v === undefined) && items.length === 0) {
        return {
          ok: false,
          error:
            "Could not read any values from this PDF. Use the official IRS fillable Schedule C, a PDF with a text layer, or a clearer scan — OCR ran in-browser but may still miss values on complex layouts.",
        };
      }

      return { ok: true, data: dataOut, raw, source, items };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
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

function extractViaMergedRows(
  rowStrings: readonly string[],
): Partial<Record<ScheduleCLine, string>> {
  const out: Partial<Record<ScheduleCLine, string>> = {};
  const rows = [...rowStrings];
  for (const line of [13, 30, 31] as const) {
    const v = extractLineAmountFromRows(rows, line);
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
