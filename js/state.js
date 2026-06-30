// ============================================================
//  Application state — wraps the store with domain logic,
//  derived analytics, and a small pub/sub for re-rendering.
// ============================================================
import { db, mutate } from "./store.js";
import { byId } from "../data/exercises.js";
import { groupOf } from "../data/muscles.js";
import { uid, todayISO, epley1RM, sum, daysBetween } from "./utils.js";

const subs = new Set();
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const emit = () => subs.forEach((fn) => fn());

// ---------- settings ----------
export const settings = () => db().settings;
export function setSetting(key, value) {
  mutate((d) => { d.settings[key] = value; });
  emit();
}

// ---------- active workout ----------
export const active = () => db().active;

export function startWorkout() {
  mutate((d) => {
    d.active = { id: uid(), startedAt: Date.now(), dateISO: todayISO(), exercises: [], notes: "" };
  });
  emit();
}

export function cancelWorkout() {
  mutate((d) => { d.active = null; });
  emit();
}

export function addExercise(exId) {
  mutate((d) => {
    if (!d.active) return;
    if (d.active.exercises.some((e) => e.exId === exId)) return;
    // seed one empty set, pre-filled from last time if available
    const last = lastSet(exId);
    d.active.exercises.push({
      exId,
      sets: [{ weight: last?.weight ?? null, reps: last?.reps ?? null, done: false }],
    });
  });
  emit();
}

export function removeExercise(idx) {
  mutate((d) => { d.active?.exercises.splice(idx, 1); });
  emit();
}

export function addSet(exIdx) {
  mutate((d) => {
    const ex = d.active?.exercises[exIdx];
    if (!ex) return;
    const prev = ex.sets[ex.sets.length - 1];
    ex.sets.push({ weight: prev?.weight ?? null, reps: prev?.reps ?? null, done: false });
  });
  emit();
}

export function updateSet(exIdx, setIdx, patch) {
  mutate((d) => {
    const s = d.active?.exercises[exIdx]?.sets[setIdx];
    if (s) Object.assign(s, patch);
  });
  emit();
}

export function removeSet(exIdx, setIdx) {
  mutate((d) => {
    const ex = d.active?.exercises[exIdx];
    if (ex) ex.sets.splice(setIdx, 1);
  });
  emit();
}

export function setActiveNotes(notes) {
  mutate((d) => { if (d.active) d.active.notes = notes; });
}

/** Save the active workout into history. Returns {session, newPRs[]}. */
export function finishWorkout() {
  const a = active();
  if (!a) return null;
  // keep only sets that have weight & reps
  const exercises = a.exercises
    .map((e) => ({ exId: e.exId, sets: e.sets.filter((s) => s.reps != null && s.reps > 0) }))
    .filter((e) => e.sets.length > 0);

  const beforePRs = prMap();
  const session = {
    id: a.id,
    dateISO: a.dateISO,
    startedAt: a.startedAt,
    durationSec: Math.round((Date.now() - a.startedAt) / 1000),
    exercises,
    notes: a.notes || "",
  };
  mutate((d) => { d.sessions.push(session); d.active = null; });

  const afterPRs = prMap();
  const newPRs = [];
  for (const [exId, after] of afterPRs) {
    const before = beforePRs.get(exId);
    if (!before || after.e1rm > before.e1rm + 0.01) {
      if (exercises.some((e) => e.exId === exId)) newPRs.push({ exId, ...after });
    }
  }
  emit();
  return { session, newPRs };
}

// ---------- history / analytics ----------
export const sessions = () => db().sessions;

/** all sets ever recorded for an exercise, newest first, with date */
export function exerciseHistory(exId) {
  const out = [];
  for (const s of db().sessions) {
    const ex = s.exercises.find((e) => e.exId === exId);
    if (ex) out.push({ dateISO: s.dateISO, sets: ex.sets });
  }
  return out.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
}

/** most recent recorded set for an exercise (for pre-filling) */
export function lastSet(exId) {
  const h = exerciseHistory(exId);
  if (!h.length) return null;
  const sets = h[0].sets;
  return sets[sets.length - 1] || null;
}

