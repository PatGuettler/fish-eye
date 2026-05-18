import { NotImplementedFormatParser } from "../NotImplementedFormatParser";

export class JpegDocumentFormatParser extends NotImplementedFormatParser {
  constructor() {
    super("jpeg", "JPEG image");
  }
}
