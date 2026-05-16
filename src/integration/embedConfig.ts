/** Query params for embed.html when loaded in an iframe. */
export function readEmbedSearchParams(): {
  parentOrigin: string;
  autoOpen: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const parentOrigin = params.get("parentOrigin")?.trim() || "*";
  const autoOpen = params.get("autoOpen") !== "0";
  return { parentOrigin, autoOpen };
}
