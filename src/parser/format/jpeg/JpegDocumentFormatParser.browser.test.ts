import { describe, expect, it, vi } from "vitest";
import { JpegDocumentFormatParser } from "./JpegDocumentFormatParser";

const minimalJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).buffer;

describe("JpegDocumentFormatParser (browser)", () => {
  it("returns OCR row strings when ocrJpegBytes succeeds", async () => {
    const ocrMod = await import("../../../lib/ocrExtract");
    vi.spyOn(ocrMod, "ocrJpegBytes").mockResolvedValue({
      rowStrings: ["Schedule C", "13  1000"],
      words: [],
    });

    const result = await new JpegDocumentFormatParser().parse(minimalJpeg);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content.kind).toBe("jpeg");
    expect(result.content.rowStrings).toEqual(["Schedule C", "13  1000"]);

    vi.restoreAllMocks();
  });
});
