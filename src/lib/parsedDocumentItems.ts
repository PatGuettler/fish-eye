import type { ScheduleCBoxRaw } from "./scheduleCExtract";
import type { ParsedDocumentItem } from "../parser/core/types";
import { buildScheduleCParsedDocumentItems } from "../parser/flavor/scheduleC/scheduleCParsedItems";

export type { ParsedDocumentItem };

/**
 * Build draggable chips from the full PDF: highlighted Schedule C lines first,
 * then fillable fields, then text-layer rows (deduped).
 */
export function buildParsedDocumentItems(
  fields: Map<string, string>,
  rowStrings: string[],
  raw: ScheduleCBoxRaw,
): ParsedDocumentItem[] {
  return buildScheduleCParsedDocumentItems(fields, rowStrings, raw);
}
