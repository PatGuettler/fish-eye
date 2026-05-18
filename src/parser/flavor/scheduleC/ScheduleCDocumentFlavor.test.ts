// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ScheduleCDocumentFlavor } from "./ScheduleCDocumentFlavor";

describe("ScheduleCDocumentFlavor", () => {
  it("supports PDF and JPEG formats", () => {
    const flavor = new ScheduleCDocumentFlavor();
    expect(flavor.supportedFormats).toEqual(["pdf", "jpeg"]);
    expect(flavor.flavorId).toBe("schedule-c");
  });

});
