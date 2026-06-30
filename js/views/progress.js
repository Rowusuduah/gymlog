// ============================================================
//  Progress — PRs, strength charts, volume, streak
// ============================================================
import { el, frag, fmtDate, toDisplayWeight, fmtWeight } from "../utils.js";
import { icon } from "../components/icons.js";
import { lineChart, barChart, calendarHeat } from "../components/charts.js";
import {
  settings, personalRecords, strengthProgression, weeklyVolume,
  trainingDays, totalStats, streak, sessions, weeklyCardioMinutes,
} from "../state.js";
import { byId } from "../../data/exercises.js";

let selectedEx = null; // remembered across re-renders

export function renderProgress() {
  const s = settings();
  const stats = totalStats();
  const root = el("div.stagger");

  root.appendChild(el("div.pagehead", {}, [el("div", {}, [
    el("div.h-eyebrow", { text: "Your numbers" }),
    el("h1.h-display.mt-8", { text: "Progress" }),
  ])]));

  if (!sessions().length) {
    root.appendChild(el("div.empty", {}, [
      el("div.empty__art", {}, [frag(icon("progress"))]),
      el("h3", { text: "No data yet" }),
      el("p", { text: "Log a few workouts and your charts, PRs and streaks will appear here." }),
      el("a.btn.btn--volt.mt-14", { href: "#/log" }, [frag(icon("plus")), "Start a workout"]),
    ]));
    return root;
  }

  // totals
  const volDisp = Math.round(toDisplayWeight(stats.volume, s.units));
  root.appendChild(el("div.statrow", {}, [
    statBig(stats.workouts, "Workouts"),
    statBig(stats.sets, "Sets logged"),
    statBig(fmtNum(volDisp), `Volume ${s.units}`),
  ]));

  // streak / calendar
  const st = streak();
  const cardioMin = weeklyCardioMinutes(7);
  root.appendChild(el("div.card.mt-14", {}, [
    el("div.flex.between.center", {}, [
      el("div.card-title", { style: { margin: "0" } }, [frag(icon("flame")), el("h2.h-section", { text: "Consistency" })]),
      el("div.flex.gap-6", {}, [
        cardioMin > 0 ? el("div.chip", { text: `${cardioMin} min cardio` }) : null,
        el("div.chip.chip--volt", { text: `${st.current} day streak` }),
      ]),
    ]),
    el("div.mt-14", { style: { overflowX: "auto" } }, [calendarHeat(trainingDays(), 18)]),
    el("p.dim.mt-8", { text: "Each square is a day. Lit squares are training days.", style: { fontSize: "12px" } }),
  ]));

  // weekly volume by group
  const vol = weeklyVolume(7);
  const volData = Object.entries(vol)
    .map(([label, v]) => ({ label, value: Math.round(toDisplayWeight(v, s.units)) }))
    .sort((a, b) => b.value - a.value);
  if (volData.length) {
    root.appendChild(el("div.card", {}, [
      el("div.card-title", {}, [frag(icon("list")), el("h2.h-section", { text: "This week's volume" })]),
      barChart(volData, { fmt: (v) => fmtNum(v) }),
      el("p.dim.mt-8", { text: `Total weight moved per muscle group, last 7 days (${s.units}).`, style: { fontSize: "12px" } }),
    ]));
  }

  // strength progression
  const exWithHistory = uniqueExercisesWithHistory();
  if (exWithHistory.length) {
    if (!selectedEx || !exWithHistory.includes(selectedEx)) selectedEx = exWithHistory[0];
    const pts = strengthProgression(selectedEx).map((p) => ({ label: fmtDate(p.dateISO), value: round1(toDisplayWeight(p.value, s.units)) }));

    const select = el("select.select", {
      onchange: (e) => { selectedEx = e.target.value; renderProgressInto(chartCard, s); },
    }, exWithHistory.map((id) => el("option", { value: id, text: byId(id)?.name || id, selected: id === selectedEx })));

    const chartCard = el("div");
    root.appendChild(el("div.card", {}, [
      el("div.card-title", {}, [frag(icon("progress")), el("h2.h-section", { text: "Estimated 1-rep max" })]),
      select,
      chartCard,
    ]));
    renderProgressInto(chartCard, s);
  }

  // PRs
  const prs = personalRecords();
  if (prs.length) {
    root.appendChild(el("div.flex.center.gap-10.mt-20.mb-10", {}, [frag(icon("trophy")), el("h2.h-section", { text: "Personal records" })]));
    const list = el("div.list");
    prs.slice(0, 30).forEach((pr, i) => {
      const meta = byId(pr.exId);
      list.appendChild(el("div.row", {}, [
        el("div.num", { style: { width: "28px", textAlign: "center", color: i < 3 ? "var(--volt)" : "var(--text-3)", fontSize: "20px" }, text: String(i + 1) }),
        el("div.row__main", {}, [
          el("div.row__title", { text: meta?.name || pr.exId }),
          el("div.row__sub", { text: `Best: ${fmtWeight(pr.weight, s.units)} × ${pr.reps} · ${fmtDate(pr.dateISO)}` }),
        ]),
        el("div.right", {}, [
          el("div.num", { style: { fontSize: "20px", color: "var(--volt)" }, text: String(round1(toDisplayWeight(pr.e1rm, s.units))) }),
          el("div.dim", { style: { fontSize: "10px", letterSpacing: ".5px" }, text: `e1RM ${s.units}` }),
        ]),
      ]));
    });
    root.appendChild(list);
  }

  return root;
}

function renderProgressInto(node, s) {
  node.replaceChildren();
  const pts = strengthProgression(selectedEx).map((p) => ({ label: "", value: round1(toDisplayWeight(p.value, s.units)) }));
  node.appendChild(el("div.mt-14", {}, [lineChart(pts, { fmt: (v) => `${v}${s.units}` })]));
}

function uniqueExercisesWithHistory() {
  const ids = new Set();
  for (const ses of sessions()) for (const ex of ses.exercises) ids.add(ex.exId);
  return [...ids].filter((id) => byId(id) && strengthProgression(id).length > 0);
}

function statBig(num, label) {
  return el("div.stat", {}, [el("div.stat__num.tnum", { style: { fontSize: "24px" }, text: String(num) }), el("div.stat__lbl", { text: label })]);
}
const round1 = (n) => Math.round(n * 10) / 10;
const fmtNum = (n) => n.toLocaleString();
