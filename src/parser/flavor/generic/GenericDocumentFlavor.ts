import { DOCUMENT_FORMAT_KINDS } from "../../core/DocumentFormatKind";
import { NotImplementedDocumentFlavor } from "../NotImplementedDocumentFlavor";

export class GenericDocumentFlavor extends NotImplementedDocumentFlavor {
  constructor() {
    super("generic", DOCUMENT_FORMAT_KINDS, "Generic document");
  }
}
