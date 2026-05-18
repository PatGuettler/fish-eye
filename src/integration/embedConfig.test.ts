// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { readEmbedSearchParams } from "./embedConfig";

describe("readEmbedSearchParams", () => {
  const originalSearch = window.location.search;

  afterEach(() => {
    window.history.replaceState({}, "", `${window.location.pathname}${originalSearch}`);
  });

  it("defaults parentOrigin to * and autoOpen to true", () => {
    window.history.replaceState({}, "", window.location.pathname);
    expect(readEmbedSearchParams()).toEqual({
      parentOrigin: "*",
      autoOpen: true,
    });
  });

  it("reads parentOrigin and autoOpen=0 from query string", () => {
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?parentOrigin=${encodeURIComponent("https://patguettler.github.io")}&autoOpen=0`,
    );
    expect(readEmbedSearchParams()).toEqual({
      parentOrigin: "https://patguettler.github.io",
      autoOpen: false,
    });
  });
});
