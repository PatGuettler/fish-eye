#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createWorker } = require("tesseract.js");

const bytes = readFileSync(new URL("../schedulC.jpg", import.meta.url));
const worker = await createWorker("eng", 1, { logger: () => {} });

const allLines = [];
for (const psm of ["6", "11", "3"]) {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    user_defined_dpi: "300",
  });
  const { data } = await worker.recognize(bytes);
  const lines = (data.text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  allLines.push(...lines);
  const hits = lines.filter((l) => /\b13\b/i.test(l) || /you|vou/i.test(l));
  console.log(`PSM ${psm}:`, hits.slice(0, 12).join(" | "));
}

const you13 = [...new Set(allLines)].filter(
  (l) => /you|vou/i.test(l) && /\b(?:13|l3|I3)\b/i.test(l),
);
console.log("--- rows with You + 13:", you13);

await worker.terminate();
