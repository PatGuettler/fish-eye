import type * as pdfjs from "pdfjs-dist";

export type PdfFieldMap = Map<string, string>;

export async function collectAcroFormFieldsFromPdf(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<PdfFieldMap> {
  const map = new Map<string, string>();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const annotations = await page.getAnnotations({ intent: "display" });
    for (const a of annotations) {
      const subtype = (a as { subtype?: string }).subtype;
      if (subtype !== "Widget") continue;
      const fieldName = String(
        (a as { fieldName?: string }).fieldName ?? "",
      ).trim();
      if (!fieldName) continue;
      const fieldValue = (a as { fieldValue?: string | null }).fieldValue;
      const v =
        fieldValue == null || fieldValue === ""
          ? ""
          : String(fieldValue);
      map.set(fieldName, v);
      const short = fieldName.split(/[[\].]/).pop();
      if (
        short &&
        short !== fieldName &&
        !/^\d+$/.test(short) &&
        short.length > 1
      ) {
        map.set(short, v);
      }
    }
  }
  return map;
}
