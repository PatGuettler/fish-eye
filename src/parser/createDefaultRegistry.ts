import { DocumentParserRegistry } from "./core/DocumentParserRegistry";
import { DocDocumentFormatParser } from "./format/doc/DocDocumentFormatParser";
import { JpegDocumentFormatParser } from "./format/jpeg/JpegDocumentFormatParser";
import { PdfDocumentFormatParser } from "./format/pdf/PdfDocumentFormatParser";
import { TxtDocumentFormatParser } from "./format/txt/TxtDocumentFormatParser";
import { GenericDocumentFlavor } from "./flavor/generic/GenericDocumentFlavor";
import { ScheduleCDocumentFlavor } from "./flavor/scheduleC/ScheduleCDocumentFlavor";
import { TaxDocumentFlavor } from "./flavor/tax/TaxDocumentFlavor";

/** Registry with all format parsers and flavors (implemented and placeholder). */
export function createDefaultDocumentParserRegistry(): DocumentParserRegistry {
  return new DocumentParserRegistry()
    .registerFormatParser(new PdfDocumentFormatParser())
    .registerFormatParser(new DocDocumentFormatParser())
    .registerFormatParser(new TxtDocumentFormatParser())
    .registerFormatParser(new JpegDocumentFormatParser())
    .registerFlavor(new ScheduleCDocumentFlavor())
    .registerFlavor(new TaxDocumentFlavor())
    .registerFlavor(new GenericDocumentFlavor());
}
