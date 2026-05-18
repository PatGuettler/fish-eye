import type * as pdfjs from "pdfjs-dist";
import type { DocumentFormatKind } from "./DocumentFormatKind";

/** Normalized output of a format parser (transport layer). */
export type PdfParsedContent = {
  readonly kind: "pdf";
  readonly fields: ReadonlyMap<string, string>;
  readonly rowStrings: readonly string[];
  readonly pdf: pdfjs.PDFDocumentProxy;
};

export type ParsedDocumentContent = PdfParsedContent;

export function isPdfParsedContent(
  content: ParsedDocumentContent,
): content is PdfParsedContent {
  return content.kind === "pdf";
}

export function contentFormatKind(content: ParsedDocumentContent): DocumentFormatKind {
  return content.kind;
}
