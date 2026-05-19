import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Browser/dev bundle must not include Node-only `createRequire` OCR. */
function tesseractNodeStubPlugin(): Plugin {
  const stubId = "\0fish-eye-tesseract-node-stub";
  return {
    name: "fish-eye-tesseract-node-stub",
    enforce: "pre",
    resolveId(source) {
      if (source.includes("tesseractClient.node")) {
        return stubId;
      }
    },
    load(id) {
      if (id !== stubId) return;
      return `export async function createOcrWorker() {
  throw new Error("Node OCR is not available in the browser bundle.");
}`;
    },
  };
}

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
  plugins: [react(), tesseractNodeStubPlugin()],
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
    include: ["tesseract.js/dist/tesseract.esm.min.js"],
  },
});
