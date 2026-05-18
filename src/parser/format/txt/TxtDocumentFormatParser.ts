import { NotImplementedFormatParser } from "../NotImplementedFormatParser";

export class TxtDocumentFormatParser extends NotImplementedFormatParser {
  constructor() {
    super("txt", "Plain text (.txt) document");
  }
}