export function lastPerformance(exId) {
  const h = exerciseHistory(exId);
  return h.length ? h[0] : null;
}

/** best estimated 1RM + best set per exercise => Map(exId -> {e1rm, weight, reps, dateISO}) */
export function prMap() {
  const m = new Map();
  for (const s of db().sessions) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.weight || !set.reps) continue;
        const e = epley1RM(set.weight, set.reps);
        const cur = m.get(ex.exId);
        if (!cur || e > cur.e1rm) {
          m.set(ex.exId, { e1rm: e, weight: set.weight, reps: set.reps, dateISO: s.dateISO });
        }
      }
    }
  }
  return m;
}

export function personalRecords() {
  return [...prMap().entries()]
    .map(([exId, v]) => ({ exId, ...v }))
    .filter((r) => byId(r.exId))
    .sort((a, b) => b.e1rm - a.e1rm);
}

/** e1rm progression points for one exercise (oldest first) */
export function strengthProgression(exId) {
  const pts = [];
  for (const s of [...db().sessions].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1))) {
    const ex = s.exercises.find((e) => e.exId === exId);
    if (!ex) continue;
    let best = 0;
    for (const set of ex.sets) best = Math.max(best, epley1RM(set.weight, set.reps));
    if (best > 0) pts.push({ dateISO: s.dateISO, value: best });
  }
  return pts;
}

/** total volume (kg×reps) per coarse muscle group within the last `days` */
export function weeklyVolume(days = 7) {
  const today = todayISO();
  const totals = {};
  for (const s of db().sessions) {
    if (daysBetween(s.dateISO, today) >= days) continue;
    for (const ex of s.exercises) {
      const meta = byId(ex.exId);
      if (!meta) continue;
      const vol = sum(ex.sets, (st) => (st.weight || 0) * (st.reps || 0)) || sum(ex.sets, (st) => st.reps || 0);
      for (const mk of meta.primary) {
        const g = groupOf(mk);
        totals[g] = (totals[g] || 0) + vol;
      }
    }
  }
  return totals;
}

/** workout streak: consecutive weeks? Here: current run of days with the gap rule. */
export function streak() {
  const dates = [...new Set(db().sessions.map((s) => s.dateISO))].sort();
  if (!dates.length) return { current: 0, total: dates.length, weekCount: weekCount() };
  // count distinct training days in a row allowing up to 2 rest days between
  let run = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const gap = daysBetween(dates[i - 1], dates[i]);
    if (gap <= 3) run++; else break;
  }
  return { current: run, total: dates.length, weekCount: weekCount() };
}

export function weekCount() {
  const today = todayISO();
  return new Set(
    db().sessions.filter((s) => daysBetween(s.dateISO, today) < 7).map((s) => s.dateISO)
  ).size;
}

/** dates (ISO) that had a workout, for the calendar heatmap */
export function trainingDays() {
  return new Set(db().sessions.map((s) => s.dateISO));
}

export function totalStats() {
  const ses = db().sessions;
  let sets = 0, vol = 0;
  for (const s of ses) for (const ex of s.exercises) {
    sets += ex.sets.length;
    vol += sum(ex.sets, (st) => (st.weight || 0) * (st.reps || 0));
  }
  return { workouts: ses.length, sets, volume: vol };
}

// ---------- body metrics ----------
export const bodyLogs = () => [...db().body].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));

export function logBody(entry) {
  mutate((d) => {
    // one entry per day — replace if same date
    const i = d.body.findIndex((b) => b.dateISO === entry.dateISO);
    const rec = { id: i >= 0 ? d.body[i].id : uid(), ...entry };
    if (i >= 0) d.body[i] = rec; else d.body.push(rec);
  });
  emit();
}

export function deleteBody(id) {
  mutate((d) => { d.body = d.body.filter((b) => b.id !== id); });
  emit();
}

export function deleteSession(id) {
  mutate((d) => { d.sessions = d.sessions.filter((s) => s.id !== id); });
  emit();
}
