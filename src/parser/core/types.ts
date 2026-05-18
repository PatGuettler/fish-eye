/** A single draggable value surfaced to the host UI. */
export type ParsedDocumentItem = {
  id: string;
  label: string;
  value: string;
};

export type FormatParseFailure = {
  readonly ok: false;
  readonly error: string;
};

export type FormatParseSuccess<TContent> = {
  readonly ok: true;
  readonly content: TContent;
};

export type FormatParseOutcome<TContent> =
  | FormatParseSuccess<TContent>
  | FormatParseFailure;

export type FlavorParseFailure = FormatParseFailure;

export type FlavorParseSuccess<TData = unknown, TRaw = unknown> = {
  readonly ok: true;
  readonly data: TData;
  readonly raw: TRaw;
  readonly source: string;
  readonly items: ParsedDocumentItem[];
};

export type FlavorParseOutcome<TData = unknown, TRaw = unknown> =
  | FlavorParseSuccess<TData, TRaw>
  | FlavorParseFailure;
