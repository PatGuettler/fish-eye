import { DocumentFormatParser } from "../../core/DocumentFormatParser";
import type { PdfParsedContent } from "../../core/ParsedDocumentContent";
import type { FormatParseOutcome } from "../../core/types";
import { collectAcroFormFieldsFromPdf } from "./pdfAcroForm";
import { collectTextRowStringsFromPdf } from "./pdfTextContent";
import { loadPdfDocument } from "./pdfWorker";

export class PdfDocumentFormatParser extends DocumentFormatParser {
  override readonly kind = "pdf" as const;

  override async parse(bytes: ArrayBuffer): Promise<FormatParseOutcome<PdfParsedContent>> {
    try {
      const pdf = await loadPdfDocument(bytes);
      const fields = await collectAcroFormFieldsFromPdf(pdf);
      const rowStrings = await collectTextRowStringsFromPdf(pdf);
      return {
        ok: true,
        content: {
          kind: "pdf",
          fields,
          rowStrings,
          pdf,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}
