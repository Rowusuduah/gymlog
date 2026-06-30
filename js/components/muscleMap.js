// ============================================================
//  Muscle map — stylized front & back figures built from
//  muscle "blocks". Highlights primary (volt) + secondary.
//  All markup static; highlight applied via classList.
// ============================================================
import { frag } from "../utils.js";

// A region: id used for class `m-<key>`. Multiple shapes per key allowed.
const FRONT = `
<svg viewBox="0 0 100 200" class="mbody" aria-hidden="true">
  <ellipse class="joint" cx="50" cy="14" rx="8.5" ry="9"/>
  <rect class="joint" x="46" y="22" width="8" height="6" rx="3"/>
  <g class="m-shoulders"><ellipse cx="30" cy="38" rx="8" ry="6.5"/><ellipse cx="70" cy="38" rx="8" ry="6.5"/></g>
  <g class="m-chest"><path d="M40 38c-7 0-11 3-11 9 0 5 5 8 11 8 3 0 5-1 6-3v-12c-1-1-3-2-6-2Z"/><path d="M60 38c7 0 11 3 11 9 0 5-5 8-11 8-3 0-5-1-6-3v-12c1-1 3-2 6-2Z"/></g>
  <g class="m-biceps"><ellipse cx="26" cy="56" rx="5" ry="10"/><ellipse cx="74" cy="56" rx="5" ry="10"/></g>
  <g class="m-forearms"><ellipse cx="22.5" cy="76" rx="4.5" ry="11"/><ellipse cx="77.5" cy="76" rx="4.5" ry="11"/></g>
  <g class="m-abs"><rect x="43" y="56" width="14" height="26" rx="5"/></g>
  <g class="m-obliques"><path d="M41 58c-3 1-4 4-4 9s1 9 3 12l3-1V58Z"/><path d="M59 58c3 1 4 4 4 9s-1 9-3 12l-3-1V58Z"/></g>
  <g class="m-quads"><ellipse cx="42" cy="112" rx="7.5" ry="22"/><ellipse cx="58" cy="112" rx="7.5" ry="22"/></g>
  <g class="m-calves"><ellipse cx="42" cy="158" rx="5.5" ry="16"/><ellipse cx="58" cy="158" rx="5.5" ry="16"/></g>
  <circle class="joint" cx="22" cy="90" r="3.6"/><circle class="joint" cx="78" cy="90" r="3.6"/>
  <rect class="joint" x="38" y="178" width="8" height="6" rx="2"/><rect class="joint" x="54" y="178" width="8" height="6" rx="2"/>
</svg>`;

const BACK = `
<svg viewBox="0 0 100 200" class="mbody" aria-hidden="true">
  <ellipse class="joint" cx="50" cy="14" rx="8.5" ry="9"/>
  <g class="m-traps"><path d="M50 24c-9 1-15 5-19 10 5-2 9-2 13-1l6 2 6-2c4-1 8-1 13 1-4-5-10-9-19-10Z"/></g>
  <g class="m-shoulders"><ellipse cx="30" cy="38" rx="8" ry="6.5"/><ellipse cx="70" cy="38" rx="8" ry="6.5"/></g>
  <g class="m-upperback"><rect x="43" y="36" width="14" height="14" rx="4"/></g>
  <g class="m-triceps"><ellipse cx="26" cy="56" rx="5" ry="10"/><ellipse cx="74" cy="56" rx="5" ry="10"/></g>
  <g class="m-forearms"><ellipse cx="22.5" cy="76" rx="4.5" ry="11"/><ellipse cx="77.5" cy="76" rx="4.5" ry="11"/></g>
  <g class="m-lats"><path d="M43 50c-6 1-11 4-12 11-1 6 0 11 2 15l10-3V50Z"/><path d="M57 50c6 1 11 4 12 11 1 6 0 11-2 15l-10-3V50Z"/></g>
  <g class="m-lowerback"><rect x="44" y="68" width="12" height="14" rx="4"/></g>
  <g class="m-glutes"><ellipse cx="43" cy="96" rx="8.5" ry="9"/><ellipse cx="57" cy="96" rx="8.5" ry="9"/></g>
  <g class="m-hamstrings"><ellipse cx="42" cy="124" rx="7.5" ry="19"/><ellipse cx="58" cy="124" rx="7.5" ry="19"/></g>
  <g class="m-calves"><ellipse cx="42" cy="160" rx="5.5" ry="16"/><ellipse cx="58" cy="160" rx="5.5" ry="16"/></g>
  <circle class="joint" cx="22" cy="90" r="3.6"/><circle class="joint" cx="78" cy="90" r="3.6"/>
  <rect class="joint" x="38" y="180" width="8" height="6" rx="2"/><rect class="joint" x="54" y="180" width="8" height="6" rx="2"/>
</svg>`;

function paint(svg, primary, secondary) {
  svg.querySelectorAll("[class^='m-'], [class*=' m-']").forEach((g) => {
    const key = [...g.classList].find((c) => c.startsWith("m-"))?.slice(2);
    g.classList.remove("on", "secondary");
    if (primary.includes(key)) g.classList.add("on");
    else if (secondary.includes(key)) g.classList.add("secondary");
  });
}

/**
 * Build a muscle map. Shows whichever views are relevant.
 * @param {string[]} primary highlighted strongly (volt)
 * @param {string[]} secondary highlighted faintly
 */
export function muscleMap(primary = [], secondary = []) {
  const wrap = frag('<div class="musclewrap"></div>');
  const front = frag(FRONT);
  const back = frag(BACK);
  paint(front, primary, secondary);
  paint(back, primary, secondary);
  wrap.appendChild(front);
  wrap.appendChild(back);
  return wrap;
}

/** A tiny single-figure thumbnail for list rows (front only). */
export function muscleThumb(primary = []) {
  const svg = frag(FRONT);
  paint(svg, primary, []);
  svg.classList.add("mthumb");
  return svg;
}
