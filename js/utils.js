// ============================================================
//  Tiny DOM + formatting helpers (no framework)
// ============================================================

/** Hyperscript: el("div.card", {onclick}, [children]) */
export function el(tag, props = {}, children = []) {
  // tag supports "div.class1.class2#id"
  let id = null;
  const classes = [];
  const m = tag.match(/^([a-zA-Z0-9]+)((?:[.#][\w-]+)*)$/);
  let name = "div";
  if (m) {
    name = m[1];
    const rest = m[2] || "";
    rest.split(/(?=[.#])/).forEach((tok) => {
      if (tok.startsWith(".")) classes.push(tok.slice(1));
      else if (tok.startsWith("#")) id = tok.slice(1);
    });
  } else {
    name = tag;
  }
  const node = document.createElement(name);
  if (id) node.id = id;
  if (classes.length) node.className = classes.join(" ");

  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = (node.className ? node.className + " " : "") + v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in node && k !== "list") { try { node[k] = v; } catch { node.setAttribute(k, v); } }
    else node.setAttribute(k, v);
  }

  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  const arr = Array.isArray(children) ? children : [children];
  for (const c of arr) {
    if (c == null || c === false) continue;
    if (typeof c === "string" || typeof c === "number") node.appendChild(document.createTextNode(String(c)));
    else if (c instanceof Node) node.appendChild(c);
    else if (Array.isArray(c)) appendChildren(node, c);
  }
}

/** Parse a fragment of trusted SVG/HTML markup into a node. */
export function frag(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------- ids / numbers ----------
let _c = 0;
export const uid = () => `${Date.now().toString(36)}${(_c++).toString(36)}${Math.floor(performance.now() % 1000).toString(36)}`;
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const round = (n, step = 0.5) => Math.round(n / step) * step;
export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + f(b), 0);

// ---------- units ----------
export const KG_PER_LB = 0.45359237;
export const toDisplayWeight = (kg, units) => (units === "lb" ? kg / KG_PER_LB : kg);
export const fromDisplayWeight = (val, units) => (units === "lb" ? val * KG_PER_LB : val);
export const fmtWeight = (kg, units) => {
  if (kg == null) return "—";
  const v = toDisplayWeight(kg, units);
  return `${(Math.round(v * 10) / 10).toString().replace(/\.0$/, "")} ${units}`;
};

// estimated 1-rep max (Epley), input + output both in kg
export const epley1RM = (weightKg, reps) => {
  if (!weightKg || !reps) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
};

// ---------- dates ----------
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const dateISO = (d) => d.toISOString().slice(0, 10);
export const parseISO = (s) => new Date(s + "T00:00:00");
export function daysBetween(aISO, bISO) {
  const a = parseISO(aISO), b = parseISO(bISO);
  return Math.round((b - a) / 86400000);
}
export function relDay(iso) {
  const d = daysBetween(iso, todayISO());
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return fmtDate(iso);
}
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function fmtDate(iso) {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
export function fmtClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// ---------- misc ----------
export const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export function haptic(ms = 12) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch {} }
}

let toastTimer;
export function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = el("div.toast", { text: msg });
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2600);
}
