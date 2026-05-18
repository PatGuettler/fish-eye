import type * as pdfjs from "pdfjs-dist";
import {
  isImageParsedContent,
  isPdfParsedContent,
  type ParsedDocumentContent,
} from "../../core/ParsedDocumentContent";

/** Shared input for Schedule C extraction regardless of PDF vs image source. */
export type ScheduleCTextSurface = {
  readonly rowStrings: readonly string[];
  readonly fields: ReadonlyMap<string, string>;
  readonly pdf?: pdfjs.PDFDocumentProxy;
  /** True when rowStrings already came from OCR (skip PDF OCR pass). */
  readonly ocrAlreadyApplied: boolean;
};

export function scheduleCTextSurfaceFromContent(
  content: ParsedDocumentContent,
): ScheduleCTextSurface | { readonly error: string } {
  if (isPdfParsedContent(content)) {
    return {
      rowStrings: content.rowStrings,
      fields: content.fields,
      pdf: content.pdf,
      ocrAlreadyApplied: false,
    };
  }
  if (isImageParsedContent(content)) {
    return {
      rowStrings: content.rowStrings,
      fields: new Map(),
      ocrAlreadyApplied: true,
    };
  }
  return { error: "Unsupported document content for Schedule C." };
}
