/// <reference types="vite/client" />

declare module "tesseract.js/dist/worker.min.js?url" {
  const src: string;
  export default src;
}

declare module "tesseract.js/dist/tesseract.esm.min.js" {
  const Tesseract: {
    createWorker: (
      langs?: string,
      oem?: number,
      options?: { logger?: () => void; workerPath?: string },
    ) => Promise<{
      recognize: (image: unknown) => Promise<{ data: { text: string } }>;
      terminate: () => Promise<void>;
    }>;
  };
  export default Tesseract;
}

import type { ScheduleCPopulatePayload } from "./integration/parentBridge";

export type ScheduleCWidgetOpenOptions = {
  baseUrl?: string;
  parentOrigin?: string;
  onPopulate?: (payload: ScheduleCPopulatePayload) => void;
  onClose?: () => void;
};

export type ScheduleCWidgetAPI = {
  open: (options?: ScheduleCWidgetOpenOptions) => { close: () => void };
};

declare global {
  interface Window {
    ScheduleCWidget: ScheduleCWidgetAPI;
  }
}

export {};
