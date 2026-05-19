export type TesseractWorkerOptions = {
  logger?: () => void;
  workerPath?: string;
};

export type OcrPageData = {
  text?: string;
  lines?: { text?: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }[];
  words?: {
    text?: string;
    confidence?: number;
    bbox?: { x0: number; y0: number; x1: number; y1: number };
  }[];
  blocks?: {
    lines?: { text?: string }[];
    paragraphs?: { lines?: { text?: string }[] }[];
  }[];
};

export type OcrWorker = {
  recognize: (
    image: unknown,
    options?: Record<string, unknown>,
    output?: Record<string, boolean>,
  ) => Promise<{ data: OcrPageData }>;
  setParameters?: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<void>;
};
