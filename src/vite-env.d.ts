/// <reference types="vite/client" />

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
