// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ScheduleCDocumentFlavor } from "./ScheduleCDocumentFlavor";

describe("ScheduleCDocumentFlavor", () => {
  it("only supports PDF format", () => {
    const flavor = new ScheduleCDocumentFlavor();
    expect(flavor.supportedFormats).toEqual(["pdf"]);
    expect(flavor.flavorId).toBe("schedule-c");
  });

});
