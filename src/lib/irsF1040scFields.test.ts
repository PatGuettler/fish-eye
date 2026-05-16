import { describe, expect, it } from "vitest";
import { findIrsF1040scFieldValues } from "./irsF1040scFields";

describe("findIrsF1040scFieldValues", () => {
  it("maps f1_22 to line 13 and f1_45/f1_46 to lines 30/31", () => {
    const m = new Map<string, string>([
      ["topmostSubform[0].Page1[0].f1_13[0]", ""],
      ["topmostSubform[0].Page1[0].Lines8-17[0].f1_22[0]", "You 13"],
      ["topmostSubform[0].Page1[0].f1_45[0]", "you 30"],
      ["topmostSubform[0].Page1[0].f1_46[0]", "you 31"],
    ]);
    expect(findIrsF1040scFieldValues(m)).toEqual({
      13: "You 13",
      30: "you 30",
      31: "you 31",
    });
  });
});
