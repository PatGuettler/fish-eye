import { describe, expect, it, vi } from "vitest";
import { JpegDocumentFormatParser } from "./JpegDocumentFormatParser";

const minimalJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).buffer;

describe("JpegDocumentFormatParser (browser)", () => {
  it("returns OCR row strings when decode and OCR succeed", async () => {
    const decodeMod = await import("../image/decodeImage");
    const ocrMod = await import("../../../lib/ocrExtract");
    vi.spyOn(decodeMod, "decodeJpegToCanvas").mockResolvedValue({
      width: 640,
      height: 480,
    } as HTMLCanvasElement);
    vi.spyOn(ocrMod, "ocrImageCanvas").mockResolvedValue([
      "Schedule C",
      "13  1000",
    ]);

    const result = await new JpegDocumentFormatParser().parse(minimalJpeg);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content.kind).toBe("jpeg");
    expect(result.content.rowStrings).toEqual(["Schedule C", "13  1000"]);
    expect(result.content.width).toBe(640);

    vi.restoreAllMocks();
  });
});
