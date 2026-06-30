// ============================================================
//  Library — exercise catalog + detail
// ============================================================
import { el, frag, debounce, haptic, toast } from "../utils.js";
import { icon } from "../components/icons.js";
import { muscleThumb, muscleMap } from "../components/muscleMap.js";
import { EXERCISES, EQUIPMENT, byId, isCardio } from "../../data/exercises.js";
import { MUSCLE_GROUPS, groupOf, muscleName } from "../../data/muscles.js";
import { settings, active, startWorkout, addExercise } from "../state.js";
import { prescription, startingAdvice, cardioGuide } from "../coach.js";
import { navigate } from "../app.js";

// keep filter state across re-renders within a session
const f = { q: "", equip: "All", group: "All" };

export function renderLibrary() {
  const root = el("div");

  root.appendChild(el("div.pagehead", {}, [el("div", {}, [
    el("div.h-eyebrow", { text: `${EXERCISES.length} exercises · all equipment` }),
    el("h1.h-display.mt-8", { text: "Library" }),
  ])]));

  // search
  root.appendChild(el("div.flex.center.gap-10.mb-10", {
    style: { background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "12px", padding: "0 14px" },
  }, [
    frag(icon("search")),
    el("input.input", {
      placeholder: "Search by name, muscle, equipment…",
      value: f.q,
      style: { border: "none", background: "transparent", paddingLeft: "0" },
      oninput: debounce((e) => { f.q = e.target.value; repaint(); }, 120),
    }),
  ]));

  // equipment rail
  const eqRail = el("div.rail");
  ["All", ...EQUIPMENT].forEach((eq) => eqRail.appendChild(
    chip(eq, f.equip === eq, () => { f.equip = eq; repaint(); })
  ));
  root.appendChild(eqRail);

  // muscle group rail
  const grpRail = el("div.rail", { style: { marginTop: "8px" } });
  ["All", ...Object.keys(MUSCLE_GROUPS)].forEach((g) => grpRail.appendChild(
    chip(g, f.group === g, () => { f.group = g; repaint(); })
  ));
  root.appendChild(grpRail);

  const listWrap = el("div.list.mt-14", { id: "lib-list" });
  root.appendChild(listWrap);
  paintList(listWrap);

  function repaint() {
    // update chip states without full nav re-render
    [...eqRail.children].forEach((c) => c.classList.toggle("chip--on", c.textContent === f.equip));
    [...grpRail.children].forEach((c) => c.classList.toggle("chip--on", c.textContent === f.group));
    paintList(listWrap);
  }

  return root;
}

function matches(ex) {
  if (f.equip !== "All" && ex.equipment !== f.equip) return false;
  if (f.group !== "All" && !ex.primary.some((m) => groupOf(m) === f.group)) return false;
  if (f.q) {
    const hay = (ex.name + " " + ex.equipment + " " + ex.pattern + " " + ex.primary.concat(ex.secondary || []).map(muscleName).join(" ")).toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false;
  }
  return true;
}

function paintList(wrap) {
  wrap.replaceChildren();
  const list = EXERCISES.filter(matches);
  if (!list.length) {
    wrap.appendChild(el("div.empty", {}, [el("h3", { text: "Nothing found" }), el("p", { text: "Try clearing a filter." })]));
    return;
  }
  for (const ex of list) {
    wrap.appendChild(el("a.row", { href: "#/exercise/" + ex.id }, [
      el("div.row__art", {}, [muscleThumb(ex.primary)]),
      el("div.row__main", {}, [
        el("div.row__title", { text: ex.name }),
        el("div.row__sub", { text: `${ex.equipment} · ${groupOf(ex.primary[0])} · ${ex.difficulty}` }),
      ]),
      frag(icon("chevron")),
    ]));
  }
}

