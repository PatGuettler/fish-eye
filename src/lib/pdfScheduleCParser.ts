import { DocumentParser } from "../parser/core/DocumentParser";
import { PdfDocumentFormatParser } from "../parser/format/pdf/PdfDocumentFormatParser";
import { collectAcroFormFieldsFromPdf } from "../parser/format/pdf/pdfAcroForm";
import { collectTextRowStringsFromPdf } from "../parser/format/pdf/pdfTextContent";
import {
  ScheduleCDocumentFlavor,
  type ParseScheduleCResult,
} from "../parser/flavor/scheduleC/ScheduleCDocumentFlavor";

export type { ParseScheduleCResult };

export { collectAcroFormFieldsFromPdf, collectTextRowStringsFromPdf };

const scheduleCPdfParser = new DocumentParser(
  new PdfDocumentFormatParser(),
  new ScheduleCDocumentFlavor(),
);

export async function parseScheduleCPdfBytes(
  data: ArrayBuffer,
): Promise<ParseScheduleCResult> {
  return scheduleCPdfParser.parse(data);
}
