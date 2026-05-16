import type { ScheduleCLine } from "./acroFormMatch";

/** IRS / instruction numbers that are not dollar amounts on Schedule C. */
const FORBIDDEN_AMOUNT_INTEGERS = new Set([
  1040, 1099, 2848, 3800, 4562, 4684, 4797, 8829, 941, 4506, 9465, 1120, 1065,
  2555, 4868, 7004,
]);

/**
 * Reject obvious non-amount tokens; use row text to disambiguate "179" in
 * "section 179" vs a real dollar field.
 */
export function guardScheduleCAmount(
  line: ScheduleCLine,
  raw: string,
  rowContext: string,
): string | undefined {
  const t = raw.replace(/\u00a0/g, " ").trim();
  if (!t) return undefined;

  const paren = /^\(\s*([\d,.\s]+)\s*\)$/.exec(t);
  const compact = paren
    ? `-${paren[1].replace(/,/g, "").trim()}`
    : t.replace(/,/g, "").replace(/^\$/, "").replace(/\s/g, "");
  const n = Number(compact);
  if (!Number.isFinite(n)) return undefined;

  const intMag = Math.round(Math.abs(n));
  if (FORBIDDEN_AMOUNT_INTEGERS.has(intMag)) return undefined;

  if (line === 13) {
    if (intMag === 179 && /\bsection\s+179\b/i.test(rowContext)) return undefined;
  }

  if (line === 30) {
    if (intMag === 8829) return undefined;
  }

  if (line === 31) {
    const ctx = rowContext.toLowerCase();
    if (
      intMag === 30 &&
      !/[,.]/.test(t) &&
      /\b30\b.*expenses for business use of your home/i.test(ctx)
    )
      return undefined;
    if (intMag === 31 && !/[,.]/.test(t)) return undefined;
  }

  return t;
}

/** True if a text span plausibly represents a currency number. */
export function looksLikeMoneySpan(s: string): boolean {
  const t = s.replace(/\u00a0/g, " ").trim();
  if (!t || t.length > 24) return false;
  if (/^[a-z]+$/i.test(t)) return false;
  return (
    /^\(\s*[\d,]+\.?\d*\s*\)$/.test(t) ||
    /^-?\$?\s*[\d,]+\.?\d*$/.test(t.replace(/\s/g, ""))
  );
}

/** Prefer the rightmost money-like token on a row that passes guards. */
export function extractLastGuardedAmountFromRow(
  row: string,
  line: ScheduleCLine,
): string | undefined {
  type Hit = { s: string; end: number };
  const hits: Hit[] = [];
  const patterns = [
    /\(\s*[\d,]+\.?\d*\s*\)/g,
    /-?\$?\s*[\d,]+\.\d{2}\b/g,
    /-?\$?\s*(?:\d{1,3}(?:,\d{3})+|\d{3,})(?:\.\d+)?\b/g,
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(row)) !== null) {
      hits.push({ s: m[0], end: m.index + m[0].length });
    }
  }
  hits.sort((a, b) => b.end - a.end);
  for (const h of hits) {
    const g = guardScheduleCAmount(line, h.s, row);
    if (g) return g;
  }
  return undefined;
}
