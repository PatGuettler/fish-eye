import type { ScheduleCBoxRaw } from "../../../lib/scheduleCExtract";
import type { ParsedDocumentItem } from "../../core/types";

const HIGHLIGHT_KEYS: { label: string; key: keyof ScheduleCBoxRaw }[] = [
  { label: "Line 13 — Depreciation", key: "box13" },
  { label: "Line 30 — Business use of home", key: "box30" },
  { label: "Line 31 — Net profit or (loss)", key: "box31" },
];

function humanizeFieldName(name: string): string {
  const trimmed = name.trim();
  const leaf = trimmed.split(/[[\].]/).filter(Boolean).pop() ?? trimmed;
  if (leaf.length <= 48) return leaf;
  return `${leaf.slice(0, 45)}…`;
}

function itemId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80)}`;
}

/** Prefer widget-style AcroForm names (e.g. f1_22[0]) over short alias keys. */
function isPrimaryAcroFieldName(name: string): boolean {
  return /\[\d*\]$/.test(name.trim());
}

/**
 * Build draggable chips from the full PDF: highlighted Schedule C lines first,
 * then fillable fields, then text-layer rows (deduped).
 */
export function buildScheduleCParsedDocumentItems(
  fields: Map<string, string>,
  rowStrings: readonly string[],
  raw: ScheduleCBoxRaw,
): ParsedDocumentItem[] {
  const items: ParsedDocumentItem[] = [];
  const seenValues = new Set<string>();

  const push = (id: string, label: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    const key = `${label}\0${v}`;
    if (seenValues.has(key)) return;
    seenValues.add(key);
    items.push({ id, label, value: v });
  };

  for (const { label, key } of HIGHLIGHT_KEYS) {
    push(itemId("line", key), label, raw[key]);
  }

  const acroNames = [...fields.keys()].filter(isPrimaryAcroFieldName).sort();
  for (const name of acroNames) {
    const val = fields.get(name);
    if (val == null) continue;
    push(itemId("acro", name), humanizeFieldName(name), String(val));
  }

  for (const [name, val] of fields) {
    if (isPrimaryAcroFieldName(name)) continue;
    if (val == null || String(val).trim() === "") continue;
    if (name.split(/[[\].]/).filter(Boolean).length < 2) continue;
    push(itemId("field", name), humanizeFieldName(name), String(val));
  }

  let rowIdx = 0;
  for (const row of rowStrings) {
    const t = row.replace(/\s+/g, " ").trim();
    if (t.length < 2) continue;
    if (t.length > 240) continue;
    const preview = t.length > 56 ? `${t.slice(0, 53)}…` : t;
    push(itemId("text", `r${rowIdx++}`), preview, t);
  }

  return items;
}
