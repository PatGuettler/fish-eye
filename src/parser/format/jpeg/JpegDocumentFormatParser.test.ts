// @vitest-environment node
import { describe, expect, it } from "vitest";
import { JpegDocumentFormatParser } from "./JpegDocumentFormatParser";

const minimalJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).buffer;

describe("JpegDocumentFormatParser", () => {
  it("has kind jpeg", () => {
    expect(new JpegDocumentFormatParser().kind).toBe("jpeg");
  });

  it("rejects non-JPEG bytes", async () => {
    const result = await new JpegDocumentFormatParser().parse(
      new TextEncoder().encode("not-an-image").buffer,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("not a valid JPEG");
  });

  it("fails in Node without browser decode APIs", async () => {
    const result = await new JpegDocumentFormatParser().parse(minimalJpeg);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/browser/i);
  });
});
