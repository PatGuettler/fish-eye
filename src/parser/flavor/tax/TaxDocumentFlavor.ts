import { DOCUMENT_FORMAT_KINDS } from "../../core/DocumentFormatKind";
import { NotImplementedDocumentFlavor } from "../NotImplementedDocumentFlavor";

/** Placeholder for non–Schedule C tax forms (W-2, 1099, etc.). */
export class TaxDocumentFlavor extends NotImplementedDocumentFlavor {
  constructor() {
    super("tax-document", DOCUMENT_FORMAT_KINDS, "Tax document");
  }
}