// ============================================================
//  Detail
// ============================================================
export function renderExercise(id) {
  const ex = byId(id);
  if (!ex) return el("div.empty", {}, [el("h3", { text: "Exercise not found" }), el("a.btn.mt-14", { href: "#/library" }, ["Back to library"])]);

  const s = settings();
  const rx = prescription(ex, s.goal);
  const root = el("div.stagger");

  // back
  root.appendChild(el("div.flex.between.center", {}, [
    el("a.iconbtn", { href: "#/library", "aria-label": "Back" }, [rotate(icon("chevron"))]),
    el("div.chip", { text: ex.equipment }),
  ]));

  // muscle map picture
  root.appendChild(el("div.card.mt-14", {}, [
    muscleMap(ex.primary, ex.secondary || []),
    el("div.flex.wrap.gap-6", { style: { justifyContent: "center", marginTop: "10px" } }, [
      ...ex.primary.map((m) => el("div.chip.chip--volt", { text: muscleName(m) })),
      ...(ex.secondary || []).map((m) => el("div.chip", { text: muscleName(m) })),
    ]),
  ]));

  // title block
  root.appendChild(el("div.mt-14", {}, [
    el("h1.h-display", { text: ex.name }),
    el("div.flex.wrap.gap-6.mt-8", {}, [
      chip(ex.difficulty, false),
      chip(ex.pattern, false),
      chip(ex.type === "compound" ? "Compound" : "Isolation", false),
    ]),
  ]));

  // add to workout
  root.appendChild(el("button.btn.btn--volt.btn--block.btn--lg.mt-14", {
    onclick: () => {
      if (!active()) startWorkout();
      addExercise(ex.id);
      haptic();
      toast(`Added ${ex.name}`);
      navigate("log");
    },
  }, [frag(icon("plus")), "Add to workout"]));

  // prescription (rule of thumb)
  if (isCardio(ex.id)) {
    const g = cardioGuide();
    root.appendChild(el("div.card.mt-14", {}, [
      el("div.card-title", {}, [frag(icon("bolt")), el("h2.h-section", { text: "Rule of thumb · Cardio" })]),
      el("div.statrow", {}, [
        mini(g.duration, "Duration"),
        mini(g.frequency, "Frequency"),
        mini(g.intensity, "Intensity"),
      ]),
      el("p.muted.mt-14", { text: g.note, style: { lineHeight: "1.5", fontSize: "14px" } }),
    ]));
  } else {
    root.appendChild(el("div.card.mt-14", {}, [
      el("div.card-title", {}, [frag(icon("bolt")), el("h2.h-section", { text: `Rule of thumb · ${capitalize(s.goal)}` })]),
      el("div.statrow", {}, [
        mini(rx.sets, "Sets"),
        mini(rx.reps, "Reps"),
        mini(rx.rest, "Rest"),
      ]),
      el("p.muted.mt-14", { text: `Aim to keep ${rx.rir}. ${startingAdvice(ex)}`, style: { lineHeight: "1.5", fontSize: "14px" } }),
    ]));
  }

  // how-to
  root.appendChild(stepCard("How to do it", ex.steps, "list"));

  // mistakes
  if (ex.mistakes?.length) {
    root.appendChild(el("div.card", {}, [
      el("div.card-title", {}, [frag(icon("info")), el("h2.h-section", { text: "Common mistakes" })]),
      el("ul.list", {}, ex.mistakes.map((m) => el("li.flex.gap-10", { style: { alignItems: "flex-start" } }, [
        el("div.dot", { style: { background: "var(--bad)", marginTop: "7px" } }),
        el("div", { text: m, style: { lineHeight: "1.5" } }),
      ]))),
    ]));
  }

  // coach tip
  if (ex.tip) {
    root.appendChild(el("div.coach", {}, [
      el("div.coach__icon", {}, [frag(icon("bolt"))]),
      el("div", {}, [el("div.coach__title", { text: "Tip" }), el("div.coach__body", { text: ex.tip })]),
    ]));
  }

  return root;
}

function stepCard(title, steps, ic) {
  return el("div.card", {}, [
    el("div.card-title", {}, [frag(icon(ic)), el("h2.h-section", { text: title })]),
    el("ol.list", { style: { counterReset: "step" } }, steps.map((st, i) => el("li.flex.gap-14", { style: { alignItems: "flex-start" } }, [
      el("div.num", { style: { color: "var(--volt)", fontSize: "20px", minWidth: "24px" }, text: String(i + 1) }),
      el("div", { text: st, style: { lineHeight: "1.5", paddingTop: "2px" } }),
    ]))),
  ]);
}

// helpers
function chip(text, on, onclick) {
  const c = el("button.chip" + (on ? ".chip--on" : ""), { text });
  if (onclick) c.addEventListener("click", onclick); else c.style.cursor = "default";
  return c;
}
function mini(val, label) {
  return el("div.stat", {}, [el("div.stat__num", { style: { fontSize: "20px" }, text: val }), el("div.stat__lbl", { text: label })]);
}
function rotate(svg) { const n = frag(svg); n.style.transform = "rotate(180deg)"; return n; }
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
