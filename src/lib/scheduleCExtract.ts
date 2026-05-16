/**
 * Normalizes Schedule C box values per POC rules (Boxes 13, 30, 31).
 * Blank → 0; "0" → 0; positive/negative → exact numeric value.
 */
export function normalizeScheduleCBoxValue(raw: string | null | undefined): number {
  if (raw == null) return 0;
  const trimmed = raw.replace(/\u00a0/g, " ").trim();
  if (trimmed === "") return 0;

  // IRS PDFs often use parentheses for negatives
  const parenNeg = /^\(\s*([\d,.\s]+)\s*\)$/.exec(trimmed);
  const normalized = parenNeg
    ? `-${parenNeg[1].replace(/,/g, "").trim()}`
    : trimmed.replace(/,/g, "").replace(/\s+/g, "");

  const n = Number(normalized);
  if (Number.isFinite(n)) return n;
  return 0;
}

export const BOX13_FORM_4562_THRESHOLD = 10_000;

export function box13RequiresForm4562(box13Amount: number): boolean {
  return box13Amount >= BOX13_FORM_4562_THRESHOLD;
}

export const FORM_4562_MESSAGE =
  "Box 13 exceeds $10,000. An IRS Form 4562 is required. Please request or upload Form 4562.";

export type ScheduleCExtracted = {
  box13: number;
  box30: number;
  box31: number;
};

export function normalizeExtractedScheduleC(input: {
  box13Raw: string | null | undefined;
  box30Raw: string | null | undefined;
  box31Raw: string | null | undefined;
}): ScheduleCExtracted {
  return {
    box13: normalizeScheduleCBoxValue(input.box13Raw),
    box30: normalizeScheduleCBoxValue(input.box30Raw),
    box31: normalizeScheduleCBoxValue(input.box31Raw),
  };
}
