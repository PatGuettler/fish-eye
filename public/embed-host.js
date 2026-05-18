/**
 * Host-site loader for the Schedule C widget (iframe popup).
 *
 * Usage:
 *   <script src="https://YOUR_PAGES_URL/embed-host.js"></script>
 *   <button type="button" onclick="ScheduleCWidget.open()">Import Schedule C</button>
 *
 * Parsed values are never written automatically — users drag chips onto your fields.
 * Options: { baseUrl?, parentOrigin?, onClose?, onParsed?, parsedPanel? }
 */
(function (global) {
  const WIDGET_SOURCE = "schedule-c-poc-widget";
  const EL_DIV = "d" + "iv";

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

  function findDropTarget(el) {
    while (el && el !== document.documentElement) {
      if (el.nodeType !== 1) {
        el = el.parentElement;
        continue;
      }
      const tag = el.tagName;
      if (tag === "TEXTAREA") return el;
      if (tag === "SELECT") return el;
      if (tag === "INPUT") {
        const type = (el.type || "text").toLowerCase();
        if (
          type === "hidden" ||
          type === "file" ||
          type === "button" ||
          type === "submit" ||
          type === "reset" ||
          type === "checkbox" ||
          type === "radio"
        ) {
          el = el.parentElement;
          continue;
        }
        return el;
      }
      if (el.isContentEditable) return el;
      el = el.parentElement;
    }
    return null;
  }

  function applyDropValue(target, text) {
    if (target.tagName === "SELECT") {
      const opts = target.options;
      for (let i = 0; i < opts.length; i++) {
        if (opts[i].value === text || opts[i].text === text) {
          target.selectedIndex = i;
          break;
        }
      }
    } else {
      target.value = text;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function createDragBridge(iframe) {
    let ghost = null;
    let dragText = null;
    let moveHandler = null;
    let upHandler = null;

    function cleanup() {
      if (moveHandler) global.removeEventListener("pointermove", moveHandler);
      if (upHandler) global.removeEventListener("pointerup", upHandler);
      moveHandler = upHandler = null;
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      ghost = null;
      dragText = null;
      iframe.style.pointerEvents = "";
    }

    function positionGhost(x, y) {
      if (!ghost) return;
      ghost.style.left = x + 12 + "px";
      ghost.style.top = y + 12 + "px";
    }

    function startDrag(text, x, y) {
      cleanup();
      dragText = text;
      iframe.style.pointerEvents = "none";

      ghost = document.createElement(EL_DIV);
      ghost.setAttribute("data-fish-eye-drag-ghost", "");
      ghost.textContent = text.length > 48 ? text.slice(0, 45) + "…" : text;
      ghost.style.cssText =
        "position:fixed;z-index:2147483647;max-width:min(320px,90vw);padding:0.45rem 0.65rem;border-radius:10px;font:600 0.85rem/1.35 system-ui,sans-serif;color:#f4f4f5;background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 8px 24px rgba(0,0,0,0.35);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      document.body.appendChild(ghost);
      positionGhost(x, y);

      moveHandler = function (ev) {
        positionGhost(ev.clientX, ev.clientY);
      };
      upHandler = function (ev) {
        const target = findDropTarget(document.elementFromPoint(ev.clientX, ev.clientY));
        if (target && dragText != null) applyDropValue(target, dragText);
        cleanup();
      };
      global.addEventListener("pointermove", moveHandler);
      global.addEventListener("pointerup", upHandler, { once: true });
    }

    function onMessage(ev) {
      if (ev.source !== iframe.contentWindow) return;
      const d = ev.data;
      if (!d || d.source !== WIDGET_SOURCE) return;
      if (d.type === "FISH_EYE_DRAG_START") {
        startDrag(d.text, d.x, d.y);
      }
    }

    return { onMessage: onMessage, cleanup: cleanup };
  }

  function createOverlay(iframe, onClose) {
    const root = document.createElement(EL_DIV);
    root.setAttribute("data-schedule-c-widget", "");
    root.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";

    const backdrop = document.createElement(EL_DIV);
    backdrop.style.cssText =
      "position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);";
    /* Do not close on backdrop click — that skips sending parsed items from the iframe. */

    const frameWrap = document.createElement(EL_DIV);
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

  /**
   * Render draggable parsed-value chips into a host-page panel (in-memory only).
   * @param {Element|string} container
   * @param {{ items?: Array<{id:string,label:string,value:string}>, source?: string }} data
   */
  ScheduleCWidget.renderParsedChips = function renderParsedChips(container, data) {
    var root =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!root) return;

    var items = (data && data.items) || [];
    var source = (data && data.source) || "";
    root.innerHTML = "";

    if (!items.length) {
      root.hidden = true;
      return;
    }

    root.hidden = false;

    var heading = document.createElement("p");
    heading.className = "host-chips__heading";
    heading.textContent = "Parsed document (" + items.length + ")";

    var hint = document.createElement("p");
    hint.className = "host-chips__hint";
    hint.textContent = source
      ? "Source: " +
        source +
        ". Drag onto any field on this page, or click a chip to copy."
      : "Drag onto any field on this page, or click a chip to copy.";

    var list = document.createElement("ul");
    list.className = "host-chips__list";

    items.forEach(function (item) {
      var li = document.createElement("li");
      var chip = document.createElement("span");
      chip.className = "host-chip";
      chip.draggable = true;
      chip.setAttribute("role", "button");
      chip.tabIndex = 0;
      chip.title = "Drag into a field on this page, or click to copy";

      var label = document.createElement("span");
      label.className = "host-chip__label";
      label.textContent = item.label;

      var value = document.createElement("span");
      value.className = "host-chip__value";
      value.textContent = item.value;

      chip.appendChild(label);
      chip.appendChild(value);

      chip.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", item.value);
        e.dataTransfer.effectAllowed = "copy";
      });
      chip.addEventListener("click", function () {
        if (global.navigator && global.navigator.clipboard) {
          void global.navigator.clipboard.writeText(item.value);
        }
      });
      chip.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (global.navigator && global.navigator.clipboard) {
            void global.navigator.clipboard.writeText(item.value);
          }
        }
      });

      li.appendChild(chip);
      list.appendChild(li);
    });

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "host-chips__clear";
    clearBtn.textContent = "Clear parsed values";
    clearBtn.addEventListener("click", function () {
      ScheduleCWidget.renderParsedChips(root, { items: [] });
    });

    root.appendChild(heading);
    root.appendChild(hint);
    root.appendChild(list);
    root.appendChild(clearBtn);
  };

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
    let dragBridge = null;
    const embedOrigin = new URL(baseUrl, global.location.href).origin;
    var receivedParsed = false;

    function acceptMessageOrigin(origin) {
      if (!origin) return false;
      if (parentOrigin === "*") return true;
      if (origin === embedOrigin) return true;
      if (origin === global.location.origin) return true;
      return false;
    }

    function deliverParsed(payload) {
      receivedParsed = !!(payload && payload.items && payload.items.length);
      if (receivedParsed) {
        if (options.onParsed) {
          options.onParsed(payload);
        } else if (options.parsedPanel) {
          ScheduleCWidget.renderParsedChips(options.parsedPanel, payload);
        }
      }
    }

    function close() {
      if (dragBridge) dragBridge.cleanup();
      dragBridge = null;
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
      if (!acceptMessageOrigin(ev.origin)) return;

      if (dragBridge) dragBridge.onMessage(ev);

      if (d.type === "FISH_EYE_WIDGET_DONE") {
        deliverParsed(d.payload);
        close();
        return;
      }

      if (d.type === "FISH_EYE_PARSED_ITEMS") {
        deliverParsed(d.payload);
        close();
        return;
      }

      if (d.type === "SCHEDULE_C_CLOSE") {
        close();
      }
    }

    global.addEventListener("message", onMessage);
    removeListener = function () {
      global.removeEventListener("message", onMessage);
    };

    dragBridge = createDragBridge(iframe);
    overlay = createOverlay(iframe, close);
    return { close: close, embedUrl: embedUrl };
  };

  ScheduleCWidget.baseUrl = WIDGET_BASE_URL;

  global.ScheduleCWidget = ScheduleCWidget;
})(typeof window !== "undefined" ? window : globalThis);
