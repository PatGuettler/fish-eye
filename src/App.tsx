import { useEffect, useState } from "react";
import { ScheduleCModal } from "./components/ScheduleCModal";
import {
  IRS_SCHEDULE_C_ABOUT,
  IRS_SCHEDULE_C_PDF,
} from "./constants/irsScheduleC";
import {
  MESSAGE_SOURCE,
  type ScheduleCPopulatePayload,
} from "./integration/parentBridge";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [fields, setFields] = useState<ScheduleCPopulatePayload>({
    box13: 0,
    box30: 0,
    box31: 0,
  });

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const d = ev.data;
      if (!d || d.source !== MESSAGE_SOURCE) return;
      if (d.type === "SCHEDULE_C_POPULATE") {
        setFields(d.payload);
      }
      if (d.type === "SCHEDULE_C_CLOSE") {
        setModalOpen(false);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <>
      <nav className="app-nav" aria-label="Primary">
        <div className="app-nav__brand">
          <div className="app-nav__mark" aria-hidden>
            <NavMark />
          </div>
          <div className="app-nav__titles">
            <p className="app-nav__title">Schedule C intake</p>
            <span className="app-nav__tag">Demo portal</span>
          </div>
        </div>
        <span className="app-nav__pill">Client-side · No upload</span>
      </nav>

      <div className="app-shell">
        <header className="app-hero">
          <h1>Pull Schedule C lines into your workflow</h1>
          <p className="scm-muted">
            In standalone mode, values sync through the host callback. When the
            widget runs in an iframe, use <code>postMessage</code> (see{" "}
            <code>parentBridge.ts</code>) and always validate{" "}
            <code>ev.origin</code> in production.
          </p>
          <div className="app-hero__actions">
            <a
              className="scm-btn scm-btn--ghost"
              href={IRS_SCHEDULE_C_PDF}
              target="_blank"
              rel="noopener noreferrer"
              download="f1040sc.pdf"
            >
              Download latest Schedule C (PDF)
            </a>
            <a
              className="scm-btn scm-btn--link"
              href={IRS_SCHEDULE_C_ABOUT}
              target="_blank"
              rel="noopener noreferrer"
            >
              About Schedule C — IRS
            </a>
          </div>
        </header>

        <div className="app-grid">
          <section className="app-card app-card--form" aria-label="Company form">
            <div className="app-card__head">
              <div>
                <h2>Return preview</h2>
                <p>Boxes 13, 30, and 31 — edit or receive from the widget.</p>
              </div>
              <button
                type="button"
                className="scm-btn primary"
                onClick={() => setModalOpen(true)}
              >
                Upload Schedule C
              </button>
            </div>
            <div className="app-field-grid">
              <label>
                Box 13
                <input
                  className="demo-input"
                  data-field="scheduleC.box13"
                  value={fields.box13}
                  onChange={(e) =>
                    setFields((f) => ({
                      ...f,
                      box13: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Box 30
                <input
                  className="demo-input"
                  data-field="scheduleC.box30"
                  value={fields.box30}
                  onChange={(e) =>
                    setFields((f) => ({
                      ...f,
                      box30: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Box 31
                <input
                  className="demo-input"
                  data-field="scheduleC.box31"
                  value={fields.box31}
                  onChange={(e) =>
                    setFields((f) => ({
                      ...f,
                      box31: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
            </div>
          </section>

          <section
            className="app-card app-card--embed"
            aria-label="Iframe embed demo"
          >
            <div className="app-card__head">
              <div>
                <h2>Embedded widget</h2>
                <p>
                  Open the child frame, upload a PDF — values post to the
                  preview above.
                </p>
              </div>
            </div>
            <iframe
              title="Embedded widget demo"
              className="demo-iframe"
              src={`${import.meta.env.BASE_URL}embed.html`}
              sandbox="allow-scripts allow-same-origin"
            />
          </section>
        </div>

        <ScheduleCModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          parentOrigin="*"
          onPopulate={setFields}
        />
      </div>
    </>
  );
}
