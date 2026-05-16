import { describe, expect, it } from "vitest";
import {
  extractLastGuardedAmountFromRow,
  guardScheduleCAmount,
} from "./scheduleCAmountGuards";

describe("guardScheduleCAmount", () => {
  it("rejects 179 on line 13 when row mentions section 179", () => {
    const row = "13 Depreciation and section 179 expense deduction";
    expect(guardScheduleCAmount(13, "179", row)).toBeUndefined();
  });

  it("allows real amount on line 13 after section 179 phrase", () => {
    const row =
      "13 Depreciation and section 179 expense deduction 1,234.00";
    expect(guardScheduleCAmount(13, "1,234.00", row)).toBe("1,234.00");
  });

  it("rejects Form 8829 reference as line 30 amount", () => {
    expect(guardScheduleCAmount(30, "8829", "30 Expenses see Form 8829")).toBeUndefined();
  });

  it("rejects common IRS form numbers", () => {
    expect(guardScheduleCAmount(13, "4562", "any")).toBeUndefined();
  });
});

describe("extractLastGuardedAmountFromRow", () => {
  it("picks rightmost passing amount", () => {
    const row = "13 Depreciation and section 179 expense 500 9,999";
    expect(extractLastGuardedAmountFromRow(row, 13)).toBe("9,999");
  });
});
