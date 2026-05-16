import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ScheduleCModal } from "./components/ScheduleCModal";
import {
  IRS_SCHEDULE_C_ABOUT,
  IRS_SCHEDULE_C_PDF,
} from "./constants/irsScheduleC";
import "./index.css";

function EmbedApp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="embed-shell">
      <p className="embed-shell__hint">
        Widget runs here when embedded in your product.
      </p>
      <button
        type="button"
        className="scm-btn primary"
        onClick={() => setOpen(true)}
      >
        Upload Schedule C
      </button>
      <p className="embed-shell__links">
        <a
          className="embed-shell__pdf-link"
          href={IRS_SCHEDULE_C_PDF}
          target="_blank"
          rel="noopener noreferrer"
          download="f1040sc.pdf"
        >
          Download latest Schedule C (PDF)
        </a>
        <span aria-hidden> · </span>
        <a
          className="embed-shell__pdf-link"
          href={IRS_SCHEDULE_C_ABOUT}
          target="_blank"
          rel="noopener noreferrer"
        >
          IRS: About Schedule C
        </a>
      </p>
      <ScheduleCModal
        open={open}
        onClose={() => setOpen(false)}
        parentOrigin="*"
      />
    </div>
  );
}

createRoot(document.getElementById("embed-root")!).render(
  <StrictMode>
    <EmbedApp />
  </StrictMode>,
);
