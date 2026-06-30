// ============================================================
//  Body — bodyweight + measurements, trends
// ============================================================
import { el, frag, todayISO, fmtDate, toDisplayWeight, fromDisplayWeight, fmtWeight, toast, haptic } from "../utils.js";
import { icon } from "../components/icons.js";
import { lineChart } from "../components/charts.js";
import { confirmSheet } from "../components/sheet.js";
import { settings, bodyLogs, logBody, deleteBody } from "../state.js";

const MEASURES = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "arms", label: "Arms" },
  { key: "thighs", label: "Thighs" },
  { key: "shoulders", label: "Shoulders" },
];

export function renderBody() {
  const s = settings();
  const logs = bodyLogs();
  const latest = logs[logs.length - 1];
  const root = el("div.stagger");

  root.appendChild(el("div.pagehead", {}, [el("div", {}, [
    el("div.h-eyebrow", { text: "Measurements" }),
    el("h1.h-display.mt-8", { text: "Body" }),
  ])]));

  // ---- entry form ----
  const draft = {
    weight: latest?.weight ?? null,
    measurements: { ...(latest?.measurements || {}) },
  };

  const weightInput = el("input.input.num-in", {
    type: "number", inputmode: "decimal", step: "0.1", placeholder: "—",
    value: draft.weight != null ? String(round1(toDisplayWeight(draft.weight, s.units))) : "",
  });

  const measureInputs = {};
  const measureGrid = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } });
  for (const m of MEASURES) {
    const inp = el("input.input", {
      type: "number", inputmode: "decimal", step: "0.1", placeholder: "cm",
      value: draft.measurements[m.key] != null ? String(draft.measurements[m.key]) : "",
      style: { textAlign: "center" },
    });
    measureInputs[m.key] = inp;
    measureGrid.appendChild(el("div.field", { style: { margin: "0" } }, [el("label", { text: m.label }), inp]));
  }

  root.appendChild(el("div.card", {}, [
    el("div.card-title", {}, [frag(icon("weight")), el("h2.h-section", { text: "Log today" })]),
    el("div.field", {}, [
      el("label", { text: `Bodyweight (${s.units})` }),
      weightInput,
    ]),
    el("label", { text: "Measurements (cm)", style: { display: "block", fontSize: "12px", letterSpacing: ".5px", textTransform: "uppercase", color: "var(--text-3)", margin: "4px 0 7px", fontWeight: "700" } }),
    measureGrid,
    el("button.btn.btn--volt.btn--block.mt-14", {
      onclick: () => {
        const wv = parseFloat(weightInput.value);
        const measurements = {};
        for (const m of MEASURES) { const v = parseFloat(measureInputs[m.key].value); if (!isNaN(v)) measurements[m.key] = v; }
        if (isNaN(wv) && !Object.keys(measurements).length) { toast("Enter a weight or a measurement"); return; }
        logBody({ dateISO: todayISO(), weight: isNaN(wv) ? (latest?.weight ?? null) : fromDisplayWeight(wv, s.units), measurements });
        haptic(); toast("Saved ✓");
      },
    }, [frag(icon("check")), "Save entry"]),
  ]));

  // ---- weight trend ----
  const wlogs = logs.filter((l) => l.weight != null);
  if (wlogs.length >= 1) {
    const pts = wlogs.map((l) => ({ label: fmtDate(l.dateISO), value: round1(toDisplayWeight(l.weight, s.units)) }));
    const first = pts[0].value, last = pts[pts.length - 1].value;
    const delta = round1(last - first);
    root.appendChild(el("div.card", {}, [
      el("div.flex.between.center", {}, [
        el("div.card-title", { style: { margin: "0" } }, [frag(icon("progress")), el("h2.h-section", { text: "Weight trend" })]),
        wlogs.length > 1 ? el("div.chip" + (delta <= 0 ? ".chip--volt" : ""), { text: `${delta > 0 ? "+" : ""}${delta} ${s.units}` }) : null,
      ]),
      el("div.mt-14", {}, [lineChart(pts, { fmt: (v) => `${v}` })]),
    ]));
  }

  // ---- latest measurements w/ deltas ----
  if (latest && Object.keys(latest.measurements || {}).length) {
    const prev = logs.length > 1 ? logs[logs.length - 2] : null;
    const grid = el("div.statrow", { style: { gridTemplateColumns: "1fr 1fr 1fr" } });
    for (const m of MEASURES) {
      const v = latest.measurements[m.key];
      if (v == null) continue;
      const pv = prev?.measurements?.[m.key];
      const d = pv != null ? round1(v - pv) : null;
      grid.appendChild(el("div.stat", {}, [
        el("div.stat__num", { style: { fontSize: "22px" }, text: String(v) }),
        el("div.stat__lbl", { text: m.label }),
        d != null && d !== 0 ? el("div", { style: { fontSize: "11px", marginTop: "3px", color: d > 0 ? "var(--volt)" : "var(--text-3)" }, text: `${d > 0 ? "+" : ""}${d} cm` }) : null,
      ]));
    }
    root.appendChild(el("div.card", {}, [
      el("div.card-title", {}, [frag(icon("ruler")), el("h2.h-section", { text: "Latest measurements" })]),
      grid,
    ]));
  }

  // ---- history ----
  if (logs.length) {
    root.appendChild(el("h2.h-section.mt-20.mb-10", { text: "History" }));
    const list = el("div.list");
    [...logs].reverse().forEach((l) => {
      list.appendChild(el("div.row", {}, [
        el("div.row__main", {}, [
          el("div.row__title", { text: l.weight != null ? fmtWeight(l.weight, s.units) : "Measurements" }),
          el("div.row__sub", { text: fmtDate(l.dateISO) + (Object.keys(l.measurements || {}).length ? ` · ${Object.keys(l.measurements).length} measures` : "") }),
        ]),
        el("button.iconbtn", { "aria-label": "Delete", onclick: async () => {
          if (await confirmSheet("Delete entry?", `Remove the entry from ${fmtDate(l.dateISO)}?`, { danger: true, okLabel: "Delete" })) { deleteBody(l.id); toast("Deleted"); }
        } }, [frag(icon("trash"))]),
      ]));
    });
    root.appendChild(list);
  }

  return root;
}

const round1 = (n) => Math.round(n * 10) / 10;
