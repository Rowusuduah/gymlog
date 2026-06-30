// ============================================================
//  Coach — beginner-weighted "rule of thumb" guidance.
// ============================================================

export const GOALS = {
  strength:    { label: "Strength",    reps: [3, 5],   sets: [3, 5], restSec: [120, 240], rir: "1–2 reps in reserve" },
  hypertrophy: { label: "Muscle",      reps: [8, 12],  sets: [3, 4], restSec: [60, 90],   rir: "1–2 reps in reserve" },
  endurance:   { label: "Endurance",   reps: [12, 20], sets: [2, 3], restSec: [30, 60],   rir: "0–1 reps in reserve" },
};

export const goalConfig = (goal) => GOALS[goal] || GOALS.hypertrophy;

export function repTarget(goal) {
  const g = goalConfig(goal);
  return `${g.reps[0]}–${g.reps[1]} reps`;
}
export function setTarget(goal) {
  const g = goalConfig(goal);
  return `${g.sets[0]}–${g.sets[1]} sets`;
}
export function restTarget(goal) {
  const [lo, hi] = goalConfig(goal).restSec;
  // keep both bounds in the same unit so it reads cleanly
  if (hi < 120) return `${lo}–${hi}s`;
  return `${lo / 60}–${hi / 60} min`;
}
export function defaultRest(goal) {
  const g = goalConfig(goal);
  return Math.round((g.restSec[0] + g.restSec[1]) / 2);
}

/** Per-exercise prescription, blending the user's goal with the move's nature. */
export function prescription(exercise, goal) {
  const g = goalConfig(goal);
  let reps = [...g.reps];
  let sets = [...g.sets];
  // isolation moves usually get a touch more reps / fewer sets
  if (exercise?.type === "isolation") {
    reps = [reps[0] + 2, reps[1] + 3];
    sets = [Math.max(2, sets[0]), sets[1]];
  }
  // core moves: count reps or seconds, lighter loading
  return {
    reps: `${reps[0]}–${reps[1]}`,
    sets: `${sets[0]}–${sets[1]}`,
    rest: restTarget(goal),
    rir: g.rir,
  };
}

// Rotating coaching tips shown on Today + during workouts.
export const TIPS = [
  { title: "Progressive Overload", body: "Each week try to add a little — one more rep, or a touch more weight. Small, steady progress is what builds muscle and strength." },
  { title: "Warm Up Smart", body: "Before a heavy lift, do 1–2 lighter sets of the same move. It primes the muscle and protects your joints." },
  { title: "Leave Reps in Reserve", body: "As a beginner, stop a set when you have 1–2 good reps left. You'll recover faster and keep great form." },
  { title: "Train Each Muscle 2–3×/Week", body: "Hitting a muscle more than once a week beats one brutal session. Spread your volume across the week." },
  { title: "Form Before Weight", body: "A clean rep with lighter weight beats a sloppy heavy one. Master the movement; the weight will follow." },
  { title: "Rest Between Sets", body: "Resting fully (1–3 min for big lifts) lets you lift more total weight — and more total weight means more progress." },
  { title: "Eat Enough Protein", body: "Aim for roughly 1.6–2.2 g of protein per kg of bodyweight per day to support muscle repair." },
  { title: "Sleep Is a Training Tool", body: "Muscle is built while you rest. 7–9 hours of sleep does more than any supplement." },
  { title: "Deload When Needed", body: "Every 4–8 weeks, take a lighter week. It lets your body catch up and come back stronger." },
  { title: "Track Everything", body: "If you log your lifts, you can beat them. What gets measured gets improved." },
  { title: "Full Range of Motion", body: "Lower under control and use the full range. Partial reps build partial results." },
  { title: "Breathe Right", body: "Breathe out as you push or pull the hard part, breathe in as you lower. Never hold your breath under a heavy load." },
];

// Deterministic-ish rotation based on the day, so the tip changes daily.
export function tipOfTheDay() {
  const day = Math.floor(Date.now() / 86400000);
  return TIPS[day % TIPS.length];
}
export function randomTip() {
  return TIPS[Math.floor((Date.now() / 1000) % TIPS.length)];
}

/** A friendly starting-point note for someone new to a movement. */
export function startingAdvice(exercise) {
  if (!exercise) return "";
  if (exercise.equipment === "Bodyweight" || exercise.equipment === "Other")
    return "Start with bodyweight and focus on clean, controlled reps.";
  if (exercise.type === "isolation")
    return "Pick a weight you can control for the full rep range with 2 reps to spare.";
  return "Start light enough to nail the form, then add weight once it feels easy.";
}
