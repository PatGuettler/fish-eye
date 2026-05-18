// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MESSAGE_SOURCE,
  buildPopulatePayload,
  listenForScheduleCMessages,
  needsCrossFrameDrag,
  postCloseToParent,
  postDragStartToParent,
  postParsedItemsToParent,
  postWidgetDoneToParent,
} from "./parentBridge";
import { F1040SC_EXPECTED_RAW } from "../test/pdfFixture";

describe("parentBridge message helpers", () => {
  let posted: { data: unknown; origin: string }[];

  beforeEach(() => {
    posted = [];
    vi.stubGlobal("parent", {
      postMessage(data: unknown, origin: string) {
        posted.push({ data, origin });
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("needsCrossFrameDrag is true when parent differs from window", () => {
    expect(needsCrossFrameDrag()).toBe(true);
  });

  it("postWidgetDoneToParent sends FISH_EYE_WIDGET_DONE with items", () => {
    const items = [
      { id: "line-box13", label: "Line 13", value: F1040SC_EXPECTED_RAW.box13 },
      { id: "line-box30", label: "Line 30", value: F1040SC_EXPECTED_RAW.box30 },
      { id: "line-box31", label: "Line 31", value: F1040SC_EXPECTED_RAW.box31 },
    ];
    postWidgetDoneToParent({ items, source: "acroform" });
    expect(posted).toHaveLength(1);
    expect(posted[0].origin).toBe("*");
    expect(posted[0].data).toEqual({
      source: MESSAGE_SOURCE,
      type: "FISH_EYE_WIDGET_DONE",
      payload: { items, source: "acroform" },
    });
  });

  it("postParsedItemsToParent sends FISH_EYE_PARSED_ITEMS", () => {
    const items = [
      { id: "line-box13", label: "Line 13", value: F1040SC_EXPECTED_RAW.box13 },
    ];
    postParsedItemsToParent({ items }, "https://example.com");
    expect(posted[0].data).toMatchObject({
      type: "FISH_EYE_PARSED_ITEMS",
      source: MESSAGE_SOURCE,
    });
    expect(posted[0].origin).toBe("https://example.com");
  });

  it("postCloseToParent sends SCHEDULE_C_CLOSE", () => {
    postCloseToParent("https://example.com");
    expect(posted[0].data).toEqual({
      source: MESSAGE_SOURCE,
      type: "SCHEDULE_C_CLOSE",
    });
  });

  it("postDragStartToParent sends drag coordinates", () => {
    postDragStartToParent(F1040SC_EXPECTED_RAW.box13, 10, 20, "*");
    expect(posted[0].data).toEqual({
      source: MESSAGE_SOURCE,
      type: "FISH_EYE_DRAG_START",
      text: F1040SC_EXPECTED_RAW.box13,
      x: 10,
      y: 20,
    });
  });

  it("buildPopulatePayload includes raw when present", () => {
    const payload = buildPopulatePayload(
      { box13: 0, box30: 0, box31: 0 },
      { ...F1040SC_EXPECTED_RAW },
    );
    expect(payload.raw).toEqual({ ...F1040SC_EXPECTED_RAW });
  });
});

describe("listenForScheduleCMessages", () => {
  it("dispatches parsed and close for FISH_EYE_WIDGET_DONE", () => {
    const items = [
      { id: "line-box13", label: "Line 13", value: F1040SC_EXPECTED_RAW.box13 },
    ];
    const onParsed = vi.fn();
    const onClose = vi.fn();
    const stop = listenForScheduleCMessages({ onParsed, onClose }, "*");

    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          source: MESSAGE_SOURCE,
          type: "FISH_EYE_WIDGET_DONE",
          payload: { items, source: "acroform" },
        },
        origin: "https://patguettler.github.io",
      }),
    );

    expect(onParsed).toHaveBeenCalledWith({
      items,
      source: "acroform",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    stop();
  });

  it("ignores messages with wrong source tag", () => {
    const onParsed = vi.fn();
    const stop = listenForScheduleCMessages({ onParsed }, "*");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { source: "other", type: "FISH_EYE_WIDGET_DONE", payload: {} },
      }),
    );
    expect(onParsed).not.toHaveBeenCalled();
    stop();
  });

  it("respects allowedOrigin allowlist", () => {
    const onClose = vi.fn();
    const stop = listenForScheduleCMessages(
      { onClose },
      "https://allowed.example",
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { source: MESSAGE_SOURCE, type: "SCHEDULE_C_CLOSE" },
        origin: "https://blocked.example",
      }),
    );
    expect(onClose).not.toHaveBeenCalled();
    stop();
  });
});
