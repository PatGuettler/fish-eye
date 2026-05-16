/**
 * Score PDF AcroForm field names against Schedule C line numbers (13, 30, 31).
 * IRS / preparer software uses many naming schemes; we prefer explicit f1_13[0] patterns.
 */
export type ScheduleCLine = 13 | 30 | 31;

/** True if `n` appears as its own line index (not 113, 130, etc.). */
function hasIsolatedLineNumber(name: string, n: ScheduleCLine): boolean {
  const re = new RegExp(`(^|[^0-9])${n}([^0-9]|$|\\[)`, "i");
  return re.test(name);
}

export function scoreFieldNameForLine(name: string, line: ScheduleCLine): number {
  const raw = name.trim();
  if (!raw || !hasIsolatedLineNumber(raw, line)) return 0;

  const lower = raw.toLowerCase().replace(/\s+/g, "");
  const n = String(line);

  let score = 0;
  if (new RegExp(`f\\d+_${n}[a-z]?\\[`, "i").test(raw)) score = 120;
  else if (new RegExp(`f\\d+_${n}[a-z]?\\b`, "i").test(raw)) score = 115;
  else if (new RegExp(`c\\d+_${n}[a-z]?\\[`, "i").test(raw)) score = 112;
  else if (new RegExp(`c\\d+_${n}[a-z]?\\b`, "i").test(raw)) score = 108;
  else if (new RegExp(`_${n}\\[0?\\]`, "i").test(raw)) score = 105;
  else if (new RegExp(`line[_\\s]?${n}([^0-9]|$)`, "i").test(raw)) score = 95;
  else if (new RegExp(`^l_?${n}$`, "i").test(raw)) score = 92;
  else if (new RegExp(`p\\d+_t${n}\\b`, "i").test(raw)) score = 88;
  else if (new RegExp(`topmostsubform.*${n}([^0-9]|\\[|$)`, "i").test(raw))
    score = 82;
  else if (new RegExp(`schedulec.*${n}([^0-9]|\\[|$)`, "i").test(raw)) score = 78;
  else if (new RegExp(`[.#_]${n}\\[`, "i").test(raw)) score = 100;
  else if (new RegExp(`[.#_]${n}$`, "i").test(lower)) score = 58;
  else if (new RegExp(`\\b${n}[a-z]\\b`, "i").test(raw)) score = 45;

  return score;
}

const LINES: ScheduleCLine[] = [13, 30, 31];

export function findBestAcroValues(
  fields: Map<string, string>,
  minScore = 55,
): Partial<Record<ScheduleCLine, string>> {
  const out: Partial<Record<ScheduleCLine, string>> = {};
  for (const line of LINES) {
    let bestScore = 0;
    let bestVal: string | undefined;
    let bestName = "";
    for (const [name, val] of fields) {
      const s = scoreFieldNameForLine(name, line);
      if (s > bestScore) {
        bestScore = s;
        bestVal = val;
        bestName = name;
      } else if (s === bestScore && s > 0 && name.length < bestName.length) {
        bestVal = val;
        bestName = name;
      }
    }
    if (bestScore >= minScore) out[line] = bestVal ?? "";
  }
  return out;
}
