import fs from "fs";
import { createWorker, PSM } from "tesseract.js";

const buf = fs.readFileSync("schedulC.jpg");
for (const [name, psm] of [["PSM_AUTO", PSM.AUTO], ["PSM_SPARSE", PSM.SPARSE_TEXT], ["PSM_SINGLE_BLOCK", PSM.SINGLE_BLOCK]]) {
  const worker = await createWorker("eng");
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const { data: { text } } = await worker.recognize(buf);
  await worker.terminate();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const hit = lines.filter((l) => /depreciat|\[13\]|^13\s|\b13\b.*\[/i.test(l) || /\b31\b|net profit|\[31\]/i.test(l) || /\[30\]|^30\s/.test(l));
  console.log("\n---", name, "lines", lines.length, "---");
  hit.slice(0, 15).forEach((l) => console.log(l));
}
