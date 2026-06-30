// ============================================================
//  GymLog bootstrap — shell, hash router, theme, service worker.
// ============================================================
import { el, frag, clear } from "./utils.js";
import { icon } from "./components/icons.js";
import { settings, subscribe, active } from "./state.js";

import { renderToday } from "./views/today.js";
import { renderLog } from "./views/log.js";
import { renderLibrary, renderExercise } from "./views/library.js";
import { renderBody } from "./views/body.js";
import { renderProgress } from "./views/progress.js";
import { renderSettings } from "./views/settings.js";

const NAV = [
  { route: "today", label: "Today", ic: "today" },
  { route: "log", label: "Log", ic: "log" },
  { route: "library", label: "Library", ic: "library" },
  { route: "body", label: "Body", ic: "body" },
  { route: "progress", label: "Progress", ic: "progress" },
];

const ROUTES = {
  today: renderToday,
  log: renderLog,
  library: renderLibrary,
  exercise: renderExercise,
  body: renderBody,
  progress: renderProgress,
  settings: renderSettings,
};

let content, navBar;
let lastRoute = null;

function applyTheme() {
  document.documentElement.dataset.theme = settings().theme || "dark";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", settings().theme === "light" ? "#f4f5f3" : "#0e0f13");
}

function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [route, ...rest] = h.split("/");
  return { route: route || "today", param: rest.join("/") };
}

export function navigate(path) {
  location.hash = "#/" + path;
}

function buildShell() {
  const app = document.getElementById("app");
  clear(app);
  content = el("main.view");
  navBar = el("nav.nav");
  const shell = el("div.shell", {}, [content, navBar]);
  app.appendChild(shell);
  renderNav("today");
}

function renderNav(activeRoute) {
  clear(navBar);
  for (const n of NAV) {
    const item = el(
      "a.nav__item" + (n.route === activeRoute ? ".active" : ""),
      { href: "#/" + n.route },
      [frag(icon(n.ic)), el("span", { text: n.label }), el("div.nav__dot")]
    );
    navBar.appendChild(item);
  }
}

function renderRoute() {
  const { route, param } = parseHash();
  const fn = ROUTES[route] || renderToday;
  applyTheme();

  const sameRoute = lastRoute === route + ":" + param;
  const keepScroll = lastRoute && lastRoute.split(":")[0] === route ? window.scrollY : 0;

  clear(content);
  // exercise detail shares the "library" nav highlight
  const navKey = route === "exercise" ? "library" : route;
  renderNav(NAV.some((n) => n.route === navKey) ? navKey : "today");

  let out;
  try {
    out = fn(param);
  } catch (e) {
    console.error("Render error:", e);
    out = el("div.empty", {}, [el("h3", { text: "Something went wrong" }), el("p", { text: String(e.message || e) })]);
  }
  if (out) content.appendChild(out);

  // restore/scroll
  if (sameRoute) window.scrollTo(0, keepScroll);
  else window.scrollTo(0, 0);

  lastRoute = route + ":" + param;
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW failed", e));
    });
  }
}

function boot() {
  applyTheme();
  buildShell();
  if (!location.hash) location.replace("#/today");
  renderRoute();
  window.addEventListener("hashchange", renderRoute);
  subscribe(() => renderRoute());
  registerSW();
}

boot();
