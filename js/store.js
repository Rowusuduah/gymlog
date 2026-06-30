// ============================================================
//  Persistence layer — localStorage, single source of truth.
//  All weights are stored in KG internally (lossless unit toggle).
// ============================================================

const KEY = "gymlog.v1";

const DEFAULTS = () => ({
  version: 1,
  updatedAt: 0,       // ms timestamp of last change (for cloud sync)
  settings: {
    name: "",
    units: "kg",      // "kg" | "lb"
    theme: "dark",    // "dark" | "light"
    goal: "hypertrophy", // strength | hypertrophy | endurance
    restDefault: 90,  // seconds
    onboarded: false,
    googleClientId: "", // OAuth client id for Drive sync (set by user)
    driveConnected: false,
  },
  sessions: [],       // completed workouts
  body: [],           // body-metric logs
  active: null,       // in-progress workout (survives reloads)
});

let _data = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.warn("GymLog: failed to read storage, starting fresh", e);
    return DEFAULTS();
  }
}

function migrate(d) {
  const base = DEFAULTS();
  return {
    ...base,
    ...d,
    updatedAt: d.updatedAt || base.updatedAt,
    settings: { ...base.settings, ...(d.settings || {}) },
    sessions: Array.isArray(d.sessions) ? d.sessions : [],
    body: Array.isArray(d.body) ? d.body : [],
    active: d.active || null,
  };
}

export function db() {
  if (!_data) _data = load();
  return _data;
}

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(_data));
  } catch (e) {
    console.error("GymLog: failed to save", e);
    return false;
  }
  return true;
}

// listeners fired only on genuine user edits (not on sync-applied writes)
const mutateListeners = new Set();
export const onMutate = (fn) => { mutateListeners.add(fn); return () => mutateListeners.delete(fn); };

/** mutate(d => { ... }) — apply a change, stamp updatedAt, and persist. */
export function mutate(fn) {
  fn(db());
  db().updatedAt = Date.now();
  persist();
  mutateListeners.forEach((f) => { try { f(); } catch (e) { console.warn(e); } });
}

/** Replace the whole dataset (used by cloud sync / restore). */
export function setData(obj) {
  _data = migrate(obj);
  persist();
  return _data;
}

// ---------- backup ----------
export function exportData() {
  return JSON.stringify(db(), null, 2);
}

export function importData(json) {
  const parsed = JSON.parse(json); // throws on bad JSON → caller handles
  if (typeof parsed !== "object" || !parsed.settings) throw new Error("Not a GymLog backup file.");
  _data = migrate(parsed);
  persist();
  return _data;
}

export function resetAll() {
  _data = DEFAULTS();
  persist();
  return _data;
}
