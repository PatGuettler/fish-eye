import { describe, expect, it } from "vitest";
import { scoreFieldNameForLine } from "./acroFormMatch";

/** Field-name scoring edge cases (line numbers embedded in unrelated ids). */
describe("scoreFieldNameForLine edge cases", () => {
  it("does not treat 113 as line 13", () => {
    expect(scoreFieldNameForLine("f1_113[0]", 13)).toBe(0);
  });

  it("does not treat 130 as line 30", () => {
    expect(scoreFieldNameForLine("f1_130[0]", 30)).toBe(0);
  });

  it("scores IRS-style f1_13[0] highly", () => {
    expect(scoreFieldNameForLine("f1_13[0]", 13)).toBeGreaterThanOrEqual(115);
  });
});
