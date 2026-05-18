// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import {
  extractScheduleCAcroValues,
  findBestAcroValues,
  scoreFieldNameForLine,
} from "./acroFormMatch";
import { findIrsF1040scFieldValues } from "./irsF1040scFields";
import { buildParsedDocumentItems } from "./parsedDocumentItems";
import {
  collectAcroFormFieldsFromPdf,
  collectTextRowStringsFromPdf,
  parseScheduleCPdfBytes,
} from "./pdfScheduleCParser";
import {
  collectPageViewportItems,
  parseAmountForLineFromPageItems,
} from "./scheduleCLayoutExtract";
import {
  box13RequiresForm4562,
  normalizeExtractedScheduleC,
} from "./scheduleCExtract";
import { buildPopulatePayload } from "../integration/parentBridge";
import {
  F1040SC_EXPECTED_NORMALIZED,
  F1040SC_EXPECTED_RAW,
  configurePdfWorker,
  openF1040scPdf,
  readF1040scPdfBytes,
} from "../test/pdfFixture";

beforeAll(() => {
  configurePdfWorker();
});

describe("f1040sc.pdf end-to-end parsing", () => {
  it("parseScheduleCPdfBytes returns ok with expected lines and document items", async () => {
    const result = await parseScheduleCPdfBytes(readF1040scPdfBytes());
    expect(result.ok, !result.ok ? result.error : "").toBe(true);
    if (!result.ok) return;

    expect(result.raw).toEqual({ ...F1040SC_EXPECTED_RAW });
    expect(result.data).toEqual({ ...F1040SC_EXPECTED_NORMALIZED });
    expect(result.source).toContain("acroform");
    expect(result.items.length).toBeGreaterThan(50);

    const values = result.items.map((i) => i.value);
    expect(values).toContain(F1040SC_EXPECTED_RAW.box13);
    expect(values).toContain(F1040SC_EXPECTED_RAW.box30);
    expect(values).toContain(F1040SC_EXPECTED_RAW.box31);

    expect(result.items[0]).toMatchObject({
      label: expect.stringContaining("13"),
      value: F1040SC_EXPECTED_RAW.box13,
    });
    expect(result.items[1]).toMatchObject({
      label: expect.stringContaining("30"),
      value: F1040SC_EXPECTED_RAW.box30,
    });
    expect(result.items[2]).toMatchObject({
      label: expect.stringContaining("31"),
      value: F1040SC_EXPECTED_RAW.box31,
    });
  });

  it("parseScheduleCPdfBytes is stable across repeated runs", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await parseScheduleCPdfBytes(readF1040scPdfBytes());
      expect(result.ok, `run ${i}`).toBe(true);
      if (!result.ok) continue;
      expect(result.raw.box13, `run ${i}`).toBe(F1040SC_EXPECTED_RAW.box13);
      expect(result.raw.box30, `run ${i}`).toBe(F1040SC_EXPECTED_RAW.box30);
      expect(result.raw.box31, `run ${i}`).toBe(F1040SC_EXPECTED_RAW.box31);
    }
  });

  it("rejects empty buffer", async () => {
    const result = await parseScheduleCPdfBytes(new ArrayBuffer(0));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.length).toBeGreaterThan(0);
  });
});

