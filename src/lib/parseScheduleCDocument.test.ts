import { describe, expect, it } from "vitest";
import { parseScheduleCDocument } from "./parseScheduleCDocument";

describe("parseScheduleCDocument", () => {
  it("rejects unsupported file types", async () => {
    const result = await parseScheduleCDocument(
      new TextEncoder().encode("plain text").buffer,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Unsupported file type");
  });

  it("rejects empty PDF buffer via format parser", async () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;
    const result = await parseScheduleCDocument(pdfHeader, "pdf");
    expect(result.ok).toBe(false);
  });
});
