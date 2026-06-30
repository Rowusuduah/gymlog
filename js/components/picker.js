// ============================================================
//  Exercise picker sheet — search + equipment filter.
// ============================================================
import { el, frag, debounce } from "../utils.js";
import { icon } from "./icons.js";
import { openSheet } from "./sheet.js";
import { muscleThumb } from "./muscleMap.js";
import { EXERCISES, EQUIPMENT } from "../../data/exercises.js";
import { MUSCLE_GROUPS, groupOf, muscleName } from "../../data/muscles.js";

export function openExercisePicker(onPick, { exclude = [] } = {}) {
  let q = "";
  let equip = "All";

  const results = el("div.list", { style: { marginTop: "12px" } });

  function matches(ex) {
    if (exclude.includes(ex.id)) return false;
    if (equip !== "All" && ex.equipment !== equip) return false;
    if (!q) return true;
    const hay = (ex.name + " " + ex.equipment + " " + ex.primary.map(muscleName).join(" ") + " " + ex.pattern).toLowerCase();
    return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
  }

  function paint() {
    results.replaceChildren();
    const list = EXERCISES.filter(matches);
    if (!list.length) {
      results.appendChild(el("div.empty", {}, [el("h3", { text: "No match" }), el("p", { text: "Try a different word or equipment." })]));
      return;
    }
    for (const ex of list) {
      const row = el("button.row", { style: { width: "100%", textAlign: "left" }, onclick: () => { onPick(ex.id); close(); } }, [
        el("div.row__art", {}, [muscleThumb(ex.primary)]),
        el("div.row__main", {}, [
          el("div.row__title", { text: ex.name }),
          el("div.row__sub", { text: `${ex.equipment} · ${groupOf(ex.primary[0])} · ${ex.difficulty}` }),
        ]),
        frag(icon("plus")),
      ]);
      results.appendChild(row);
    }
  }

  const searchBox = el("div.field", { style: { marginBottom: "10px" } }, [
    el("div.flex.center.gap-10", {
      style: { background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "12px", padding: "0 12px" },
    }, [
      frag(icon("search")),
      el("input.input", {
        placeholder: "Search exercises…",
        style: { border: "none", background: "transparent", paddingLeft: "0" },
        oninput: debounce((e) => { q = e.target.value; paint(); }, 120),
      }),
    ]),
  ]);

  const rail = el("div.rail", { style: { marginTop: "2px" } });
  const equips = ["All", ...EQUIPMENT];
  const chips = {};
  equips.forEach((eq) => {
    const c = el("button.chip" + (eq === "All" ? ".chip--on" : ""), { text: eq, onclick: () => {
      equip = eq;
      Object.values(chips).forEach((x) => x.classList.remove("chip--on"));
      c.classList.add("chip--on");
      paint();
    } });
    chips[eq] = c;
    rail.appendChild(c);
  });

  paint();
  const close = openSheet("Add exercise", [searchBox, rail, results]);
  return close;
}
