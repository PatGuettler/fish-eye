import type { ScheduleCBoxRaw } from "../lib/scheduleCExtract";

export const MESSAGE_SOURCE = "schedule-c-poc-widget" as const;

export type ScheduleCPopulatePayload = {
  box13: number;
  box30: number;
  box31: number;
  /** Original PDF field text when available (for display / paste). */
  raw?: ScheduleCBoxRaw;
};

export type FishEyeDragStartMessage = {
  source: typeof MESSAGE_SOURCE;
  type: "FISH_EYE_DRAG_START";
  text: string;
  x: number;
  y: number;
};

export type ScheduleCPostMessage =
  | {
      source: typeof MESSAGE_SOURCE;
      type: "SCHEDULE_C_POPULATE";
      payload: ScheduleCPopulatePayload;
    }
  | {
      source: typeof MESSAGE_SOURCE;
      type: "SCHEDULE_C_CLOSE";
    }
  | FishEyeDragStartMessage;

export function postDragStartToParent(
  text: string,
  x: number,
  y: number,
  targetOrigin: string = "*",
): void {
  const msg: FishEyeDragStartMessage = {
    source: MESSAGE_SOURCE,
    type: "FISH_EYE_DRAG_START",
    text,
    x,
    y,
  };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, targetOrigin);
  }
}

/** True when parsed values must reach the host via postMessage drag bridge. */
export function needsCrossFrameDrag(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

export function buildPopulatePayload(
  data: { box13: number; box30: number; box31: number },
  raw?: ScheduleCBoxRaw | null,
): ScheduleCPopulatePayload {
  const payload: ScheduleCPopulatePayload = { ...data };
  if (raw && (raw.box13 || raw.box30 || raw.box31)) {
    payload.raw = raw;
  }
  return payload;
}

export function postPopulateToParent(
  payload: ScheduleCPopulatePayload,
  targetOrigin: string = "*",
): void {
  const msg: ScheduleCPostMessage = {
    source: MESSAGE_SOURCE,
    type: "SCHEDULE_C_POPULATE",
    payload,
  };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, targetOrigin);
  }
}

export function postCloseToParent(targetOrigin: string = "*"): void {
  const msg: ScheduleCPostMessage = {
    source: MESSAGE_SOURCE,
    type: "SCHEDULE_C_CLOSE",
  };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, targetOrigin);
  }
}

export type ScheduleCMessageHandlers = {
  onPopulate?: (payload: ScheduleCPopulatePayload) => void;
  onClose?: () => void;
};

/**
 * Parent page: validate `ev.origin` and `ev.data.source === MESSAGE_SOURCE`.
 */
export function listenForScheduleCMessages(
  handlers: ScheduleCMessageHandlers,
  allowedOrigin: string | string[] = "*",
): () => void {
  const allowed = Array.isArray(allowedOrigin)
    ? allowedOrigin
    : [allowedOrigin];

  function onMessage(ev: MessageEvent) {
    const d = ev.data;
    if (!d || d.source !== MESSAGE_SOURCE) return;
    if (allowed[0] !== "*" && !allowed.includes(ev.origin)) return;

    if (d.type === "SCHEDULE_C_POPULATE") {
      handlers.onPopulate?.(d.payload);
    }
    if (d.type === "SCHEDULE_C_CLOSE") {
      handlers.onClose?.();
    }
  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
