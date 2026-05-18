import { copyFileSync, existsSync } from "node:fs";

/** Belt-and-suspenders: demo pages must exist in dist for GitHub Pages. */
const pages = [
  "irs-demo.html",
  "host-example.html",
  "embed-host.js",
  "host-chips.css",
  "404.html",
  "github-pages-check.html",
];

/** Vite may emit HTML under dist/public/; these must land at dist root for Pages URLs. */
const forceCopy = new Set(["irs-demo.html", "host-example.html"]);

for (const name of pages) {
  const dest = `dist/${name}`;
  const src = existsSync(name) ? name : `public/${name}`;
  if (!existsSync(src)) {
    console.warn(`ensure-static-pages: missing ${src}`);
    continue;
  }
  if (existsSync(dest) && !forceCopy.has(name)) continue;
  copyFileSync(src, dest);
  console.log(`ensure-static-pages: copied ${src} -> ${dest}`);
}
