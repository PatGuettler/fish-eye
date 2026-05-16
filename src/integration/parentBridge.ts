export const MESSAGE_SOURCE = "schedule-c-poc-widget" as const;

export type ScheduleCPopulatePayload = {
  box13: number;
  box30: number;
  box31: number;
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
    };

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

/**
 * Parent page: window.addEventListener('message', (ev) => { ... verify ev.origin and ev.data.source ... })
 * Then map payload to your form fields or trigger your SPA store.
 */
