import { describe, expect, it } from "vitest";
import { scheduleCTextSurfaceFromContent } from "./scheduleCTextSurface";

describe("scheduleCTextSurfaceFromContent", () => {
  it("maps PDF content with ocrAlreadyApplied false", () => {
    const fields = new Map([["f1_22[0]", "1"]]);
    const surface = scheduleCTextSurfaceFromContent({
      kind: "pdf",
      fields,
      rowStrings: ["row a"],
      pdf: {} as never,
    });
    expect("error" in surface).toBe(false);
    if ("error" in surface) return;
    expect(surface.fields).toBe(fields);
    expect(surface.rowStrings).toEqual(["row a"]);
    expect(surface.pdf).toBeDefined();
    expect(surface.ocrAlreadyApplied).toBe(false);
  });

  it("maps JPEG content with empty fields and ocrAlreadyApplied true", () => {
    const surface = scheduleCTextSurfaceFromContent({
      kind: "jpeg",
      rowStrings: ["Schedule C", "13  500"],
      ocrWords: [],
      width: 100,
      height: 200,
    });
    expect("error" in surface).toBe(false);
    if ("error" in surface) return;
    expect(surface.fields.size).toBe(0);
    expect(surface.ocrAlreadyApplied).toBe(true);
    expect(surface.pdf).toBeUndefined();
  });
});
