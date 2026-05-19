import fs from "fs";
import { createWorker, PSM } from "tesseract.js";

const buf = fs.readFileSync("schedulC.jpg");
const worker = await createWorker("eng");
await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
const { data: { text } } = await worker.recognize(buf);
await worker.terminate();

const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
console.log("Total lines:", lines.length);
const keys = ["13", "30", "31", "depreciat", "8829", "net profit", "tentative"];
for (const k of keys) {
  console.log("\n-- contains:", k);
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes(k.toLowerCase()) || new RegExp("\\b" + k + "\\b").test(l))
      console.log(String(i + 1).padStart(4), l);
  });
}
const money = lines.filter((l) => /\$\s*[\d,]+|[\d,]+\.\d{2}/.test(l));
console.log("\n-- lines with dollar-like amounts (" + money.length + ") --");
money.forEach((l) => console.log(l));
