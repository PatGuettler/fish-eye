import { parseScheduleCDocument } from "./parseScheduleCDocument";
import { collectAcroFormFieldsFromPdf } from "../parser/format/pdf/pdfAcroForm";
import { collectTextRowStringsFromPdf } from "../parser/format/pdf/pdfTextContent";
import type { ParseScheduleCResult } from "../parser/flavor/scheduleC/ScheduleCDocumentFlavor";

export type { ParseScheduleCResult };

export { collectAcroFormFieldsFromPdf, collectTextRowStringsFromPdf };

/** @deprecated Prefer {@link parseScheduleCDocument} with format detection. */
export async function parseScheduleCPdfBytes(
  data: ArrayBuffer,
): Promise<ParseScheduleCResult> {
  return parseScheduleCDocument(data, "pdf");
}
