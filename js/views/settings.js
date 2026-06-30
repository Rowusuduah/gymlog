// ============================================================
//  Settings — units, theme, goal, backup & restore
// ============================================================
import { el, frag, toast, todayISO } from "../utils.js";
import { icon } from "../components/icons.js";
import { confirmSheet } from "../components/sheet.js";
import { settings, setSetting } from "../state.js";
import { exportData, importData, resetAll } from "../store.js";
import { sync, connectDrive, disconnectDrive, syncNow } from "../sync.js";
import { GOALS, goalConfig, repTarget, restTarget } from "../coach.js";
import { navigate } from "../app.js";

export function renderSettings() {
  const s = settings();
  const root = el("div.stagger");

  root.appendChild(el("div.flex.between.center.mb-16", {}, [
    el("div", {}, [el("div.h-eyebrow", { text: "Preferences" }), el("h1.h-display.mt-8", { text: "Settings" })]),
    el("a.iconbtn", { href: "#/today", "aria-label": "Done" }, [frag(icon("close"))]),
  ]));

  // name
  root.appendChild(el("div.card", {}, [
    el("div.field", { style: { margin: "0" } }, [
      el("label", { text: "Your name" }),
      el("input.input", { placeholder: "Athlete", value: s.name || "", onchange: (e) => setSetting("name", e.target.value.trim()) }),
    ]),
  ]));

  // units
  root.appendChild(settingRow("Weight units", "Switch anytime — your history converts automatically.",
    seg(["kg", "lb"], s.units, (v) => { setSetting("units", v); toast(`Units: ${v}`); })
  ));

  // theme
  root.appendChild(settingRow("Theme", "Dark is easy on the eyes; light is bright for daytime.",
    seg([["dark", "Dark"], ["light", "Light"]], s.theme, (v) => setSetting("theme", v))
  ));

  // goal
  const goalCard = el("div.card", {}, [
    el("div.card-title", {}, [frag(icon("bolt")), el("h2.h-section", { text: "Training goal" })]),
    el("p.muted", { style: { fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" }, text: "Tunes the rep, set and rest targets the Coach recommends." }),
    el("div.rail", { style: { margin: "0" } }, Object.entries(GOALS).map(([k, g]) =>
      el("button.chip" + (s.goal === k ? ".chip--on" : ""), { text: g.label, onclick: () => setSetting("goal", k) })
    )),
    el("p.dim.mt-14", { style: { fontSize: "13px" }, text: `${goalConfig(s.goal).label}: ${repTarget(s.goal)} · rest ${restTarget(s.goal)}` }),
  ]);
  root.appendChild(goalCard);

  // rest default
  root.appendChild(el("div.card", {}, [
    el("div.flex.between.center", {}, [
      el("div", {}, [el("div.row__title", { text: "Default rest timer" }), el("div.row__sub", { text: "Starts automatically when you complete a set." })]),
      el("div.seg", {}, [60, 90, 120, 180].map((sec) =>
        el("button" + (s.restDefault === sec ? ".on" : ""), { text: sec >= 120 ? `${sec / 60}m` : `${sec}s`, onclick: () => { setSetting("restDefault", sec); } })
      )),
    ]),
  ]));

  // backup
  root.appendChild(el("div.card", {}, [
    el("div.card-title", {}, [frag(icon("download")), el("h2.h-section", { text: "Backup & restore" })]),
    el("p.muted", { style: { fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" }, text: "Your data lives only on this device. Export a backup file regularly, and import it on a new device." }),
    el("div.flex.gap-10", {}, [
      el("button.btn.btn--block", { onclick: doExport }, [frag(icon("download")), "Export"]),
      el("button.btn.btn--block", { onclick: doImport }, [frag(icon("upload")), "Import"]),
    ]),
  ]));

  // cloud sync
  root.appendChild(cloudCard(s));

  // danger
  root.appendChild(el("div.card", {}, [
    el("button.btn.btn--danger.btn--block", { onclick: doReset }, [frag(icon("trash")), "Reset all data"]),
  ]));

  // about
  root.appendChild(el("div.empty", { style: { paddingBottom: "0" } }, [
    el("div.empty__art", {}, [frag(icon("dumbbell"))]),
    el("h3", { text: "GymLog" }),
    el("p", { text: "Train. Log. Progress. · Works offline · Add to your home screen to install." }),
  ]));

  return root;
}

// ---------- cloud sync ----------
const SETUP_URL = "https://github.com/Rowusuduah/gymlog/blob/main/docs/google-drive-setup.md";

function statusPill() {
  const map = {
    synced:    ["chip--volt", "Up to date"],
    syncing:   ["", "Syncing…"],
    connecting:["", "Connecting…"],
    offline:   ["", "Offline"],
    error:     ["", sync.message || "Error"],
    idle:      ["", "Not synced"],
  };
  const [cls, label] = map[sync.status] || map.idle;
  return el("div.chip", { class: cls, text: label });
}

function cloudCard(s) {
  const connected = s.driveConnected;
  const hasId = !!(s.googleClientId && s.googleClientId.trim());

  const head = el("div.flex.between.center", {}, [
    el("div.card-title", { style: { margin: "0" } }, [frag(icon("upload")), el("h2.h-section", { text: "Cloud sync" })]),
    statusPill(),
  ]);

  const body = [];

  if (!hasId) {
    body.push(el("p.muted", { style: { fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" }, text: "Sync your data to your own Google Drive so it follows you across devices. First, paste a free Google OAuth Client ID (one-time, ~5 min setup)." }));
    const input = el("input.input", { placeholder: "xxxxx.apps.googleusercontent.com", value: s.googleClientId || "" });
    body.push(el("div.field", { style: { margin: "0 0 10px" } }, [el("label", { text: "Google Client ID" }), input]));
    body.push(el("div.flex.gap-10", {}, [
      el("a.btn.btn--block", { href: SETUP_URL, target: "_blank", rel: "noopener" }, [frag(icon("info")), "Setup guide"]),
      el("button.btn.btn--volt.btn--block", { onclick: () => {
        const v = input.value.trim();
        if (!v) return toast("Paste your Client ID first");
        setSetting("googleClientId", v); toast("Client ID saved");
      } }, [frag(icon("check")), "Save"]),
    ]));
  } else if (!connected) {
    body.push(el("p.muted", { style: { fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" }, text: "Connect your Google account to back up and sync your training data to your private Drive folder. It only ever touches your own Drive." }));
    body.push(el("button.btn.btn--volt.btn--block", { onclick: connectDrive }, [frag(icon("upload")), "Connect Google Drive"]));
    body.push(el("button.btn.btn--ghost.btn--sm.mt-8", { onclick: () => { setSetting("googleClientId", ""); } }, ["Change Client ID"]));
  } else {
    body.push(el("p.muted", { style: { fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" }, text: sync.lastSyncedAt ? "Connected. Your data syncs automatically after each change and when you reopen the app." : "Connected to Google Drive. Your data will sync automatically." }));
    body.push(el("div.flex.gap-10", {}, [
      el("button.btn.btn--volt.btn--block", { onclick: () => syncNow(true) }, [frag(icon("download")), "Sync now"]),
      el("button.btn.btn--block", { onclick: disconnectDrive }, [frag(icon("close")), "Disconnect"]),
    ]));
  }

  if (sync.status === "error" && sync.message) {
    body.push(el("p", { style: { color: "var(--bad)", fontSize: "13px", marginTop: "10px" }, text: sync.message }));
  }

  return el("div.card", {}, [head, el("div.mt-14", {}, body)]);
}

// ---------- actions ----------
function doExport() {
  const blob = new Blob([exportData()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: `gymlog-backup-${todayISO()}.json` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Backup downloaded");
}

function doImport() {
  const input = el("input", { type: "file", accept: "application/json,.json", style: { display: "none" } });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(String(reader.result));
        toast("Backup restored ✓");
        navigate("today");
        location.reload();
      } catch (e) {
        toast("Import failed: " + (e.message || "bad file"));
      }
    };
    reader.readAsText(file);
  });
  document.body.appendChild(input); input.click(); input.remove();
}

async function doReset() {
  if (await confirmSheet("Reset everything?", "This permanently deletes all workouts, body logs and settings on this device. Export a backup first if unsure.", { danger: true, okLabel: "Delete all" })) {
    resetAll();
    toast("All data cleared");
    navigate("today");
    location.reload();
  }
}

// ---------- helpers ----------
function settingRow(title, sub, control) {
  return el("div.card", {}, [
    el("div.flex.between.center", { style: { gap: "12px" } }, [
      el("div", {}, [el("div.row__title", { text: title }), el("div.row__sub", { text: sub })]),
      control,
    ]),
  ]);
}

function seg(options, current, onPick) {
  const wrap = el("div.seg");
  for (const opt of options) {
    const [val, label] = Array.isArray(opt) ? opt : [opt, opt];
    wrap.appendChild(el("button" + (current === val ? ".on" : ""), { text: label, onclick: () => onPick(val) }));
  }
  return wrap;
}
