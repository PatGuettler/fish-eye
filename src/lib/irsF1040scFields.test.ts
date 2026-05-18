// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { findIrsF1040scFieldValues } from "./irsF1040scFields";
import { collectAcroFormFieldsFromPdf } from "./pdfScheduleCParser";
import {
  F1040SC_EXPECTED_RAW,
  configurePdfWorker,
  openF1040scPdf,
} from "../test/pdfFixture";

beforeAll(() => {
  configurePdfWorker();
});

describe("findIrsF1040scFieldValues (f1040sc.pdf)", () => {
  it("maps official IRS widget ids to lines 13, 30, 31", async () => {
    const fields = await collectAcroFormFieldsFromPdf(await openF1040scPdf());
    expect(findIrsF1040scFieldValues(fields)).toEqual({
      13: F1040SC_EXPECTED_RAW.box13,
      30: F1040SC_EXPECTED_RAW.box30,
      31: F1040SC_EXPECTED_RAW.box31,
    });
  });
});
