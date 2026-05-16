import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ScheduleCModal } from "./components/ScheduleCModal";
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
