import { describe, expect, it } from "vitest";
import {
  extractScheduleCAcroValues,
  findBestAcroValues,
  scoreFieldNameForLine,
} from "./acroFormMatch";

describe("scoreFieldNameForLine", () => {
  it("scores IRS-style f1_13[0] highly", () => {
    expect(scoreFieldNameForLine("f1_13[0]", 13)).toBeGreaterThanOrEqual(115);
  });

  it("scores f1_13a[0] for line 13", () => {
    expect(scoreFieldNameForLine("f1_13a[0]", 13)).toBeGreaterThanOrEqual(115);
  });

  it("does not treat 113 as line 13", () => {
    expect(scoreFieldNameForLine("f1_113[0]", 13)).toBe(0);
  });

  it("does not treat 130 as line 30", () => {
    expect(scoreFieldNameForLine("f1_130[0]", 30)).toBe(0);
  });
});

describe("findBestAcroValues", () => {
  it("picks best field per line", () => {
    const m = new Map<string, string>([
      ["f1_13[0]", "100"],
      ["f1_30[0]", "200"],
      ["f1_31[0]", "300"],
      ["noise", "0"],
    ]);
    expect(findBestAcroValues(m)).toEqual({
      13: "100",
      30: "200",
      31: "300",
    });
  });

  it("records empty string when field matched but blank", () => {
    const m = new Map<string, string>([
      ["f1_13[0]", ""],
      ["f1_30[0]", "50"],
    ]);
    const v = findBestAcroValues(m);
    expect(v[13]).toBe("");
    expect(v[30]).toBe("50");
  });
});

describe("extractScheduleCAcroValues", () => {
  it("prefers IRS f1040sc field ids (f1_22 = line 13) over empty f1_13", () => {
    const m = new Map<string, string>([
      ["topmostSubform[0].Page1[0].f1_13[0]", ""],
      ["topmostSubform[0].Page1[0].Lines8-17[0].f1_22[0]", "You 13"],
      ["topmostSubform[0].Page1[0].f1_45[0]", "you 30"],
      ["topmostSubform[0].Page1[0].f1_46[0]", "you 31"],
    ]);
    expect(extractScheduleCAcroValues(m)).toEqual({
      13: "You 13",
      30: "you 30",
      31: "you 31",
    });
  });

  it("uses IRS-style suffix fallback when scores are below minScore", () => {
    const m = new Map<string, string>([
      ["topmostSubform[0].Page1[0].Table_Line13[0].Row1[0].f1_13[0]", "You 13"],
      ["topmostSubform[0].Page2[0].f1_30[0]", "you 30"],
      ["topmostSubform[0].Page2[0].f1_31[0]", "you 31"],
    ]);
    expect(extractScheduleCAcroValues(m, 999)).toEqual({
      13: "You 13",
      30: "you 30",
      31: "you 31",
    });
  });
});
