// ============================================================
//  Bottom sheet / modal helper.
// ============================================================
import { el, frag } from "../utils.js";
import { icon } from "./icons.js";

/**
 * Open a bottom sheet.
 * @param {string} title
 * @param {Node|Node[]} body
 * @param {object} opts { onClose }
 * @returns {function} close()
 */
export function openSheet(title, body, opts = {}) {
  const scrim = el("div.scrim");
  const close = () => {
    scrim.remove();
    sheet.remove();
    document.removeEventListener("keydown", onKey);
    opts.onClose?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  const head = el("div.sheet__head", {}, [
    el("h2.h-section", { text: title }),
    el("button.iconbtn", { onclick: close, "aria-label": "Close" }, [frag(icon("close"))]),
  ]);

  const sheet = el("div.sheet", {}, [
    el("div.sheet__grip"),
    head,
    el("div", {}, Array.isArray(body) ? body : [body]),
  ]);

  scrim.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(scrim);
  document.body.appendChild(sheet);
  return close;
}

/** Simple confirm dialog. Returns a promise<boolean>. */
export function confirmSheet(title, message, { danger = false, okLabel = "Confirm" } = {}) {
  return new Promise((resolve) => {
    const body = el("div", {}, [
      el("p.muted", { text: message, style: { marginBottom: "18px", lineHeight: "1.5" } }),
      el("div.flex.gap-10", {}, [
        el("button.btn.btn--block", { onclick: () => { close(); resolve(false); } }, ["Cancel"]),
        el("button.btn.btn--block" + (danger ? ".btn--danger" : ".btn--volt"), { onclick: () => { close(); resolve(true); } }, [okLabel]),
      ]),
    ]);
    const close = openSheet(title, body, { onClose: () => resolve(false) });
  });
}
