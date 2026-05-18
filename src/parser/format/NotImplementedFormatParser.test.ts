import { describe, expect, it } from "vitest";
import { DocDocumentFormatParser } from "./doc/DocDocumentFormatParser";
import { JpegDocumentFormatParser } from "./jpeg/JpegDocumentFormatParser";
import { TxtDocumentFormatParser } from "./txt/TxtDocumentFormatParser";

describe("NotImplementedFormatParser", () => {
  it.each([
    [new DocDocumentFormatParser(), "doc"],
    [new TxtDocumentFormatParser(), "txt"],
    [new JpegDocumentFormatParser(), "jpeg"],
  ])("returns not-implemented for %s", async (parser, kind) => {
    expect(parser.kind).toBe(kind);
    const result = await parser.parse(new ArrayBuffer(0));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("not implemented");
  });
});