describe("f1040sc.pdf AcroForm extraction", () => {
  it("collectAcroFormFieldsFromPdf includes IRS widget values", async () => {
    const pdf = await openF1040scPdf();
    const fields = await collectAcroFormFieldsFromPdf(pdf);
    expect(fields.size).toBeGreaterThan(80);

    const irs = findIrsF1040scFieldValues(fields);
    expect(irs).toEqual({
      13: F1040SC_EXPECTED_RAW.box13,
      30: F1040SC_EXPECTED_RAW.box30,
      31: F1040SC_EXPECTED_RAW.box31,
    });

    const acro = extractScheduleCAcroValues(fields);
    expect(acro[13]).toBe(F1040SC_EXPECTED_RAW.box13);
    expect(acro[30]).toBe(F1040SC_EXPECTED_RAW.box30);
    expect(acro[31]).toBe(F1040SC_EXPECTED_RAW.box31);

    const f122 = [...fields.entries()].find(([name]) =>
      /f1_22\[\d+\]$/i.test(name.trim()),
    );
    expect(f122?.[1]).toBe(F1040SC_EXPECTED_RAW.box13);
  });

  it("maps IRS f1_22 widget id via findIrsF1040scFieldValues (not line-digit scoring)", async () => {
    const fields = await collectAcroFormFieldsFromPdf(await openF1040scPdf());
    const f122 = [...fields.keys()].find((n) => /f1_22\[\d+\]$/i.test(n.trim()));
    expect(f122).toBeDefined();
    expect(scoreFieldNameForLine(f122!, 13)).toBe(0);
    expect(findIrsF1040scFieldValues(fields)[13]).toBe(F1040SC_EXPECTED_RAW.box13);
    expect(scoreFieldNameForLine("f1_113[0]", 13)).toBe(0);
    expect(scoreFieldNameForLine("f1_130[0]", 30)).toBe(0);
  });

  it("findBestAcroValues returns a map without throwing on the fixture PDF", async () => {
    const fields = await collectAcroFormFieldsFromPdf(await openF1040scPdf());
    const best = findBestAcroValues(fields);
    expect(best).toBeTypeOf("object");
    expect(findIrsF1040scFieldValues(fields)[30]).toBe(F1040SC_EXPECTED_RAW.box30);
  });
});

describe("f1040sc.pdf layout extraction", () => {
  it("parseAmountForLineFromPageItems finds line amounts when present in text layer", async () => {
    const pdf = await openF1040scPdf();
    let found13 = false;
    let found30 = false;
    let found31 = false;
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const { items, width } = await collectPageViewportItems(page);
      if (!found13 && parseAmountForLineFromPageItems(items, width, 13)) {
        found13 = true;
      }
      if (!found30 && parseAmountForLineFromPageItems(items, width, 30)) {
        found30 = true;
      }
      if (!found31 && parseAmountForLineFromPageItems(items, width, 31)) {
        found31 = true;
      }
    }
    // Fillable fixture may rely on acroform; at least one layer should see text.
    expect(found13 || found30 || found31).toBe(true);
  });
});

describe("f1040sc.pdf text rows and document items", () => {
  it("collectTextRowStringsFromPdf yields searchable rows", async () => {
    const pdf = await openF1040scPdf();
    const rows = await collectTextRowStringsFromPdf(pdf);
    expect(rows.length).toBeGreaterThan(20);
    expect(rows.some((r) => /schedule\s+c/i.test(r))).toBe(true);
  });

  it("buildParsedDocumentItems from real PDF fields matches parse output shape", async () => {
    const pdf = await openF1040scPdf();
    const fields = await collectAcroFormFieldsFromPdf(pdf);
    const rows = await collectTextRowStringsFromPdf(pdf);
    const raw = { ...F1040SC_EXPECTED_RAW };
    const items = buildParsedDocumentItems(fields, rows, raw);

    expect(items.length).toBeGreaterThan(50);
    expect(items[0].value).toBe(F1040SC_EXPECTED_RAW.box13);
    expect(items[1].value).toBe(F1040SC_EXPECTED_RAW.box30);
    expect(items[2].value).toBe(F1040SC_EXPECTED_RAW.box31);

    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length);
    for (const item of items) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.value.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("f1040sc.pdf host bridge payload", () => {
  it("buildPopulatePayload carries fixture raw lines from parse result", async () => {
    const result = await parseScheduleCPdfBytes(readF1040scPdfBytes());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const payload = buildPopulatePayload(result.data, result.raw);
    expect(payload.raw).toEqual({ ...F1040SC_EXPECTED_RAW });
    expect(
      result.items.some((i) => i.value === F1040SC_EXPECTED_RAW.box13),
    ).toBe(true);
  });
});

describe("f1040sc.pdf normalization rules on fixture strings", () => {
  it("normalizes fixture raw lines per POC rules", () => {
    expect(
      normalizeExtractedScheduleC({
        box13Raw: F1040SC_EXPECTED_RAW.box13,
        box30Raw: F1040SC_EXPECTED_RAW.box30,
        box31Raw: F1040SC_EXPECTED_RAW.box31,
      }),
    ).toEqual(F1040SC_EXPECTED_NORMALIZED);
    expect(box13RequiresForm4562(F1040SC_EXPECTED_NORMALIZED.box13)).toBe(false);
  });
});
