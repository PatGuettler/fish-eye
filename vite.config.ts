import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** GitHub project Pages: set VITE_BASE=/repo-name/ in CI (trailing slash normalized). */
function viteBase(): string {
  const raw = process.env.VITE_BASE?.trim();
  if (!raw || raw === "." || raw === "./") return "/";
  let b = raw.startsWith("/") ? raw : `/${raw}`;
  if (!b.endsWith("/")) b = `${b}/`;
  return b;
}

export default defineConfig({
  plugins: [react()],
  base: viteBase(),
  worker: {
    format: "es",
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        embed: path.resolve(__dirname, "embed.html"),
      },
    },
  },
  optimizeDeps: {
    exclude: ["tesseract.js"],
  },
});
