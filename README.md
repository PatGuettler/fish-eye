# Schedule C import (fish-eye)

Client-side widget that reads an IRS **Schedule C** PDF and surfaces **lines 13, 30, and 31** so users can copy or drag values into another site. PDFs are parsed entirely in the browser; nothing is uploaded to a server.

**Live demo:** [https://patguettler.github.io/fish-eye/](https://patguettler.github.io/fish-eye/) (after GitHub Pages deploy)

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See the [LICENSE](LICENSE) file for the full text.

Under GPL-3.0 you may use, study, modify, and share this software under the same license. If you distribute modified versions or combine this code into a larger program, the combined work must also be licensed under GPL-3.0 and source must remain available to recipients as described in the license.

Third-party libraries (React, pdf.js, Tesseract.js, etc.) are subject to their own licenses; see `package-lock.json` for dependency details.

## How to use

### Standalone

Open the hosted app or run it locally:

```bash
npm install
npm run dev
```

Visit the URL Vite prints (usually `http://localhost:5173`). The upload dialog opens automatically. Drop or choose a fillable Schedule C PDF, then **drag** a value chip into your form or **click** a chip to copy it to the clipboard.

Fillable IRS forms work best. Scanned PDFs may use in-browser OCR and take longer on first run.

### Embed on your website

Host the built app (for example on GitHub Pages) and load the popup helper from your deployment:

```html
<script src="https://patguettler.github.io/fish-eye/embed-host.js" defer></script>
<button type="button" id="import-schedule-c">Import Schedule C</button>
```

```javascript
document.getElementById("import-schedule-c").addEventListener("click", () => {
  ScheduleCWidget.open({
  // baseUrl: "https://patguettler.github.io/fish-eye/", // optional; defaults to script directory
    onPopulate(payload) {
      // payload: { box13, box30, box31, raw?: { box13, box30, box31 } }
      document.querySelector('[data-field="scheduleC.box13"]').value =
        payload.raw?.box13?.trim() || String(payload.box13);
      // … map box30, box31 similarly
    },
  });
});
```

A fuller example with sample form fields is in [public/host-example.html](public/host-example.html).

**iframe only:** point an iframe at `embed.html?autoOpen=1&parentOrigin=https://your-site.com` and listen for messages with `listenForScheduleCMessages()` from [`src/integration/parentBridge.ts`](src/integration/parentBridge.ts). Always verify `event.origin` in production instead of using `*`.

Message types (source: `schedule-c-poc-widget`):

| Type | Meaning |
|------|---------|
| `SCHEDULE_C_POPULATE` | Parsed values in `payload` |
| `SCHEDULE_C_CLOSE` | User closed the widget |

## Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Unit tests (includes `f1040sc.pdf` fixture when present at repo root) |
| `npm run typecheck` | TypeScript check |

**GitHub Pages:** In repository **Settings → Pages**, set **Build and deployment** source to **GitHub Actions**, not “Deploy from a branch”. The workflow builds with Vite and publishes `dist/`.

For a project site (`username.github.io/repo-name/`), CI sets `VITE_BASE=/repo-name/`. For a user site (`username.github.io` repo), the base path is `/`.

## Contact

Questions, licensing, or embedding help:

**Patrick Guettler** — [patguettler@gmail.com](mailto:patguettler@gmail.com)

## Disclaimer

This tool is not affiliated with the IRS. It does not provide tax advice. Users are responsible for verifying extracted values against their official return.
