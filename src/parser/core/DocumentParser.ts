import type { DocumentFormatParser } from "./DocumentFormatParser";
import type { DocumentFlavor } from "./DocumentFlavor";
import type { FormatParseFailure, FlavorParseOutcome } from "./types";

/**
 * Composes a {@link DocumentFormatParser} with a {@link DocumentFlavor}
 * (e.g. PDF bytes + Schedule C interpretation).
 */
export class DocumentParser<
  TData = unknown,
  TRaw = unknown,
> {
  constructor(
    private readonly formatParser: DocumentFormatParser,
    private readonly flavor: DocumentFlavor<TData, TRaw>,
  ) {}

  get formatKind() {
    return this.formatParser.kind;
  }

  get flavorId() {
    return this.flavor.flavorId;
  }

  async parse(bytes: ArrayBuffer): Promise<FlavorParseOutcome<TData, TRaw> | FormatParseFailure> {
    if (!this.flavor.supportsFormat(this.formatParser.kind)) {
      return {
        ok: false,
        error: `Flavor "${this.flavor.flavorId}" does not support format "${this.formatParser.kind}".`,
      };
    }

    const formatResult = await this.formatParser.parse(bytes);
    if (!formatResult.ok) {
      return formatResult;
    }

    return this.flavor.parse(formatResult.content);
  }
}
