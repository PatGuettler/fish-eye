import { describe, expect, it } from "vitest";
import { createDefaultDocumentParserRegistry } from "../createDefaultRegistry";

describe("DocumentParserRegistry", () => {
  it("registers all format parsers and flavors", () => {
    const registry = createDefaultDocumentParserRegistry();
    expect(registry.listFormatKinds().sort()).toEqual(["doc", "jpeg", "pdf", "txt"]);
    expect(registry.listFlavorIds().sort()).toEqual([
      "generic",
      "schedule-c",
      "tax-document",
    ]);
  });

  it("creates a parser for pdf + schedule-c", () => {
    const registry = createDefaultDocumentParserRegistry();
    const parser = registry.createParser("pdf", "schedule-c");
    expect(parser).toBeDefined();
    expect(parser!.formatKind).toBe("pdf");
    expect(parser!.flavorId).toBe("schedule-c");
  });

  it("returns undefined when format or flavor is not registered", () => {
    const registry = createDefaultDocumentParserRegistry();
    expect(registry.createParser("pdf", "unknown")).toBeUndefined();
  });

  it("allows composing doc format with schedule-c flavor (validated at parse time)", () => {
    const registry = createDefaultDocumentParserRegistry();
    const parser = registry.createParser("doc", "schedule-c");
    expect(parser).toBeDefined();
    expect(parser!.formatKind).toBe("doc");
    expect(parser!.flavorId).toBe("schedule-c");
  });
});
