// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseScheduleCDocument } from "./parseScheduleCDocument";
import { JpegDocumentFormatParser } from "../parser/format/jpeg/JpegDocumentFormatParser";
import { readJpegDimensions } from "../parser/format/image/decodeImage";
import {
  readSchedulCJpegBytes,
  schedulCJpegDimensions,
  SCHEDULC_JPEG_PATH,
} from "../test/imageFixture";

describe("schedulC.jpg end-to-end parsing", () => {
  it("fixture file exists with expected JPEG dimensions", () => {
    expect(SCHEDULC_JPEG_PATH).toMatch(/schedulC\.jpg$/);
    const dims = schedulCJpegDimensions();
    expect(dims.width).toBe(1152);
    expect(dims.height).toBe(846);
  });

  it("JpegDocumentFormatParser OCR yields text rows", async () => {
    const bytes = readSchedulCJpegBytes();
    const formatResult = await new JpegDocumentFormatParser().parse(bytes);
    expect(formatResult.ok, !formatResult.ok ? formatResult.error : "").toBe(
      true,
    );
    if (!formatResult.ok) return;

    expect(formatResult.content.kind).toBe("jpeg");
    expect(formatResult.content.rowStrings.length).toBeGreaterThan(15);
    expect(
      formatResult.content.rowStrings.some((r) => /schedule\s*c/i.test(r)),
    ).toBe(true);
    const dims = readJpegDimensions(bytes);
    expect(formatResult.content.width).toBe(dims?.width);
    expect(formatResult.content.height).toBe(dims?.height);
  }, 120_000);

  it("parseScheduleCDocument returns draggable items from photo", async () => {
    const result = await parseScheduleCDocument(readSchedulCJpegBytes(), "jpeg");
    expect(result.ok, !result.ok ? result.error : "").toBe(true);
    if (!result.ok) return;

    expect(result.source).toContain("ocr");
    expect(result.items.length).toBeGreaterThanOrEqual(3);
    expect(result.items.length).toBeLessThan(12);
    expect(
      result.items.some((i) => /line\s*13|line\s*30|line\s*31/i.test(i.label)),
    ).toBe(true);

    const ids = new Set(result.items.map((i) => i.id));
    expect(ids.size).toBe(result.items.length);
    for (const item of result.items) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.value.trim().length).toBeGreaterThan(0);
    }
  }, 120_000);

  it("finds user-filled line values like You 13 when present in OCR text", async () => {
    const formatResult = await new JpegDocumentFormatParser().parse(
      readSchedulCJpegBytes(),
    );
    expect(formatResult.ok).toBe(true);
    if (!formatResult.ok) return;

    const rows = formatResult.content.rowStrings;
    const line13Rows = rows.filter((r) => /\b13\b/i.test(r) && /you|vou/i.test(r));

    const result = await parseScheduleCDocument(readSchedulCJpegBytes(), "jpeg");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const values = result.items.map((i) => i.value);
    const foundUser13 =
      values.some((v) => /\byou\s*13\b/i.test(v)) ||
      values.some((v) => /\bvou\s*13\b/i.test(v)) ||
      /\byou\b/i.test(result.raw.box13);

    if (line13Rows.length > 0) {
      expect(
        foundUser13,
        `OCR saw line-13 user text (${line13Rows.join(" | ")}) but chips/raw did not include it`,
      ).toBe(true);
      expect(result.raw.box13).toMatch(/\byou\s*13\b/i);
    }

    const line30Rows = rows.filter((r) => /\b30\b/i.test(r) && /you|vou/i.test(r));
    if (line30Rows.length > 0) {
      expect(result.raw.box30).toMatch(/\byou\s*30\b/i);
    }
  }, 180_000);
});
