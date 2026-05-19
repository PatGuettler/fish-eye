import {
  clusterItemsIntoRows,
  rowsToMergedStrings,
  type PdfTextItem,
} from "./pdfTextRows";

export type OcrWordLike = {
  text: string;
  x: number;
  y: number;
  confidence: number;
};

type BboxLike = { x0: number; y0: number; x1: number; y1: number };

type LineLike = { text?: string; bbox?: BboxLike };
type WordLike = { text?: string; bbox?: BboxLike; confidence?: number };
type PageLike = {
  text?: string;
  lines?: LineLike[];
  words?: WordLike[];
  blocks?: { lines?: LineLike[]; paragraphs?: { lines?: LineLike[] }[] }[];
};

function wordsFromPage(page: PageLike): OcrWordLike[] {
  const out: OcrWordLike[] = [];
  const pushWord = (w: WordLike) => {
    const text = w.text?.trim();
    if (!text || !w.bbox) return;
    out.push({
      text,
      x: w.bbox.x0,
      y: w.bbox.y0,
      confidence: w.confidence ?? 0,
    });
  };

  if (page.words?.length) {
    for (const w of page.words) pushWord(w);
    if (out.length) return out;
  }

  for (const block of page.blocks ?? []) {
    for (const line of block.lines ?? []) {
      for (const w of (line as { words?: WordLike[] }).words ?? []) {
        pushWord(w);
      }
    }
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const w of (line as { words?: WordLike[] }).words ?? []) {
          pushWord(w);
        }
      }
    }
  }
  return out;
}

function linesFromPage(page: PageLike): string[] {
  const rows: string[] = [];
  for (const line of page.lines ?? []) {
    const t = line.text?.replace(/\s+/g, " ").trim();
    if (t) rows.push(t);
  }
  if (rows.length) return rows;

  for (const block of page.blocks ?? []) {
    for (const line of block.lines ?? []) {
      const t = line.text?.replace(/\s+/g, " ").trim();
      if (t) rows.push(t);
    }
  }
  return rows;
}

/** Cluster OCR words by baseline, then merge into row strings (same idea as PDF text layer). */
export function rowStringsFromOcrPage(page: PageLike): string[] {
  const fromLines = linesFromPage(page);
  const words = wordsFromPage(page);
  if (!words.length) {
    return fromLines;
  }

  const items: PdfTextItem[] = words.map((w) => ({
    str: w.text,
    x: w.x,
    y: w.y,
  }));
  const yTol = Math.max(4, Math.round(pageHeightEstimate(page) * 0.004));
  const clustered = clusterItemsIntoRows(items, yTol);
  const fromWords = rowsToMergedStrings(clustered);

  return dedupeRowStrings([...fromLines, ...fromWords]);
}

function pageHeightEstimate(page: PageLike): number {
  let maxY = 0;
  for (const w of page.words ?? []) {
    if (w.bbox) maxY = Math.max(maxY, w.bbox.y1);
  }
  return maxY || 1000;
}

export function dedupeRowStrings(rows: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of rows) {
    const t = raw.replace(/\s+/g, " ").trim();
    if (t.length < 1) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export function splitPlainOcrText(text: string): string[] {
  const rows: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.replace(/\s+/g, " ").trim();
    if (t) rows.push(t);
  }
  return rows;
}
