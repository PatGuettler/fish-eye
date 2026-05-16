import type { ScheduleCLine } from "./acroFormMatch";

/**
 * Official IRS f1040sc.pdf AcroForm widget suffixes per Schedule C line.
 * Field ids (e.g. f1_22) do not match line numbers (e.g. line 13).
 */
const LINE_FIELD_PATTERNS: Record<ScheduleCLine, RegExp[]> = {
  13: [/f1_22\[\d+\]$/i, /f1_13\[\d+\]$/i, /f2_13\[\d+\]$/i],
  30: [/f1_45\[\d+\]$/i, /f1_30\[\d+\]$/i, /f2_30\[\d+\]$/i],
  31: [/f1_46\[\d+\]$/i, /f1_31\[\d+\]$/i, /f2_31\[\d+\]$/i],
};

/** Read fillable values using IRS f1040sc field-id → line mapping. */
export function findIrsF1040scFieldValues(
  fields: Map<string, string>,
): Partial<Record<ScheduleCLine, string>> {
  const out: Partial<Record<ScheduleCLine, string>> = {};
  for (const line of [13, 30, 31] as const) {
    for (const re of LINE_FIELD_PATTERNS[line]) {
      for (const [name, val] of fields) {
        if (!re.test(name.trim())) continue;
        if (val == null || String(val).trim() === "") continue;
        out[line] = String(val);
        break;
      }
      if (out[line] !== undefined) break;
    }
  }
  return out;
}
