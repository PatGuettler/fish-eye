import { useCallback, useRef, useState } from "react";
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

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);

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
      dragDepth.current = 0;
      setDragActive(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragActive(false);
    }
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
        aria-describedby="scm-desc"
      >
        <header className="scm-header">
          <div className="scm-header__text">
            <h1 id="scm-title">Upload Schedule C</h1>
            <p id="scm-desc" className="scm-subtitle">
              PDF stays in this browser — nothing is sent to a server.
            </p>
          </div>
          <button
            type="button"
            className="scm-icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
        </header>

        <div
          className={`scm-dropzone${dragActive ? " scm-dropzone--active" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        >
          <div className="scm-dropzone__icon">
            <UploadIcon />
          </div>
          <p className="scm-dropzone__title">Drop your Schedule C PDF</p>
          <p className="scm-dropzone__hint">
            or browse — fillable IRS forms work best.
          </p>
          <div className="scm-file-row">
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
          </div>
          {busy && (
            <div className="scm-spinner-wrap" role="status">
              <div className="scm-spinner" />
              <div>
                <p className="scm-spinner-title">Parsing…</p>
                <p className="scm-spinner-hint">
                  Scanned PDFs use in-browser OCR (first run may take ~30–60s).
                </p>
              </div>
            </div>
          )}
          {error && <p className="scm-error">{error}</p>}
        </div>

        {data && (
          <section className="scm-results" aria-live="polite">
            <h2>Parsed values</h2>
            <p className="scm-muted">
              Source: <strong>{source}</strong>. Drag a chip into your portal if
              auto-fill missed a control.
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
