/** Light contrast boost for OCR on photos (no fixed regions or form layout). */
export function preprocessCanvasForOcr(
  source: HTMLCanvasElement,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;

  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const contrast = 1.4;
  const bias = 128 * (1 - contrast);

  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    const c = Math.min(255, Math.max(0, g * contrast + bias));
    d[i] = c;
    d[i + 1] = c;
    d[i + 2] = c;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
