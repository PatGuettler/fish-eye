/**
 * Host-site loader for the Schedule C widget (iframe popup).
 *
 * Usage:
 *   <script src="https://YOUR_PAGES_URL/embed-host.js"></script>
 *   <button type="button" onclick="ScheduleCWidget.open()">Import Schedule C</button>
 *
 * Options: { baseUrl?, parentOrigin?, onPopulate?, onClose? }
 */
(function (global) {
  const WIDGET_SOURCE = "schedule-c-poc-widget";

  /** Resolved when this file loads — do not use document.currentScript inside open(). */
  const WIDGET_BASE_URL = (function resolveBaseAtLoad() {
    const el = document.currentScript;
    if (el && el.src) {
      return new URL(".", el.src).href;
    }
    const tagged = document.querySelector('script[src*="embed-host.js"]');
    if (tagged && tagged.src) {
      return new URL(".", tagged.src).href;
    }
    return new URL(".", global.location.href).href;
  })();

  function normalizeBase(url) {
    return String(url).replace(/\/?$/, "/");
  }

  function widgetBaseUrl(options) {
    if (options && options.baseUrl) {
      return normalizeBase(options.baseUrl);
    }
    return normalizeBase(WIDGET_BASE_URL);
  }

  function createOverlay(iframe, onClose) {
    const root = document.createElement("div");
    root.setAttribute("data-schedule-c-widget", "");
    root.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";

    const backdrop = document.createElement("div");
    backdrop.style.cssText =
      "position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);";
    backdrop.addEventListener("click", onClose);

    const frameWrap = document.createElement("div");
    frameWrap.style.cssText =
      "position:relative;z-index:1;width:min(560px,100%);height:min(720px,92vh);border-radius:20px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.08);";
    iframe.style.cssText =
      "width:100%;height:100%;border:0;display:block;background:#09090b;";
    frameWrap.appendChild(iframe);
    root.appendChild(backdrop);
    root.appendChild(frameWrap);
    document.body.appendChild(root);
    return root;
  }

  function ScheduleCWidget() {}

  ScheduleCWidget.open = function open(options) {
    options = options || {};
    const baseUrl = widgetBaseUrl(options);
    const parentOrigin =
      options.parentOrigin != null ? options.parentOrigin : global.location.origin;
    const embedUrl =
      baseUrl + "embed.html?autoOpen=1&parentOrigin=" + encodeURIComponent(parentOrigin);

    const iframe = document.createElement("iframe");
    iframe.title = "Schedule C import";
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-downloads",
    );
    iframe.src = embedUrl;

    let overlay = null;
    let removeListener = null;
    const embedOrigin = new URL(baseUrl).origin;

    function close() {
      if (removeListener) removeListener();
      removeListener = null;
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      options.onClose && options.onClose();
    }

    function onMessage(ev) {
      if (ev.source !== iframe.contentWindow) return;
      const d = ev.data;
      if (!d || d.source !== WIDGET_SOURCE) return;
      if (parentOrigin !== "*" && ev.origin !== embedOrigin) return;

      if (d.type === "SCHEDULE_C_POPULATE") {
        options.onPopulate && options.onPopulate(d.payload);
      }
      if (d.type === "SCHEDULE_C_CLOSE") {
        close();
      }
    }

    global.addEventListener("message", onMessage);
    removeListener = function () {
      global.removeEventListener("message", onMessage);
    };

    overlay = createOverlay(iframe, close);
    return { close: close, embedUrl: embedUrl };
  };

  ScheduleCWidget.baseUrl = WIDGET_BASE_URL;

  global.ScheduleCWidget = ScheduleCWidget;
})(typeof window !== "undefined" ? window : globalThis);
