// ============================================================
//  Today — home screen
// ============================================================
import { el, frag, fmtDate, todayISO, fmtClock, relDay } from "../utils.js";
import { icon } from "../components/icons.js";
import { settings, active, startWorkout, streak, weekCount, sessions, totalStats } from "../state.js";
import { tipOfTheDay } from "../coach.js";
import { byId } from "../../data/exercises.js";
import { navigate } from "../app.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function renderToday() {
  const s = settings();
  const st = streak();
  const stats = totalStats();
  const root = el("div.stagger");

  // header
  root.appendChild(
    el("div.pagehead", {}, [
      el("div", {}, [
        el("div.h-eyebrow", { text: new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) }),
        el("h1.h-display.mt-8", { text: s.name ? `${greeting()}, ${s.name}` : `${greeting()}` }),
      ]),
      el("button.iconbtn", { onclick: () => navigate("settings"), "aria-label": "Settings" }, [frag(icon("settings"))]),
    ])
  );

  // active or start
  const a = active();
  if (a) {
    const exCount = a.exercises.length;
    const setCount = a.exercises.reduce((n, e) => n + e.sets.length, 0);
    root.appendChild(
      el("div.card", { style: { borderColor: "var(--volt)" } }, [
        el("div.flex.between.center", {}, [
          el("div", {}, [
            el("div.h-eyebrow", { text: "Workout in progress" }),
            el("div.h-section.mt-8", { text: `${exCount} exercise${exCount === 1 ? "" : "s"} · ${setCount} sets` }),
          ]),
          frag(`<div class="chip chip--volt">live</div>`),
        ]),
        el("button.btn.btn--volt.btn--block.btn--lg.mt-14", { onclick: () => navigate("log") }, [frag(icon("play")), "Resume workout"]),
      ])
    );
  } else {
    root.appendChild(
      el("button.btn.btn--volt.btn--block.btn--lg", { onclick: () => { startWorkout(); navigate("log"); } }, [frag(icon("plus")), "Start a workout"])
    );
  }

  // stats
  root.appendChild(
    el("div.statrow.mt-14", {}, [
      stat(weekCount(), "This week"),
      stat(st.current, "Day streak"),
      stat(stats.workouts, "Total workouts"),
    ])
  );

  // coach tip
  const tip = tipOfTheDay();
  root.appendChild(
    el("div.coach.mt-14", {}, [
      el("div.coach__icon", {}, [frag(icon("bolt"))]),
      el("div", {}, [
        el("div.coach__title", { text: "Coach · " + tip.title }),
        el("div.coach__body", { text: tip.body }),
      ]),
    ])
  );

  // recent
  root.appendChild(el("div.flex.between.center.mt-28.mb-10", {}, [
    el("h2.h-section", { text: "Recent" }),
    sessions().length ? el("a.chip", { href: "#/progress", text: "All progress →" }) : null,
  ]));

  const recent = [...sessions()].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)).slice(0, 5);
  if (!recent.length) {
    root.appendChild(emptyRecent());
  } else {
    const list = el("div.list");
    for (const ses of recent) list.appendChild(sessionRow(ses));
    root.appendChild(list);
  }

  return root;
}

function stat(num, label) {
  return el("div.stat", {}, [
    el("div.stat__num.tnum", { text: String(num) }),
    el("div.stat__lbl", { text: label }),
  ]);
}

function sessionRow(ses) {
  const names = ses.exercises.map((e) => byId(e.exId)?.name).filter(Boolean);
  const title = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
  const setCount = ses.exercises.reduce((n, e) => n + e.sets.length, 0);
  return el("div.row", {}, [
    el("div.row__art", {}, [frag(icon("dumbbell"))]),
    el("div.row__main", {}, [
      el("div.row__title", { text: title || "Workout" }),
      el("div.row__sub", { text: `${relDay(ses.dateISO)} · ${setCount} sets${ses.durationSec ? " · " + fmtClock(ses.durationSec) : ""}` }),
    ]),
    el("div.chip", { text: `${ses.exercises.length} ex` }),
  ]);
}

function emptyRecent() {
  return el("div.empty", {}, [
    el("div.empty__art", {}, [frag(icon("flame"))]),
    el("h3", { text: "No workouts yet" }),
    el("p", { text: "Tap “Start a workout” to log your first session." }),
  ]);
}
