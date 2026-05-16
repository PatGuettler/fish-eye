import { useEffect, useState } from "react";
import { ScheduleCModal } from "./components/ScheduleCModal";
import {
  MESSAGE_SOURCE,
  type ScheduleCPopulatePayload,
} from "./integration/parentBridge";

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
    <div className="demo-page">
      <header className="demo-header">
        <h1>Schedule C — parent portal (demo)</h1>
        <p className="scm-muted">
          Standalone: values update via the callback. When this UI is hosted in
          a parent page and the widget runs in an iframe, use{" "}
          <code>postMessage</code> (see <code>parentBridge.ts</code>) and verify{" "}
          <code>ev.origin</code>.
        </p>
      </header>

      <section className="demo-form" aria-label="Company form (demo)">
        <button
          type="button"
          className="scm-btn primary"
          onClick={() => setModalOpen(true)}
        >
          Upload Schedule C
        </button>
        <div className="demo-fields">
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

      <section className="demo-embed-wrap" aria-label="Iframe embed demo">
        <h2>Embedded widget (iframe)</h2>
        <p className="scm-muted">
          Open the child, upload a PDF — numbers should appear in the parent
          fields above via <code>postMessage</code>.
        </p>
        <iframe
          title="Embedded widget demo"
          className="demo-iframe"
          src={`${import.meta.env.BASE_URL}embed.html`}
          sandbox="allow-scripts allow-same-origin"
        />
      </section>

      <ScheduleCModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        parentOrigin="*"
        onPopulate={setFields}
      />
    </div>
  );
}
