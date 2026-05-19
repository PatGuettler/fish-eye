import type { ScheduleCLine } from "./acroFormMatch";
import { extractLineAmountFromRows } from "./pdfTextRows";
import { extractLastGuardedAmountFromRow } from "./scheduleCAmountGuards";

const SCHEDULE_LINES: ScheduleCLine[] = [13, 30, 31];

/** Strip OCR punctuation artifacts from field values (e.g. "You 13]" → "You 13"). */
export function cleanFieldValue(value: string): string {
  return value
    .replace(/[\]\[(){},;]+$/g, "")
    .replace(/^[\]\[(){},;]+/g, "")
    .replace(/\bvou\b/gi, "You")
    .replace(/\s+/g, " ")
    .trim();
}

/** Printed Schedule C phrases — rows dominated by these are labels, not user entries. */
const LABEL_PHRASES: RegExp[] = [
  /\bschedule\s*c\b/i,
  /\bprofit\s+or\s+loss\s+from\s+business\b/i,
  /\bdepreciation\s+and\s+section\s+179\b/i,
  /\bsection\s+179\b/i,
  /\bform\s+8829\b/i,
  /\bexpenses\s+for\s+business\s+use\s+of\s+(?:your\s+)?home\b/i,
  /\bnet\s+profit\s+or\s*\(?\s*loss\s*\)?/i,
  /\bdepartment\s+of\s+(?:the\s+)?treasury\b/i,
  /\binternal\s+revenue\b/i,
  /\bform\s+1040\b/i,
  /\battach\s+to\s+form\b/i,
  /\bgross\s+receipts\b/i,
  /\bprincipal\s+business\b/i,
  /\bsocial\s+secur/i,
  /\bemployer\s+id\b/i,
];

export function normalizeOcrRowText(row: string): string {
  return row
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bvou\b/gi, "You")
    .trim();
}

export function isLikelyPrintedLabelRow(row: string): boolean {
  const t = normalizeOcrRowText(row);
  if (
    /\bline\s*13\b/i.test(t) &&
    /\b179\b/.test(t) &&
    !/\byou\b/i.test(t)
  ) {
    return true;
  }
  if (t.length > 140) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 14) return true;
  let hits = 0;
  for (const re of LABEL_PHRASES) {
    if (re.test(t)) hits += 1;
  }
  return hits >= 1 && words.length >= 5;
}

function lineNumberTailPattern(line: ScheduleCLine): RegExp {
  const n = line;
  if (n === 13) return /\b(?:13|l3|I3|1\s*3)\s*$/i;
  if (n === 30) return /\b(?:30|3O|3o)\s*$/i;
  return /\b(?:31|3I|3l)\s*$/i;
}

/**
 * Short user-entered text tied to a line number (e.g. "You 13", "ABC 30").
 * Uses row text and line-index patterns only — no fixed coordinates or expected values.
 */
export function extractLineUserInputFromRows(
  rowStrings: readonly string[],
  line: ScheduleCLine,
): string | undefined {
  const n = line;

  for (const raw of rowStrings) {
    const row = normalizeOcrRowText(raw);
    if (!row || isLikelyPrintedLabelRow(row)) continue;
    if (row.length > 48) continue;

    const tailWord = new RegExp(
      `\\b([A-Za-z][A-Za-z0-9'\\-]{0,24}(?:\\s+[A-Za-z][A-Za-z0-9'\\-]{0,24}){0,2})\\s+${n}\\s*$`,
      "i",
    );
    const tailMatch = row.match(tailWord);
    if (tailMatch?.[1]) {
      const candidate = `${tailMatch[1].trim()} ${n}`.replace(/\s+/g, " ");
      if (candidate.length >= 2 && candidate.length <= 48) {
        return cleanFieldValue(candidate);
      }
    }

    if (lineNumberTailPattern(line).test(row)) {
      const before = row.replace(lineNumberTailPattern(line), "").trim();
      const tokens = before.split(/\s+/).filter(Boolean);
      if (tokens.length >= 1 && tokens.length <= 4) {
        const prefix = tokens.slice(-3).join(" ");
        if (prefix.length >= 2 && !isLikelyPrintedLabelRow(prefix)) {
          return cleanFieldValue(`${prefix} ${n}`.replace(/\s+/g, " "));
        }
      }
    }
  }

  for (const raw of rowStrings) {
    const row = normalizeOcrRowText(raw);
    if (isLikelyPrintedLabelRow(row)) continue;
    const head = new RegExp(`^${n}\\b\\s*(.+)$`, "i");
    const m = row.match(head);
    if (!m?.[1]) continue;
    const rest = m[1].trim();
    if (!rest || isLikelyPrintedLabelRow(rest)) continue;

    const money = extractLastGuardedAmountFromRow(rest, line);
    if (money) return money;

    const short = pickShortFieldValue(rest);
    if (short) return cleanFieldValue(short);
  }

  return undefined;
}

function pickShortFieldValue(fragment: string): string | undefined {
  const t = fragment.replace(/\s+/g, " ").trim();
  if (!t || t.length > 56) return undefined;
  if (isLikelyPrintedLabelRow(t)) return undefined;
  if (/^\d{1,2}\s*$/.test(t)) return undefined;

  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length > 6) return undefined;

  if (/[A-Za-z]/.test(t) && parts.length <= 4) {
    return t;
  }

  if (parts.length === 1 && /^[A-Za-z0-9][A-Za-z0-9'\\-]{1,20}$/.test(parts[0]!)) {
    return parts[0]!;
  }

  return undefined;
}

/** User-entered field text first; currency only on non-label rows (matches PDF priority). */
export function extractScheduleCLineValuesFromRows(
  rowStrings: readonly string[],
): Partial<Record<ScheduleCLine, string>> {
  const rows = [...rowStrings];
  const out: Partial<Record<ScheduleCLine, string>> = {};

  for (const line of SCHEDULE_LINES) {
    const user = extractLineUserInputFromRows(rows, line);
    if (user) {
      out[line] = cleanFieldValue(user);
      continue;
    }
    const amount = extractLineAmountFromRowsSkippingLabels(rows, line);
    if (amount) out[line] = amount;
  }

  return out;
}

/** Row-based currency extraction that ignores printed form label lines. */
export function extractLineAmountFromRowsSkippingLabels(
  rowStrings: readonly string[],
  line: ScheduleCLine,
): string | undefined {
  const filtered = rowStrings.filter(
    (r) => !isLikelyPrintedLabelRow(normalizeOcrRowText(r)),
  );
  return extractLineAmountFromRows([...filtered], line);
}
