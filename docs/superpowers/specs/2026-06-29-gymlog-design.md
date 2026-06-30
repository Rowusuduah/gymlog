# GymLog — Design Spec

**Date:** 2026-06-29
**Status:** Approved (design direction confirmed by user)

## Purpose

A beautiful, offline-first **progressive web app (PWA)** for a beginner gym-goer to
plan, log, and analyze training. Opens on the phone, installs to the home screen,
works without internet, and stores all data on-device. Ships free to GitHub Pages.

## Goals

- Log workouts fast (sets × reps × weight) while at the gym.
- A comprehensive **exercise + equipment library** with pictures and beginner
  "rule-of-thumb" guidance — the user does not need to know equipment names.
- Track **body metrics** and **progress** (charts, estimated 1RM, PRs, streaks).
- Look genuinely premium; work fully offline; never lose data (export/import backup).

## Non-Goals (YAGNI)

- No accounts, no backend, no cloud sync (data is local + export file).
- No social features, no in-app purchases.
- No native iOS/Android build (PWA install covers the phone use case).

## Platform & Tech

- **Plain HTML / CSS / vanilla JS (ES modules)** — no build step, deploys directly
  to GitHub Pages.
- **PWA**: `manifest.webmanifest` + service worker (`sw.js`) for offline + install.
- **Storage**: `localStorage` via a single data-layer module, with JSON
  **export/import** for backup.
- **Charts**: hand-drawn **SVG** (no external chart library → offline, no deps).
- **Pictures**: built-in **SVG muscle-map** (front/back body highlighting worked
  muscles) + **SVG equipment icons** → offline-safe, license-free, never broken.
- **Fonts vendored locally** (woff2 in `assets/fonts`) so typography survives offline.

## Aesthetic

Dark "performance" athletic theme. Deep charcoal canvas, one electric **volt-lime**
accent, condensed bold display numerals (scoreboard feel), subtle gradient-mesh
glow background, muscle maps that glow in the accent. Optional light theme toggle.
Display font: **Anton** (condensed athletic). Body font: **Hanken Grotesk**.

## Screens (bottom tab navigation)

1. **Today** — greeting + streak, "Start workout" / resume, today's plan, rest timer,
   recent sessions, a rotating Coach tip.
2. **Log** — active workout: add exercises from library, add sets (weight × reps,
   RIR/notes), auto rest-timer per set, previous-session reference, save session.
3. **Library** — searchable/filterable catalog across ALL equipment
   (bodyweight, dumbbell, barbell, machine, cable, kettlebell, band). Each entry:
   muscle-map picture, equipment, difficulty, step-by-step how-to, common mistakes,
   beginner rule-of-thumb (sets/reps/rest/starting-weight/tempo).
3. **Body** — log bodyweight + measurements (waist, chest, arms, thighs, hips,
   shoulders), trend charts, latest deltas.
4. **Progress** — per-exercise strength chart + estimated 1RM, **PR list**, weekly
   training volume per muscle group, workout streak/calendar.

Plus a **Settings** panel: units (kg/lb, switchable anytime — recompute display),
theme, goal (strength/hypertrophy/endurance — tunes rule-of-thumb targets),
export data, import data, reset.

## Data Model (localStorage JSON)

```
settings   { units:"kg"|"lb", theme, goal, name }
sessions[] { id, dateISO, exercises:[ { exId, sets:[ {weight,reps,rir,done} ] } ], notes, durationSec }
body[]     { id, dateISO, weight, measurements:{ waist,chest,arms,thighs,hips,shoulders } }
prs (derived from sessions; estimated 1RM = Epley)
```

All weights stored in **kg internally**; converted only for display, so the unit
toggle is lossless.

## Coach (rule-of-thumb engine)

Goal-based targets (beginner-weighted):
- Strength: 3–5 reps, 3–5 sets, 2–4 min rest.
- Hypertrophy: 8–12 reps, 3–4 sets, 60–90 s rest.
- Endurance: 12–20 reps, 2–3 sets, 30–60 s rest.
Plus rotating tips: progressive overload, warmup ramp sets, leave 1–2 reps in
reserve (RIR), train each muscle 2–3×/week, deload every 4–8 weeks, sleep/protein.

## File Structure

```
index.html, manifest.webmanifest, sw.js, README.md, .gitignore
css/styles.css
js/ app.js, store.js, state.js, coach.js, utils.js, router.js
js/components/ muscleMap.js, charts.js, icons.js, restTimer.js
js/views/ today.js, log.js, library.js, body.js, progress.js, settings.js
data/ exercises.js, muscles.js
assets/ fonts/*, icon-192.png, icon-512.png, favicon.svg
```

## Shipping

Git init → commit → `gh repo create` (account: Rowusuduah) → push → enable GitHub
Pages on the default branch → return the live URL.

## Success Criteria

- Installable PWA, loads + functions fully offline after first visit.
- Can log a full workout, see it in Progress, see a PR, log bodyweight, browse the
  library with pictures + guidance.
- Unit toggle and theme toggle work without data loss.
- Live on GitHub Pages.
```
