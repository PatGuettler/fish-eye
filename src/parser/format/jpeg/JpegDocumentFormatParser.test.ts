// @vitest-environment node
import { describe, expect, it } from "vitest";
import { JpegDocumentFormatParser } from "./JpegDocumentFormatParser";

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
});
