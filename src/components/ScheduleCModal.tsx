import { useCallback, useState } from "react";
import {
  FORM_4562_MESSAGE,
  box13RequiresForm4562,
  type ScheduleCExtracted,
} from "../lib/scheduleCExtract";
import { parseScheduleCPdfBytes } from "../lib/pdfScheduleCParser";
import {
  postCloseToParent,
  postPopulateToParent,
} from "../integration/parentBridge";

const ACCEPT = "application/pdf";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Restrict postMessage target; use parent origin in production. */
  parentOrigin?: string;
  /** Same-window host (standalone) — iframe hosts rely on postMessage instead. */
  onPopulate?: (payload: ScheduleCExtracted) => void;
};

export function ScheduleCModal({
  open,
  onClose,
  parentOrigin = "*",
  onPopulate,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScheduleCExtracted | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setSource(null);
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (file.type && file.type !== ACCEPT) {
        setError("Please upload a PDF file.");
        return;
      }
      setBusy(true);
      setError(null);
      setData(null);
      try {
        const buf = await file.arrayBuffer();
        const result = await parseScheduleCPdfBytes(buf);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setData(result.data);
        setSource(result.source);
        if (box13RequiresForm4562(result.data.box13)) {
          window.alert(FORM_4562_MESSAGE);
        }
        onPopulate?.(result.data);
        postPopulateToParent(result.data, parentOrigin);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [onPopulate, parentOrigin],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  if (!open) return null;

  return (
    <div className="scm-overlay" role="presentation">
      <div className="scm-backdrop" onClick={onClose} aria-hidden />
      <div
        className="scm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scm-title"
      >
        <header className="scm-header">
          <h1 id="scm-title">Upload Schedule C</h1>
          <button
            type="button"
            className="scm-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div
          className="scm-dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <p>Drag and drop your Schedule C PDF here, or</p>
          <label className="scm-file-label">
            <input
              type="file"
              accept={ACCEPT}
              className="scm-file-input"
              disabled={busy}
              onChange={(e) => void handleFiles(e.target.files)}
            />
            Choose file
          </label>
          {busy && <p className="scm-muted">Processing…</p>}
          {error && <p className="scm-error">{error}</p>}
        </div>

        {data && (
          <section className="scm-results" aria-live="polite">
            <h2>Parsed values</h2>
            <p className="scm-muted">
              Source: {source}. Drag a chip into your portal if auto-fill did
              not land on the right control.
            </p>
            <ul className="scm-chips">
              <li>
                <DraggableChip label="Box 13" value={String(data.box13)} />
              </li>
              <li>
                <DraggableChip label="Box 30" value={String(data.box30)} />
              </li>
              <li>
                <DraggableChip label="Box 31" value={String(data.box31)} />
              </li>
            </ul>
            <div className="scm-actions">
              <button
                type="button"
                className="scm-btn primary"
                onClick={() => {
                  postPopulateToParent(data, parentOrigin);
                  postCloseToParent(parentOrigin);
                  reset();
                  onClose();
                }}
              >
                Done — close
              </button>
              <button type="button" className="scm-btn" onClick={reset}>
                Clear
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DraggableChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="scm-chip"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", value);
        e.dataTransfer.effectAllowed = "copy";
      }}
      title={`Drag ${label} into a field`}
    >
      <span className="scm-chip-label">{label}</span>
      <span className="scm-chip-value">{value}</span>
    </span>
  );
}
