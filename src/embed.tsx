import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ScheduleCModal } from "./components/ScheduleCModal";
import { IrsScheduleCLinks } from "./components/IrsScheduleCLinks";
import { readEmbedSearchParams } from "./integration/embedConfig";
import "./index.css";

function EmbedApp() {
  const { parentOrigin, autoOpen } = readEmbedSearchParams();
  const [open, setOpen] = useState(autoOpen);

  if (!open) {
    return (
      <div className="embed-reopen">
        <p className="embed-reopen__title">Schedule C import</p>
        <button
          type="button"
          className="scm-btn primary"
          onClick={() => setOpen(true)}
        >
          Upload Schedule C
        </button>
        <IrsScheduleCLinks />
      </div>
    );
  }

  return (
    <ScheduleCModal
      open
      embedded
      onClose={() => setOpen(false)}
      parentOrigin={parentOrigin}
    />
  );
}

createRoot(document.getElementById("embed-root")!).render(
  <StrictMode>
    <EmbedApp />
  </StrictMode>,
);
