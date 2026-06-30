// ============================================================
//  Floating rest timer — countdown ring, +15s, dismiss.
//  Singleton: only one runs at a time.
// ============================================================
import { el, frag, fmtClock, haptic } from "../utils.js";
import { icon } from "./icons.js";

let node = null;
let raf = null;
let endAt = 0;
let total = 0;
let beeped = false;

function tick() {
  if (!node) return;
  const remain = (endAt - Date.now()) / 1000;
  const ring = node.querySelector(".timer-ring-fg");
  const time = node.querySelector(".timer__time");
  const pct = Math.max(0, Math.min(1, remain / total));
  const circ = 2 * Math.PI * 20;
  ring.style.strokeDashoffset = String(circ * (1 - pct));
  time.textContent = fmtClock(Math.max(0, remain));

  if (remain <= 0 && !beeped) {
    beeped = true;
    ring.style.stroke = "var(--good)";
    haptic([60, 40, 60]);
    beep();
    node.querySelector(".timer__lbl").textContent = "Rest complete";
  }
  if (remain <= -1) { stopRest(); return; }
  raf = requestAnimationFrame(tick);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.42);
  } catch {}
}

export function startRest(seconds) {
  stopRest();
  total = seconds; endAt = Date.now() + seconds * 1000; beeped = false;
  const circ = 2 * Math.PI * 20;
  node = el("div.timer", {}, [
    frag(`<div class="timer__ring">
      <svg viewBox="0 0 46 46" width="46" height="46">
        <circle cx="23" cy="23" r="20" fill="none" stroke="var(--surface)" stroke-width="4"/>
        <circle class="timer-ring-fg" cx="23" cy="23" r="20" fill="none" stroke="var(--volt)" stroke-width="4"
          stroke-linecap="round" transform="rotate(-90 23 23)"
          stroke-dasharray="${circ}" stroke-dashoffset="0"/>
      </svg></div>`),
    el("div.grow", {}, [
      el("div.timer__time.tnum", { text: fmtClock(seconds) }),
      el("div.timer__lbl", { text: "Rest" }),
    ]),
    el("button.btn.btn--sm", { onclick: () => addTime(15) }, ["+15s"]),
    el("button.iconbtn", { onclick: stopRest, "aria-label": "Dismiss timer" }, [frag(icon("close"))]),
  ]);
  document.body.appendChild(node);
  raf = requestAnimationFrame(tick);
  haptic(10);
}

function addTime(s) {
  endAt += s * 1000;
  if (beeped) { beeped = false; node.querySelector(".timer-ring-fg").style.stroke = "var(--volt)"; node.querySelector(".timer__lbl").textContent = "Rest"; }
  total += s;
}

export function stopRest() {
  if (raf) cancelAnimationFrame(raf), (raf = null);
  if (node) { node.remove(); node = null; }
}

export const restActive = () => !!node;
