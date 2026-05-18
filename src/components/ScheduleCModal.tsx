import { useCallback, useEffect, useRef, useState } from "react";
import {
  FORM_4562_MESSAGE,
  box13RequiresForm4562,
} from "../lib/scheduleCExtract";
import type { ParsedDocumentItem } from "../lib/parsedDocumentItems";
import {
  detectDocumentFormat,
  parseScheduleCDocument,
} from "../lib/parseScheduleCDocument";
import {
  needsCrossFrameDrag,
  postDragStartToParent,
  postWidgetDoneToParent,
} from "../integration/parentBridge";

const ACCEPT = "application/pdf,image/jpeg,.jpg,.jpeg";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Restrict postMessage target; use parent origin in production. */
  parentOrigin?: string;
  /** Loaded inside an iframe on a host site (embed.html). */
  embedded?: boolean;
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
  embedded = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedDocumentItem[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);
  const itemsRef = useRef<ParsedDocumentItem[]>([]);
  const sourceRef = useRef<string | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  const inHostEmbed = embedded || needsCrossFrameDrag();
  const crossFrameDrag = inHostEmbed;

  const reset = useCallback(() => {
    setError(null);
    setItems([]);
    setSource(null);
  }, []);

  const sendParsedToHostAndClose = useCallback(() => {
    if (inHostEmbed) {
      const snapshot = itemsRef.current;
      postWidgetDoneToParent(
        {
          items: snapshot.map((item) => ({ ...item })),
          source: sourceRef.current ?? undefined,
        },
        parentOrigin,
      );
    }
    onClose();
  }, [inHostEmbed, onClose, parentOrigin]);

  const handleClose = sendParsedToHostAndClose;

  const handleFiles = useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const format = detectDocumentFormat(buf, file.type || undefined);
    if (!format) {
      setError("Please upload a PDF or JPEG (.jpg) image of your Schedule C.");
      return;
    }
    setBusy(true);
    setError(null);
    setItems([]);
    try {
      const result = await parseScheduleCDocument(buf, format);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.items);
      setSource(result.source);
      if (box13RequiresForm4562(result.data.box13)) {
        window.alert(FORM_4562_MESSAGE);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

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
    <div
      className={`scm-overlay${embedded ? " scm-overlay--embedded" : ""}`}
      role="presentation"
    >
      <div className="scm-backdrop" onClick={handleClose} aria-hidden />
      <section
        className="scm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scm-title"
        aria-describedby="scm-desc"
      >
        <header className="scm-header">
          <section className="scm-header__text">
            <h1 id="scm-title">Upload Schedule C</h1>
            <p id="scm-desc" className="scm-subtitle">
              PDF or photo stays in this browser only — nothing is saved or sent
              to a server.
            </p>
          </section>
          <button
            type="button"
            className="scm-icon-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
        </header>

        <section
          className={`scm-dropzone${dragActive ? " scm-dropzone--active" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        >
          <section className="scm-dropzone__icon">
            <UploadIcon />
          </section>
          <p className="scm-dropzone__title">Drop your Schedule C PDF or photo</p>
          <p className="scm-dropzone__hint">
            or browse — fillable IRS PDFs work best; photos use in-browser OCR.
          </p>
          <section className="scm-file-row">
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
          </section>
          {busy && (
            <section className="scm-spinner-wrap" role="status">
              <span className="scm-spinner" aria-hidden />
              <section>
                <p className="scm-spinner-title">Parsing…</p>
                <p className="scm-spinner-hint">
                  Photos and scanned PDFs use in-browser OCR (first run may take
                  ~30–60s).
                </p>
              </section>
            </section>
          )}
          {error && <p className="scm-error">{error}</p>}
        </section>

        {items.length > 0 && (
          <section className="scm-results" aria-live="polite">
            <h2>Parsed document ({items.length})</h2>
            <p className="scm-muted">
              Source: <strong>{source}</strong>.{" "}
              {crossFrameDrag
                ? "Close this popup (✕) to show all values in the import panel on your page, then drag them into any field."
                : "Drag a value into a field on this page, or click to copy."}
            </p>
            <ul className="scm-chips scm-chips--scroll">
              {items.map((item) => (
                <li key={item.id}>
                  <DraggableChip
                    label={item.label}
                    value={item.value}
                    crossFrameDrag={crossFrameDrag}
                    parentOrigin={parentOrigin}
                  />
                </li>
              ))}
            </ul>
            <section className="scm-actions">
              <button
                type="button"
                className="scm-btn primary"
                onClick={() => {
                  if (!crossFrameDrag) reset();
                  handleClose();
                }}
              >
                {crossFrameDrag ? "Use on page — close" : "Done — close"}
              </button>
              <button type="button" className="scm-btn" onClick={reset}>
                Clear
              </button>
            </section>
          </section>
        )}
      </section>
    </div>
  );
}

function DraggableChip({
  label,
  value,
  crossFrameDrag,
  parentOrigin,
}: {
  label: string;
  value: string;
  crossFrameDrag: boolean;
  parentOrigin: string;
}) {
  const onCopy = () => void navigator.clipboard?.writeText(value);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!crossFrameDrag || e.button !== 0) return;
    e.preventDefault();
    postDragStartToParent(value, e.clientX, e.clientY, parentOrigin);
  };

  return (
    <span
      className={`scm-chip${crossFrameDrag ? " scm-chip--bridge" : ""}`}
      draggable={!crossFrameDrag}
      role="button"
      tabIndex={0}
      onClick={onCopy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCopy();
        }
      }}
      onPointerDown={onPointerDown}
      onDragStart={(e) => {
        if (crossFrameDrag) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("text/plain", value);
        e.dataTransfer.effectAllowed = "copy";
      }}
      title={
        crossFrameDrag
          ? `Drag onto a field on your page, or click to copy`
          : `Drag or click to copy`
      }
    >
      <span className="scm-chip-label">{label}</span>
      <span className="scm-chip-value">{value}</span>
    </span>
  );
}
