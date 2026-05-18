import { DocumentFlavor } from "../core/DocumentFlavor";
import type { DocumentFormatKind } from "../core/DocumentFormatKind";
import type { ParsedDocumentContent } from "../core/ParsedDocumentContent";
import type { FlavorParseOutcome } from "../core/types";

/** Placeholder flavor until interpretation logic is implemented. */
export class NotImplementedDocumentFlavor extends DocumentFlavor {
  constructor(
    override readonly flavorId: string,
    override readonly supportedFormats: readonly DocumentFormatKind[],
    private readonly flavorLabel: string,
  ) {
    super();
  }

  override async parse(
    _content: ParsedDocumentContent,
  ): Promise<FlavorParseOutcome> {
    return {
      ok: false,
      error: `${this.flavorLabel} flavor is not implemented yet.`,
    };
  }
}
