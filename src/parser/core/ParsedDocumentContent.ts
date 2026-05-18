import type * as pdfjs from "pdfjs-dist";
import type { DocumentFormatKind } from "./DocumentFormatKind";

/** Normalized output of a PDF format parser. */
export type PdfParsedContent = {
  readonly kind: "pdf";
  readonly fields: ReadonlyMap<string, string>;
  readonly rowStrings: readonly string[];
  readonly pdf: pdfjs.PDFDocumentProxy;
};

/** Normalized output of a JPEG format parser (OCR text lines). */
export type ImageParsedContent = {
  readonly kind: "jpeg";
  readonly rowStrings: readonly string[];
  readonly width: number;
  readonly height: number;
};

export type ParsedDocumentContent = PdfParsedContent | ImageParsedContent;

export function isPdfParsedContent(
  content: ParsedDocumentContent,
): content is PdfParsedContent {
  return content.kind === "pdf";
}

export function isImageParsedContent(
  content: ParsedDocumentContent,
): content is ImageParsedContent {
  return content.kind === "jpeg";
}

export function contentFormatKind(content: ParsedDocumentContent): DocumentFormatKind {
  return content.kind;
}
