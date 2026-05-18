// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DocumentParser } from "./DocumentParser";
import { DocDocumentFormatParser } from "../format/doc/DocDocumentFormatParser";
import { PdfDocumentFormatParser } from "../format/pdf/PdfDocumentFormatParser";
import { JpegDocumentFormatParser } from "../format/jpeg/JpegDocumentFormatParser";
import { GenericDocumentFlavor } from "../flavor/generic/GenericDocumentFlavor";
import { ScheduleCDocumentFlavor } from "../flavor/scheduleC/ScheduleCDocumentFlavor";

describe("DocumentParser", () => {
  it("rejects flavor/format mismatch before parsing bytes", async () => {
    const parser = new DocumentParser(
      new DocDocumentFormatParser(),
      new ScheduleCDocumentFlavor(),
    );
    const result = await parser.parse(new ArrayBuffer(8));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("does not support");
  });

  it("delegates to format parser then flavor for PDF + Schedule C", async () => {
    const parser = new DocumentParser(
      new PdfDocumentFormatParser(),
      new ScheduleCDocumentFlavor(),
    );
    expect(parser.formatKind).toBe("pdf");
    expect(parser.flavorId).toBe("schedule-c");
  });

  it("returns format parser failure without invoking flavor", async () => {
    const parser = new DocumentParser(
      new PdfDocumentFormatParser(),
      new GenericDocumentFlavor(),
    );
    const result = await parser.parse(new ArrayBuffer(0));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.length).toBeGreaterThan(0);
  });

  it("composes JPEG format with Schedule C flavor", () => {
    const parser = new DocumentParser(
      new JpegDocumentFormatParser(),
      new ScheduleCDocumentFlavor(),
    );
    expect(parser.formatKind).toBe("jpeg");
    expect(parser.flavorId).toBe("schedule-c");
  });
});
