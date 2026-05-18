import type { DocumentFormatKind } from "../parser/core/DocumentFormatKind";
import { detectDocumentFormat } from "../parser/detectDocumentFormat";
import { createDefaultDocumentParserRegistry } from "../parser/createDefaultRegistry";
import type { ParseScheduleCResult } from "../parser/flavor/scheduleC/ScheduleCDocumentFlavor";

export type { ParseScheduleCResult };

/**
 * Parse a Schedule C document (PDF or JPEG) using the format + flavor registry.
 */
export async function parseScheduleCDocument(
  data: ArrayBuffer,
  format?: DocumentFormatKind,
): Promise<ParseScheduleCResult> {
  const kind = format ?? detectDocumentFormat(data);
  if (!kind) {
    return {
      ok: false,
      error:
        "Unsupported file type. Upload a PDF or JPEG (.jpg) photo of your Schedule C.",
    };
  }

  const registry = createDefaultDocumentParserRegistry();
  const parser = registry.createParser(kind, "schedule-c");
  if (!parser) {
    return {
      ok: false,
      error: `No parser registered for format "${kind}" and flavor "schedule-c".`,
    };
  }

  return parser.parse(data) as Promise<ParseScheduleCResult>;
}

export { detectDocumentFormat };
