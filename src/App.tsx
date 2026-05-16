import { useState } from "react";
import { ScheduleCModal } from "./components/ScheduleCModal";
import { IrsScheduleCLinks } from "./components/IrsScheduleCLinks";

function NavMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h10a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6M9 13h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <>
      <nav className="app-nav" aria-label="Primary">
        <div className="app-nav__brand">
          <div className="app-nav__mark" aria-hidden>
            <NavMark />
          </div>
          <p className="app-nav__title">Schedule C</p>
        </div>
        <span className="app-nav__pill">Client-side · No upload</span>
      </nav>

      <main className="app-shell app-shell--standalone">
        <header className="app-hero">
          <h1>Import Schedule C (lines 13, 30, 31)</h1>
          <p className="scm-muted">
            Upload a fillable IRS Schedule C PDF. Copy values into your return
            with drag-and-drop chips, or paste after clicking a value.
          </p>
          <IrsScheduleCLinks className="app-hero__links" />
          <button
            type="button"
            className="scm-btn primary"
            onClick={() => setModalOpen(true)}
          >
            Upload Schedule C
          </button>
        </header>
      </main>

      <ScheduleCModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
