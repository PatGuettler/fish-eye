import Tesseract from "tesseract.js/dist/tesseract.esm.min.js";
import workerPath from "tesseract.js/dist/worker.min.js?url";
import type { TesseractWorkerOptions } from "./tesseractClient.types";

export async function createOcrWorker() {
  const options: TesseractWorkerOptions = {
    logger: () => {},
    workerPath,
  };
  return Tesseract.createWorker("eng", 1, options);
}
