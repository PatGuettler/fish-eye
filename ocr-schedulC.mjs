import fs from "fs";
import { createWorker } from "tesseract.js";

const buf = fs.readFileSync("schedulC.jpg");
const worker = await createWorker("eng");
const { data: { text } } = await worker.recognize(buf);
await worker.terminate();

const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

console.log("=== First 30 non-empty lines ===");
lines.slice(0, 30).forEach((l, i) => console.log(String(i + 1).padStart(3) + "| " + l));

const needles = ["13", "30", "31"];
console.log("\n=== Lines containing 13, 30, or 31 ===");
lines.forEach((l, i) => {
  if (needles.some((n) => l.includes(n))) console.log(String(i + 1).padStart(3) + "| " + l);
});

const amountRe = /\$?\s*[\d,]+\.?\d*/g;
console.log("\n=== Possible amounts on lines mentioning 13/30/31 ===");
for (const n of needles) {
  const hits = lines.filter((l) => new RegExp("\\b" + n + "\\b").test(l) || l.toLowerCase().includes("line " + n));
  for (const h of hits) {
    const amounts = h.match(amountRe) || [];
    console.log("ref " + n + ": " + h);
    if (amounts.length) console.log("  amounts: " + amounts.join(", "));
  }
}
