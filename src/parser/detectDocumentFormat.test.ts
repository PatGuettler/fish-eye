import { describe, expect, it } from "vitest";
import { detectDocumentFormat, isPdfBytes } from "./detectDocumentFormat";
import { isJpegBytes } from "./format/image/decodeImage";

describe("detectDocumentFormat", () => {
  it("detects PDF by magic bytes and MIME", () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]).buffer;
    expect(isPdfBytes(pdfHeader)).toBe(true);
    expect(detectDocumentFormat(pdfHeader)).toBe("pdf");
    expect(detectDocumentFormat(pdfHeader, "application/pdf")).toBe("pdf");
  });

  it("detects JPEG by magic bytes and MIME", () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    expect(isJpegBytes(jpegHeader)).toBe(true);
    expect(detectDocumentFormat(jpegHeader)).toBe("jpeg");
    expect(detectDocumentFormat(jpegHeader, "image/jpeg")).toBe("jpeg");
  });

  it("returns null for unknown types", () => {
    const txt = new TextEncoder().encode("hello").buffer;
    expect(detectDocumentFormat(txt, "text/plain")).toBeNull();
  });
});
