import { describe, expect, it } from "vitest";
import { GenericDocumentFlavor } from "./generic/GenericDocumentFlavor";
import { TaxDocumentFlavor } from "./tax/TaxDocumentFlavor";

describe("NotImplementedDocumentFlavor", () => {
  it.each([new GenericDocumentFlavor(), new TaxDocumentFlavor()])(
    "returns not-implemented for flavor $flavorId",
    async (flavor) => {
      const result = await flavor.parse({
        kind: "pdf",
        fields: new Map(),
        rowStrings: [],
        pdf: {} as never,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("not implemented");
    },
  );
});
