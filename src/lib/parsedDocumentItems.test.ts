import { describe, expect, it } from "vitest";
import { buildParsedDocumentItems } from "./parsedDocumentItems";

describe("buildParsedDocumentItems", () => {
  it("puts Schedule C lines first and includes acro fields", () => {
    const fields = new Map<string, string>([
      ["topmostSubform[0].Page1[0].f1_22[0]", "1,234"],
      ["f1_22[0]", "1,234"],
    ]);
    const raw = { box13: "100", box30: "", box31: "50" };
    const items = buildParsedDocumentItems(fields, ["Extra row text"], raw);

    expect(items[0]).toMatchObject({ label: expect.stringContaining("13"), value: "100" });
    expect(items.some((i) => i.value === "1,234")).toBe(true);
    expect(items.some((i) => i.value === "Extra row text")).toBe(true);
  });

  it("dedupes repeated acro field entries", () => {
    const fields = new Map([["f1_1[0]", "once"]]);
    const items = buildParsedDocumentItems(
      fields,
      [],
      { box13: "", box30: "", box31: "" },
    );
    expect(items.filter((i) => i.value === "once").length).toBe(1);
  });
});
