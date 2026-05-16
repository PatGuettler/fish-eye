import type { ScheduleCLine } from "./acroFormMatch";
import { extractLastGuardedAmountFromRow } from "./scheduleCAmountGuards";

export type PdfTextItem = { str: string; x: number; y: number };

/**
 * Group text items that share a baseline (PDFs often split "12,345" across spans).
 */
export function clusterItemsIntoRows(
  items: PdfTextItem[],
  yTolerance = 5,
): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PdfTextItem[][] = [];
  for (const it of sorted) {
    let placed = false;
    for (const row of rows) {
      const ref = row[0]!;
      if (Math.abs(it.y - ref.y) <= yTolerance) {
        row.push(it);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([it]);
  }
  for (const row of rows) row.sort((a, b) => a.x - b.x);
  return rows;
}

export function rowsToMergedStrings(rows: PdfTextItem[][]): string[] {
  return rows.map((row) => {
    const cleaned = row
      .map((t) => ({
        x: t.x,
        y: t.y,
        str: t.str.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(),
      }))
      .filter((t) => t.str.length > 0);

    let out = "";
    for (let i = 0; i < cleaned.length; i++) {
      const cur = cleaned[i]!;
      if (i > 0) {
        const prev = cleaned[i - 1]!;
        const estW = Math.max(4, prev.str.length * 6.5);
        const gap = cur.x - prev.x;
        out += gap > Math.max(estW * 1.2, 10) ? " " : "";
      }
      out += cur.str;
    }
    return out.replace(/\s+/g, " ").trim();
  });
}

/** First substring that looks like a Schedule C currency amount. */
export function extractAmountToken(fragment: string): string | undefined {
  const t = fragment.replace(/\u00a0/g, " ").trim();
  if (!t) return undefined;
  const patterns: RegExp[] = [
    /\(\s*\$?\s*[\d,]+\.?\d*\s*\)/,
    /-\s*\(\s*[\d,]+\.?\d*\s*\)/,
    /-?\$?\s*[\d,]+\.?\d*/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) return m[0].replace(/\s+/g, "").trim();
  }
  return undefined;
}

/**
 * From merged horizontal rows (one string per baseline), find the amount for
 * Schedule C line 13 / 30 / 31 (line label may be separated from digits).
 */
export function extractLineAmountFromRows(
  rowStrings: string[],
  line: ScheduleCLine,
): string | undefined {
  const n = line;
  const lineHint = new RegExp(`(?:^|\\s)${n}(?:[a-z])?(?:\\s|[.:])`, "i");
  for (const raw of rowStrings) {
    const row = raw.replace(/\u00a0/g, " ").trim();
    if (!row) continue;
    if (!lineHint.test(row) && !new RegExp(`^${n}\\b`).test(row)) continue;
    const v = extractLastGuardedAmountFromRow(row, line);
    if (v) return v;
  }
  return undefined;
}
