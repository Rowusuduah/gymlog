// ============================================================
//  Log — the active workout screen
// ============================================================
import { el, frag, fmtClock, toDisplayWeight, fromDisplayWeight, fmtWeight, toast, haptic } from "../utils.js";
import { icon } from "../components/icons.js";
import { openExercisePicker } from "../components/picker.js";
import { confirmSheet } from "../components/sheet.js";
import { startRest } from "../components/restTimer.js";
import {
  active, startWorkout, cancelWorkout, addExercise, removeExercise,
  addSet, updateSet, removeSet, setActiveNotes, finishWorkout, lastPerformance, settings,
} from "../state.js";
import { prescription, defaultRest } from "../coach.js";
import { byId } from "../../data/exercises.js";
import { navigate } from "../app.js";

export function renderLog() {
  const a = active();
  if (!a) return startScreen();

  const s = settings();
  const root = el("div");

  // ---- header with live timer + finish ----
  const elapsedEl = el("div.timer__time.tnum", { text: fmtClock((Date.now() - a.startedAt) / 1000) });
  startElapsed(elapsedEl, a.startedAt);

  root.appendChild(el("div.pagehead", {}, [
    el("div", {}, [
      el("div.h-eyebrow", { text: "Active workout" }),
      el("div.flex.center.gap-10.mt-8", {}, [frag(icon("clock")), elapsedEl]),
    ]),
    el("button.iconbtn", { onclick: discard, "aria-label": "Discard workout" }, [frag(icon("trash"))]),
  ]));

  // ---- exercises ----
  const stack = el("div.stagger");
  a.exercises.forEach((ex, i) => stack.appendChild(exerciseCard(ex, i, s)));
  root.appendChild(stack);

  // ---- add exercise ----
  root.appendChild(
    el("button.btn.btn--block.mt-14", {
      onclick: () => openExercisePicker((id) => { addExercise(id); haptic(); }, { exclude: a.exercises.map((e) => e.exId) }),
    }, [frag(icon("plus")), "Add exercise"])
  );

  // ---- notes ----
  root.appendChild(el("div.field.mt-20", {}, [
    el("label", { text: "Session notes" }),
    el("textarea.textarea", {
      placeholder: "How did it feel? Energy, niggles, PBs…",
      value: a.notes || "",
      onchange: (e) => setActiveNotes(e.target.value),
    }),
  ]));

  // ---- finish ----
  const totalSets = a.exercises.reduce((n, e) => n + e.sets.filter((x) => x.reps > 0).length, 0);
  root.appendChild(
    el("button.btn.btn--volt.btn--block.btn--lg.mt-14", { disabled: totalSets === 0, onclick: finish }, [
      frag(icon("flag")), totalSets ? `Finish workout · ${totalSets} sets` : "Log a set to finish",
    ])
  );

  return root;
}

// ---------- exercise card ----------
function exerciseCard(ex, i, s) {
  const meta = byId(ex.exId);
  if (!meta) return el("div");
  const rx = prescription(meta, s.goal);
  const last = lastPerformance(ex.exId);

  const card = el("div.card", {}, [
    el("div.flex.between.center", {}, [
      el("a.row__title", { href: "#/exercise/" + ex.exId, style: { fontSize: "17px" }, text: meta.name }),
      el("button.iconbtn", { onclick: () => removeExercise(i), "aria-label": "Remove exercise" }, [frag(icon("close"))]),
    ]),
    el("div.flex.wrap.gap-6.mt-8", {}, [
      chip(`${rx.sets} × ${rx.reps}`),
      chip(`rest ${rx.rest}`),
      last ? chip(`last: ${last.sets.length} sets`, true) : null,
    ]),
    setTable(ex, i, s),
    el("button.btn.btn--ghost.btn--sm.mt-8", { onclick: () => { addSet(i); haptic(); } }, [frag(icon("plus")), "Add set"]),
  ]);
  return card;
}

function setTable(ex, exIdx, s) {
  const unit = s.units.toUpperCase();
  const head = el("div.flex.center", { style: { gap: "10px", padding: "10px 2px 6px", color: "var(--text-3)", fontSize: "11px", letterSpacing: ".5px", textTransform: "uppercase", fontWeight: "700" } }, [
    el("div", { style: { width: "26px" }, text: "Set" }),
    el("div", { style: { flex: "1" }, text: unit }),
    el("div", { style: { flex: "1.3" }, text: "Reps" }),
    el("div", { style: { width: "44px", textAlign: "center" }, text: "✓" }),
  ]);

  const rows = el("div.list");
  ex.sets.forEach((set, si) => rows.appendChild(setRow(set, exIdx, si, s)));

  return el("div.mt-8", {}, [head, rows]);
}

