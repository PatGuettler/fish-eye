import type * as pdfjs from "pdfjs-dist";
import type { ScheduleCLine } from "./acroFormMatch";
import {
  extractLastGuardedAmountFromRow,
  guardScheduleCAmount,
  looksLikeMoneySpan,
} from "./scheduleCAmountGuards";
import {
  clusterItemsIntoRows,
  rowsToMergedStrings,
  type PdfTextItem,
} from "./pdfTextRows";

export async function collectPageViewportItems(
  page: pdfjs.PDFPageProxy,
): Promise<{ items: PdfTextItem[]; width: number }> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const items: PdfTextItem[] = [];
  for (const raw of content.items) {
    const it = raw as { str?: string; transform?: number[] };
    if (!it.str || !it.transform || it.transform.length < 6) continue;
    const [vx, vy] = viewport.convertToViewportPoint(
      it.transform[4],
      it.transform[5],
    );
    items.push({ str: it.str, x: vx, y: vy });
  }
  return { items, width: viewport.width };
}

/**
 * Uses line labels in the left column and currency spans in the right column
 * (typical IRS Schedule C layout) to avoid "179" from "section 179", etc.
 */
export function parseAmountForLineFromPageItems(
  items: PdfTextItem[],
  pageWidth: number,
  lineNum: ScheduleCLine,
): string | undefined {
  const label = new RegExp(`^${lineNum}\\b`);
  const labelMaxX = pageWidth * 0.36;
  const amountMinX = pageWidth * 0.41;

  const anchors = items.filter(
    (it) => label.test(it.str.trim()) && it.x <= labelMaxX + 40,
  );
  if (!anchors.length) return undefined;
  const anchor = anchors.reduce((a, b) => (a.x < b.x ? a : b));
  const rowY = anchor.y;
  const tol = 7;

  const rowContext = items
    .filter((it) => Math.abs(it.y - rowY) <= tol)
    .sort((a, b) => a.x - b.x)
    .map((it) => it.str)
    .join(" ");

  const rightItems = items.filter(
    (it) => Math.abs(it.y - rowY) <= tol && it.x >= amountMinX,
  );

  if (rightItems.length > 0) {
    const clusters = clusterItemsIntoRows(rightItems, tol);
    clusters.sort(
      (a, b) =>
        Math.max(...b.map((i) => i.x)) - Math.max(...a.map((i) => i.x)),
    );
    for (const cluster of clusters) {
      const merged = rowsToMergedStrings([cluster])[0];
      if (!merged) continue;
      const g = guardScheduleCAmount(lineNum, merged, rowContext);
      if (g) return g;
    }

    const moneyItems = rightItems.filter((it) =>
      looksLikeMoneySpan(it.str.trim()),
    );
    moneyItems.sort((a, b) => b.x - a.x);
    for (const it of moneyItems) {
      const g = guardScheduleCAmount(lineNum, it.str.trim(), rowContext);
      if (g) return g;
    }
  }

  return extractLastGuardedAmountFromRow(rowContext, lineNum);
}
