/** Supported document container formats (transport layer). */
export type DocumentFormatKind = "pdf" | "doc" | "txt" | "jpeg";

export const DOCUMENT_FORMAT_KINDS: readonly DocumentFormatKind[] = [
  "pdf",
  "doc",
  "txt",
  "jpeg",
] as const;
