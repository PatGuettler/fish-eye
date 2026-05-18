import type { DocumentFormatKind } from "./DocumentFormatKind";
import type { ParsedDocumentContent } from "./ParsedDocumentContent";
import type { FlavorParseOutcome } from "./types";

/** Interprets {@link ParsedDocumentContent} for a specific document type (Schedule C, generic, etc.). */
export abstract class DocumentFlavor<
  TData = unknown,
  TRaw = unknown,
> {
  abstract readonly flavorId: string;

  abstract readonly supportedFormats: readonly DocumentFormatKind[];

  supportsFormat(kind: DocumentFormatKind): boolean {
    return this.supportedFormats.includes(kind);
  }

  abstract parse(
    content: ParsedDocumentContent,
  ): Promise<FlavorParseOutcome<TData, TRaw>>;
}
