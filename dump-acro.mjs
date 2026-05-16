import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs").href;
const data = new Uint8Array(readFileSync("f1040sc.pdf"));
const pdf = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const annotations = await page.getAnnotations({ intent: "display" });
  for (const a of annotations) {
    if (a.subtype !== "Widget") continue;
    const fieldName = String(a.fieldName ?? "").trim();
    const fieldValue = a.fieldValue == null || a.fieldValue === "" ? "" : String(a.fieldValue);
    if (/13|30|31/.test(fieldName) || /13|30|31/.test(fieldValue)) {
      console.log(fieldName + " => " + JSON.stringify(fieldValue));
    }
  }
}
