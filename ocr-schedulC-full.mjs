import fs from "fs";
import { createWorker } from "tesseract.js";

const buf = fs.readFileSync("schedulC.jpg");
const worker = await createWorker("eng");
const { data: { text } } = await worker.recognize(buf);
await worker.terminate();

fs.writeFileSync("ocr-schedulC-full.txt", text);
const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
console.log("Total non-empty lines:", lines.length);
console.log("\n=== ALL LINES ===");
lines.forEach((l, i) => console.log(String(i + 1).padStart(3) + "| " + l));

const patterns = [
  { label: "line 13 / [13]", re: /\b13\b|\[13\]|^13\s|depreciat/i },
  { label: "line 30 / [30]", re: /\b30\b|\[30\]|^30\s|business use of your home/i },
  { label: "line 31 / [31]", re: /\b31\b|\[31\]|^31\s|net profit|profit or \(loss\)/i },
];
for (const { label, re } of patterns) {
  console.log("\n=== Matches:", label, "===");
  lines.forEach((l, i) => {
    if (re.test(l)) console.log(String(i + 1).padStart(3) + "| " + l);
  });
}
