import type { DocumentFormatKind } from "../core/DocumentFormatKind";
import { DocumentFormatParser } from "../core/DocumentFormatParser";
import type { ParsedDocumentContent } from "../core/ParsedDocumentContent";
import type { FormatParseOutcome } from "../core/types";

/** Placeholder format parser until a format is implemented. */
export class NotImplementedFormatParser extends DocumentFormatParser {
  constructor(
    override readonly kind: DocumentFormatKind,
    private readonly formatLabel: string,
  ) {
    super();
  }

  override async parse(
    _bytes: ArrayBuffer,
  ): Promise<FormatParseOutcome<ParsedDocumentContent>> {
    return {
      ok: false,
      error: `${this.formatLabel} parsing is not implemented yet.`,
    };
  }
}
