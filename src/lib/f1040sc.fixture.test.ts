// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import * as pdfjs from "pdfjs-dist";
import { parseScheduleCPdfBytes } from "./pdfScheduleCParser";

/** fish-eye/f1040sc.pdf — stable whether cwd is fish-eye or monorepo root */
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PDF_PATH = resolve(PROJECT_ROOT, "f1040sc.pdf");
const WORKER_PATH = resolve(
  PROJECT_ROOT,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);

beforeAll(() => {
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(WORKER_PATH).href;
});

describe("f1040sc.pdf fixture (Schedule C boxes 13, 30, 31)", () => {
  it("parses expected raw AcroForm strings (20 sequential runs)", async () => {
    if (!existsSync(PDF_PATH)) {
      throw new Error(
        `Missing ${PDF_PATH}. Expected fish-eye/f1040sc.pdf next to package.json.`,
      );
    }
    const fileBuf = readFileSync(PDF_PATH);
    const toAb = () =>
      fileBuf.buffer.slice(
        fileBuf.byteOffset,
        fileBuf.byteOffset + fileBuf.byteLength,
      );

    for (let i = 0; i < 20; i++) {
      const result = await parseScheduleCPdfBytes(toAb());
      expect(result.ok, JSON.stringify(result)).toBe(true);
      if (!result.ok) continue;
      expect(result.raw.box13, `run ${i}`).toBe("You 13");
      expect(result.raw.box30, `run ${i}`).toBe("you 30");
      expect(result.raw.box31, `run ${i}`).toBe("you 31");
      expect(result.data.box13, `run ${i}`).toBe(0);
      expect(result.data.box30, `run ${i}`).toBe(0);
      expect(result.data.box31, `run ${i}`).toBe(0);
    }
  });
});
