import { describe, expect, it } from "vitest";
import {
  cleanFieldValue,
  extractLineUserInputFromRows,
  extractScheduleCLineValuesFromRows,
  normalizeOcrRowText,
} from "./formLineValues";

describe("formLineValues", () => {
  it("normalizes common OCR confusions for user text", () => {
    expect(normalizeOcrRowText("vou 13")).toBe("You 13");
  });

  it("extracts You 13 style user input from a row", () => {
    const rows = [
      "13 Depreciation and section 179 expense deduction",
      "You 13",
      "30 Expenses for business use of your home",
      "you 30",
    ];
    expect(extractLineUserInputFromRows(rows, 13)).toBe("You 13");
    expect(extractLineUserInputFromRows(rows, 30)).toBe("you 30");
  });

  it("prefers currency when present on the line row", () => {
    const rows = ["30 1,500.00", "31 (200)"];
    expect(extractScheduleCLineValuesFromRows(rows)).toEqual({
      30: "1,500.00",
      31: "(200)",
    });
  });

  it("extracts vou 13 after OCR normalization", () => {
    const rows = ["Part II", "Vou 13"];
    expect(extractScheduleCLineValuesFromRows(rows)[13]).toBe("You 13");
  });

  it("strips OCR bracket artifacts", () => {
    expect(cleanFieldValue("You 13]")).toBe("You 13");
  });

  it("prefers You 13 over section 179 on the label row", () => {
    const rows = [
      "13 Depreciation and section 179 expense deduction",
      "You 13",
    ];
    expect(extractScheduleCLineValuesFromRows(rows)[13]).toBe("You 13");
  });
});
