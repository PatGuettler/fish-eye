import { DocumentFormatParser } from "../../core/DocumentFormatParser";
import type { ImageParsedContent } from "../../core/ParsedDocumentContent";
import type { FormatParseOutcome } from "../../core/types";
import { ocrJpegBytes } from "../../../lib/ocrExtract";
import { isJpegBytes, readJpegDimensions } from "../image/decodeImage";

export class JpegDocumentFormatParser extends DocumentFormatParser {
  override readonly kind = "jpeg" as const;

  override async parse(
    bytes: ArrayBuffer,
  ): Promise<FormatParseOutcome<ImageParsedContent>> {
    try {
      if (!isJpegBytes(bytes)) {
        return { ok: false, error: "File is not a valid JPEG image." };
      }
      const { rowStrings, words: ocrWords } = await ocrJpegBytes(bytes);
      if (rowStrings.length === 0) {
        return {
          ok: false,
          error:
            "Could not read any text from this image. Use a clear, well-lit photo of the form.",
        };
      }
      const dims = readJpegDimensions(bytes);
      const width = dims?.width ?? 0;
      const height = dims?.height ?? 0;
      return {
        ok: true,
        content: {
          kind: "jpeg",
          rowStrings,
          ocrWords,
          width,
          height,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}
