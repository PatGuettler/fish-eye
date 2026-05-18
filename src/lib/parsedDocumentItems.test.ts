// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { buildParsedDocumentItems } from "./parsedDocumentItems";
import {
  collectAcroFormFieldsFromPdf,
  collectTextRowStringsFromPdf,
} from "./pdfScheduleCParser";
import {
  F1040SC_EXPECTED_RAW,
  configurePdfWorker,
  openF1040scPdf,
} from "../test/pdfFixture";

beforeAll(() => {
  configurePdfWorker();
});

describe("buildParsedDocumentItems (f1040sc.pdf)", () => {
  it("orders highlighted lines first and dedupes acro aliases", async () => {
    const pdf = await openF1040scPdf();
    const fields = await collectAcroFormFieldsFromPdf(pdf);
    const rows = await collectTextRowStringsFromPdf(pdf);
    const items = buildParsedDocumentItems(fields, rows, { ...F1040SC_EXPECTED_RAW });

    expect(items[0].value).toBe(F1040SC_EXPECTED_RAW.box13);
    expect(items[1].value).toBe(F1040SC_EXPECTED_RAW.box30);
    expect(items[2].value).toBe(F1040SC_EXPECTED_RAW.box31);

    const box13Entries = items.filter((i) => i.value === F1040SC_EXPECTED_RAW.box13);
    expect(box13Entries.length).toBeGreaterThanOrEqual(1);
    expect(box13Entries[0].label).toContain("13");
  });
});
