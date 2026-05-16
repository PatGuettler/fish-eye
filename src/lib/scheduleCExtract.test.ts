import { describe, expect, it } from "vitest";
import {
  FORM_4562_MESSAGE,
  box13RequiresForm4562,
  normalizeExtractedScheduleC,
  normalizeScheduleCBoxValue,
} from "./scheduleCExtract";

describe("normalizeScheduleCBoxValue", () => {
  it("treats blank as 0", () => {
    expect(normalizeScheduleCBoxValue("")).toBe(0);
    expect(normalizeScheduleCBoxValue("   ")).toBe(0);
    expect(normalizeScheduleCBoxValue(null)).toBe(0);
    expect(normalizeScheduleCBoxValue(undefined)).toBe(0);
  });

  it("treats literal 0 as 0", () => {
    expect(normalizeScheduleCBoxValue("0")).toBe(0);
    expect(normalizeScheduleCBoxValue("0.00")).toBe(0);
  });

  it("outputs exact positive integers", () => {
    expect(normalizeScheduleCBoxValue("1")).toBe(1);
    expect(normalizeScheduleCBoxValue("999,999")).toBe(999_999);
  });

  it("outputs exact negative numbers", () => {
    expect(normalizeScheduleCBoxValue("-500")).toBe(-500);
    expect(normalizeScheduleCBoxValue("(1,234.56)")).toBe(-1234.56);
  });

  it("handles NBSP and commas", () => {
    expect(normalizeScheduleCBoxValue("\u00a01,234")).toBe(1234);
  });

  it("returns 0 for non-numeric garbage", () => {
    expect(normalizeScheduleCBoxValue("n/a")).toBe(0);
  });
});

describe("box13RequiresForm4562", () => {
  it("is false below 10,000", () => {
    expect(box13RequiresForm4562(9999.99)).toBe(false);
    expect(box13RequiresForm4562(0)).toBe(false);
  });

  it("is true at or above 10,000", () => {
    expect(box13RequiresForm4562(10_000)).toBe(true);
    expect(box13RequiresForm4562(50_000)).toBe(true);
  });
});

describe("normalizeExtractedScheduleC", () => {
  it("applies rules to all three boxes", () => {
    expect(
      normalizeExtractedScheduleC({
        box13Raw: "",
        box30Raw: "0",
        box31Raw: "(100)",
      }),
    ).toEqual({ box13: 0, box30: 0, box31: -100 });
  });
});

describe("FORM_4562_MESSAGE", () => {
  it("matches required copy", () => {
    expect(FORM_4562_MESSAGE).toBe(
      "Box 13 exceeds $10,000. An IRS Form 4562 is required. Please request or upload Form 4562.",
    );
  });
});
