import { describe, expect, it } from "vitest";
import {
  downscaleDimensions,
  isJpegBytes,
} from "./decodeImage";

describe("decodeImage", () => {
  it("isJpegBytes recognizes JPEG SOI marker", () => {
    expect(isJpegBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer)).toBe(
      true,
    );
    expect(isJpegBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer)).toBe(
      false,
    );
  });

  it("downscaleDimensions preserves aspect ratio under max edge", () => {
    expect(downscaleDimensions(4000, 2000, 2500)).toEqual({
      width: 2500,
      height: 1250,
    });
    expect(downscaleDimensions(800, 600, 2500)).toEqual({
      width: 800,
      height: 600,
    });
  });
});
