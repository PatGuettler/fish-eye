import { describe, expect, it } from "vitest";
import {
  clusterItemsIntoRows,
  extractAmountToken,
  extractLineAmountFromRows,
  rowsToMergedStrings,
} from "./pdfTextRows";

describe("clusterItemsIntoRows + rowsToMergedStrings", () => {
  it("merges split currency on one baseline", () => {
    const items = [
      { str: "13", x: 40, y: 100 },
      { str: "1,2", x: 200, y: 100.5 },
      { str: "34", x: 220, y: 100.5 },
    ];
    const rows = clusterItemsIntoRows(items, 5);
    const strs = rowsToMergedStrings(rows);
    expect(strs.some((s) => s.includes("13") && s.includes("1,234"))).toBe(true);
  });
});

describe("extractLineAmountFromRows", () => {
  it("reads amount after line label", () => {
    const rows = ["Part IV", "30 1,500", "31 (200)"];
    expect(extractLineAmountFromRows(rows, 30)).toBe("1,500");
    expect(extractLineAmountFromRows(rows, 31)).toBe("(200)");
  });

  it("handles line at start", () => {
    expect(extractLineAmountFromRows(["13: 9,999.00"], 13)).toBe("9,999.00");
  });

  it("does not use 179 from section 179 when a larger amount exists", () => {
    const row =
      "13 Depreciation and section 179 expense deduction 179 12,345.00";
    expect(extractLineAmountFromRows([row], 13)).toBe("12,345.00");
  });
});

describe("extractAmountToken", () => {
  it("pulls first money-like token", () => {
    expect(extractAmountToken("  $1,234.50  ")).toBe("$1,234.50");
    expect(extractAmountToken("(500)")).toBe("(500)");
  });
});
