import type { ScheduleCLine } from "./acroFormMatch";
import {
  cleanFieldValue,
  extractLineAmountFromRowsSkippingLabels,
  extractLineUserInputFromRows,
} from "./formLineValues";
import type { OcrWordLike } from "./ocrPageRows";
import { parseAmountForLineFromPageItems } from "./scheduleCLayoutExtract";
import type { PdfTextItem } from "./pdfTextRows";
import {
  clusterItemsIntoRows,
  rowsToMergedStrings,
} from "./pdfTextRows";

function rowStringsFromWords(words: readonly OcrWordLike[]): string[] {
  const items: PdfTextItem[] = words.map((w) => ({
    str: w.text,
    x: w.x,
    y: w.y,
  }));
  if (!items.length) return [];
  return rowsToMergedStrings(clusterItemsIntoRows(items, 8));
}

/**
 * Schedule C line values from OCR word geometry (same left-label / right-value
 * idea as PDF layout extraction).
 */
export function extractScheduleCLineValuesFromOcrWords(
  words: readonly OcrWordLike[],
  rowStrings: readonly string[],
): Partial<Record<ScheduleCLine, string>> {
  const items: PdfTextItem[] = words.map((w) => ({
    str: w.text,
    x: w.x,
    y: w.y,
  }));
  const pageWidth = Math.max(
    1,
    ...items.map((it) => it.x + Math.max(4, it.str.length * 7)),
  );
  const spatialRows = rowStringsFromWords(words);
  const rows = [...rowStrings, ...spatialRows];

  const out: Partial<Record<ScheduleCLine, string>> = {};
  for (const line of [13, 30, 31] as const) {
    const user =
      extractLineUserInputFromRows(rows, line) ??
      extractLineUserInputFromRows(spatialRows, line);
    if (user) {
      out[line] = cleanFieldValue(user);
      continue;
    }

    const layout = parseAmountForLineFromPageItems(items, pageWidth, line);
    if (layout) {
      out[line] = layout;
      continue;
    }

    const amount = extractLineAmountFromRowsSkippingLabels(rows, line);
    if (amount) out[line] = amount;
  }
  return out;
}
