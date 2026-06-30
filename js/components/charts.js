// ============================================================
//  Hand-drawn SVG charts (no dependencies, offline-safe).
// ============================================================
import { frag } from "../utils.js";

const NS = "http://www.w3.org/2000/svg";

/** Line/area chart. points: [{label, value}] oldest→newest. */
export function lineChart(points, { height = 160, fmt = (v) => v } = {}) {
  const W = 320, H = height, padL = 8, padR = 8, padT = 14, padB = 22;
  const svg = frag(`<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"></svg>`);
  svg.removeAttribute("preserveAspectRatio");

  if (!points.length) return emptyChart(W, H);

  const vals = points.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;

  const x = (i) => padL + (i / Math.max(1, points.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

  // gradient def
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = `<linearGradient id="voltgrad" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="var(--volt)" stop-opacity="0.30"/>
    <stop offset="100%" stop-color="var(--volt)" stop-opacity="0"/></linearGradient>`;
  svg.appendChild(defs);

  // baseline
  const base = document.createElementNS(NS, "line");
  base.setAttribute("class", "axis");
  base.setAttribute("x1", padL); base.setAttribute("x2", W - padR);
  base.setAttribute("y1", H - padB); base.setAttribute("y2", H - padB);
  svg.appendChild(base);

  const dLine = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const dArea = `${dLine} L${x(points.length - 1).toFixed(1)} ${H - padB} L${x(0).toFixed(1)} ${H - padB} Z`;

  const area = document.createElementNS(NS, "path");
  area.setAttribute("class", "area"); area.setAttribute("d", dArea);
  svg.appendChild(area);

  const line = document.createElementNS(NS, "path");
  line.setAttribute("class", "line"); line.setAttribute("d", dLine);
  svg.appendChild(line);

  // points + first/last labels
  points.forEach((p, i) => {
    if (points.length <= 14 || i === 0 || i === points.length - 1) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "pt"); c.setAttribute("cx", x(i)); c.setAttribute("cy", y(p.value)); c.setAttribute("r", 3);
      svg.appendChild(c);
    }
  });

  addText(svg, padL, H - 6, fmt(points[0].value) + (points[0].label ? "  " + points[0].label : ""), "start");
  if (points.length > 1) {
    const last = points[points.length - 1];
    addText(svg, W - padR, H - 6, fmt(last.value) + (last.label ? "  " + last.label : ""), "end");
  }
  addText(svg, W - padR, padT - 2, "max " + fmt(Math.max(...vals)), "end", true);
  return svg;
}

/** Horizontal bar chart for category totals. data:[{label,value}] */
export function barChart(data, { fmt = (v) => v } = {}) {
  if (!data.length) return emptyChart(320, 120);
  const rowH = 34, gap = 10, W = 320;
  const H = data.length * rowH + (data.length - 1) * gap + 6;
  const max = Math.max(...data.map((d) => d.value), 1);
  const svg = frag(`<svg class="chart" viewBox="0 0 ${W} ${H}"></svg>`);
  const labelW = 70, barX = labelW + 6, barW = W - barX - 46;

  data.forEach((d, i) => {
    const y = i * (rowH + gap);
    addText(svg, 0, y + rowH / 2 + 4, d.label, "start");
    rect(svg, barX, y + 6, barW, rowH - 12, 6, "barbg");
    const w = Math.max(3, (d.value / max) * barW);
    rect(svg, barX, y + 6, w, rowH - 12, 6, "bar");
    addText(svg, W, y + rowH / 2 + 4, fmt(d.value), "end");
  });
  return svg;
}

/** GitHub-style calendar heat strip for the last `weeks` weeks. */
export function calendarHeat(trainingSet, weeks = 16) {
  const cell = 13, gap = 3, cols = weeks, rows = 7;
  const W = cols * (cell + gap), H = rows * (cell + gap);
  const svg = frag(`<svg class="chart" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px"></svg>`);
  const today = new Date();
  const day = today.getDay(); // 0 Sun
  // start from the Sunday `weeks-1` weeks ago
  const start = new Date(today); start.setDate(today.getDate() - day - (weeks - 1) * 7);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const d = new Date(start); d.setDate(start.getDate() + c * 7 + r);
      if (d > today) continue;
      const iso = d.toISOString().slice(0, 10);
      const on = trainingSet.has(iso);
      const el = document.createElementNS(NS, "rect");
      el.setAttribute("x", c * (cell + gap)); el.setAttribute("y", r * (cell + gap));
      el.setAttribute("width", cell); el.setAttribute("height", cell); el.setAttribute("rx", 3);
      el.setAttribute("fill", on ? "var(--volt)" : "var(--surface-2)");
      svg.appendChild(el);
    }
  }
  return svg;
}

// ---- helpers ----
function addText(svg, x, y, text, anchor = "start", dim = false) {
  const t = document.createElementNS(NS, "text");
  t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", anchor);
  if (dim) t.setAttribute("opacity", "0.6");
  t.textContent = text;
  svg.appendChild(t);
  return t;
}
function rect(svg, x, y, w, h, r, cls) {
  const el = document.createElementNS(NS, "rect");
  el.setAttribute("x", x); el.setAttribute("y", y); el.setAttribute("width", w); el.setAttribute("height", h);
  el.setAttribute("rx", r); el.setAttribute("class", cls);
  svg.appendChild(el);
}
function emptyChart(W, H) {
  const svg = frag(`<svg class="chart" viewBox="0 0 ${W} ${H}"></svg>`);
  addText(svg, W / 2, H / 2, "No data yet", "middle");
  return svg;
}
