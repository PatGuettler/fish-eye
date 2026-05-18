import type * as pdfjs from "pdfjs-dist";
import {
  clusterItemsIntoRows,
  type PdfTextItem,
  rowsToMergedStrings,
} from "../../../lib/pdfTextRows";

export async function collectTextRowStringsFromPdf(
  pdf: pdfjs.PDFDocumentProxy,
): Promise<string[]> {
  const rowStrings: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pageItems: PdfTextItem[] = [];
    for (const raw of content.items) {
      const it = raw as { str?: string; transform?: number[] };
      if (!it.str || !it.transform || it.transform.length < 6) continue;
      const [vx, vy] = viewport.convertToViewportPoint(
        it.transform[4],
        it.transform[5],
      );
      pageItems.push({ str: it.str, x: vx, y: vy });
    }
    const clusters = clusterItemsIntoRows(pageItems, 5);
    rowStrings.push(...rowsToMergedStrings(clusters));
  }
  return rowStrings;
}
