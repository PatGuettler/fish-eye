import { describe, expect, it } from "vitest";
import { ScheduleCDocumentFlavor } from "./ScheduleCDocumentFlavor";

describe("ScheduleCDocumentFlavor (JPEG content)", () => {
  it("extracts line chips from OCR row strings", async () => {
    const flavor = new ScheduleCDocumentFlavor();
    const result = await flavor.parse({
      kind: "jpeg",
      rowStrings: [
        "Part IV",
        "13 9,999.00",
        "30 1,500",
        "31 (200)",
      ],
      ocrWords: [],
      width: 800,
      height: 1200,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain("ocr");
    expect(result.raw).toEqual({
      box13: "9,999.00",
      box30: "1,500",
      box31: "(200)",
    });
    expect(result.items[0].label).toContain("13");
    expect(result.items[0].value).toBe("9,999.00");
  });
});
