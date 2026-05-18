import { copyFileSync, existsSync } from "node:fs";

/** Belt-and-suspenders: demo pages must exist in dist for GitHub Pages. */
const pages = ["irs-demo.html", "host-example.html", "embed-host.js", "404.html"];

for (const name of pages) {
  const dest = `dist/${name}`;
  if (existsSync(dest)) continue;
  const src = existsSync(name) ? name : `public/${name}`;
  if (!existsSync(src)) {
    console.warn(`ensure-static-pages: missing ${src}`);
    continue;
  }
  copyFileSync(src, dest);
  console.log(`ensure-static-pages: copied ${src} -> ${dest}`);
}
