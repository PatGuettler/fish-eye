import { DocumentFormatParser } from "../../core/DocumentFormatParser";
import type { ImageParsedContent } from "../../core/ParsedDocumentContent";
import type { FormatParseOutcome } from "../../core/types";
import { ocrImageCanvas } from "../../../lib/ocrExtract";
import { decodeJpegToCanvas } from "../image/decodeImage";

export class JpegDocumentFormatParser extends DocumentFormatParser {
  override readonly kind = "jpeg" as const;

  override async parse(
    bytes: ArrayBuffer,
  ): Promise<FormatParseOutcome<ImageParsedContent>> {
    try {
      const canvas = await decodeJpegToCanvas(bytes);
      const rowStrings = await ocrImageCanvas(canvas);
      if (rowStrings.length === 0) {
        return {
          ok: false,
          error:
            "Could not read any text from this image. Use a clear, well-lit photo of the form.",
        };
      }
      return {
        ok: true,
        content: {
          kind: "jpeg",
          rowStrings,
          width: canvas.width,
          height: canvas.height,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}