function setRow(set, exIdx, si, s) {
  const weightVal = set.weight != null ? round1(toDisplayWeight(set.weight, s.units)) : "";

  const weightInput = el("input.input.num-in", {
    type: "number", inputmode: "decimal", step: "0.5", placeholder: "—",
    value: weightVal === "" ? "" : String(weightVal),
    onchange: (e) => {
      const v = parseFloat(e.target.value);
      updateSet(exIdx, si, { weight: isNaN(v) ? null : fromDisplayWeight(v, s.units) });
    },
  });

  const repsInput = el("input.input", {
    type: "number", inputmode: "numeric", step: "1", placeholder: "—",
    style: { textAlign: "center", fontFamily: "var(--display)", fontSize: "20px" },
    value: set.reps != null ? String(set.reps) : "",
    onchange: (e) => { const v = parseInt(e.target.value, 10); updateSet(exIdx, si, { reps: isNaN(v) ? null : v }); },
  });

  const reps = el("div.stepper", {}, [
    el("button", { type: "button", text: "−", onclick: () => bump(exIdx, si, set, -1) }),
    repsInput,
    el("button", { type: "button", text: "+", onclick: () => bump(exIdx, si, set, +1) }),
  ]);

  const doneBtn = el("button.iconbtn", {
    style: set.done ? { background: "var(--volt)", color: "#0b0c10", borderColor: "transparent" } : {},
    "aria-label": "Mark set done",
    onclick: () => {
      const nowDone = !set.done;
      updateSet(exIdx, si, { done: nowDone });
      if (nowDone) { haptic([15]); startRest(settings().restDefault || defaultRest(settings().goal)); }
    },
  }, [frag(icon(set.done ? "check" : "check"))]);

  return el("div.flex.center", { style: { gap: "10px" } }, [
    el("div.num", { style: { width: "26px", textAlign: "center", color: "var(--text-3)" }, text: String(si + 1) }),
    el("div", { style: { flex: "1" } }, [weightInput]),
    el("div", { style: { flex: "1.3", display: "flex", justifyContent: "center" } }, [reps]),
    el("div", { style: { width: "44px", display: "flex", justifyContent: "center" } }, [doneBtn]),
  ]);
}

function bump(exIdx, si, set, delta) {
  const cur = set.reps || 0;
  updateSet(exIdx, si, { reps: Math.max(0, cur + delta) });
  haptic(8);
}

// ---------- actions ----------
async function finish() {
  const res = finishWorkout();
  if (!res) return;
  if (res.newPRs.length) {
    const names = res.newPRs.map((p) => byId(p.exId)?.name).filter(Boolean);
    toast(`🏆 New PR: ${names.join(", ")}`);
    haptic([40, 30, 40, 30, 60]);
  } else {
    toast("Workout saved 💪");
  }
  navigate("today");
}

async function discard() {
  if (await confirmSheet("Discard workout?", "This will delete the current in-progress workout. Your saved history is unaffected.", { danger: true, okLabel: "Discard" })) {
    cancelWorkout();
    navigate("today");
  }
}

// ---------- empty start ----------
function startScreen() {
  return el("div", {}, [
    el("div.pagehead", {}, [el("div", {}, [
      el("div.h-eyebrow", { text: "Log" }),
      el("h1.h-display.mt-8", { text: "Ready to train" }),
    ])]),
    el("div.empty", {}, [
      el("div.empty__art", {}, [frag(icon("dumbbell"))]),
      el("h3", { text: "No active workout" }),
      el("p", { text: "Start a session, then add exercises from the library." }),
    ]),
    el("button.btn.btn--volt.btn--block.btn--lg", { onclick: () => { startWorkout(); navigate("log"); } }, [frag(icon("plus")), "Start a workout"]),
  ]);
}

// ---------- helpers ----------
function chip(text, soft) { return el("div.chip" + (soft ? "" : ".chip--volt"), { text }); }
const round1 = (n) => Math.round(n * 10) / 10;

let elapsedTimer = null;
function startElapsed(node, startedAt) {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    if (!node.isConnected) { clearInterval(elapsedTimer); elapsedTimer = null; return; }
    node.textContent = fmtClock((Date.now() - startedAt) / 1000);
  }, 1000);
}
