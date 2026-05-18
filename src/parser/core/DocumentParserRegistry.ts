import type { DocumentFormatKind } from "./DocumentFormatKind";
import { DocumentParser } from "./DocumentParser";
import type { DocumentFormatParser } from "./DocumentFormatParser";
import type { DocumentFlavor } from "./DocumentFlavor";

/** Registers format parsers and flavors for composition via {@link DocumentParser}. */
export class DocumentParserRegistry {
  private readonly formatParsers = new Map<DocumentFormatKind, DocumentFormatParser>();
  private readonly flavors = new Map<string, DocumentFlavor>();

  registerFormatParser(parser: DocumentFormatParser): this {
    this.formatParsers.set(parser.kind, parser);
    return this;
  }

  registerFlavor(flavor: DocumentFlavor): this {
    this.flavors.set(flavor.flavorId, flavor);
    return this;
  }

  getFormatParser(kind: DocumentFormatKind): DocumentFormatParser | undefined {
    return this.formatParsers.get(kind);
  }

  getFlavor(flavorId: string): DocumentFlavor | undefined {
    return this.flavors.get(flavorId);
  }

  createParser(
    formatKind: DocumentFormatKind,
    flavorId: string,
  ): DocumentParser | undefined {
    const formatParser = this.formatParsers.get(formatKind);
    const flavor = this.flavors.get(flavorId);
    if (!formatParser || !flavor) {
      return undefined;
    }
    return new DocumentParser(formatParser, flavor);
  }

  listFormatKinds(): DocumentFormatKind[] {
    return [...this.formatParsers.keys()];
  }

  listFlavorIds(): string[] {
    return [...this.flavors.keys()];
  }
}
