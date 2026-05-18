import type { DocumentFormatKind } from "./DocumentFormatKind";
import type { ParsedDocumentContent } from "./ParsedDocumentContent";
import type { FormatParseOutcome } from "./types";

/** Reads bytes for a document format and produces normalized {@link ParsedDocumentContent}. */
export abstract class DocumentFormatParser {
  abstract readonly kind: DocumentFormatKind;

  abstract parse(bytes: ArrayBuffer): Promise<FormatParseOutcome<ParsedDocumentContent>>;
}
