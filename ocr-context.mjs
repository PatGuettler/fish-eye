import fs from "fs";
import { createWorker, PSM } from "tesseract.js";

const buf = fs.readFileSync("schedulC.jpg");
const worker = await createWorker("eng");
await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
const { data: { text } } = await worker.recognize(buf);
await worker.terminate();

const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
function show(a, b) {
  console.log("\n=== lines " + a + "-" + b + " ===");
  for (let i = a - 1; i < Math.min(b, lines.length); i++) console.log(String(i + 1).padStart(4) + "| " + lines[i]);
}
show(70, 95);
show(105, 121);
