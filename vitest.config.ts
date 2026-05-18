import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const pdfjsLegacy = resolve(
  projectRoot,
  "node_modules/pdfjs-dist/legacy/build/pdf.mjs",
);

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  resolve: {
    alias: {
      /** Node 18+ Vitest: modern pdf.js needs Promise.withResolvers (Node 22+). */
      "pdfjs-dist": pdfjsLegacy,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    testTimeout: 60_000,
    /** PDF.js + shared worker: avoid parallel parses flaking on the same fixture. */
    fileParallelism: false,
  },
});
