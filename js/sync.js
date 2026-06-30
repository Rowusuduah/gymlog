// ============================================================
//  Google Drive sync — client-side, no server.
//  Stores one backup file in the app's private Drive folder
//  (appDataFolder), using the minimal `drive.appdata` scope.
//  The user's data only ever goes to their own Google Drive.
// ============================================================
import { db, setData, mutate, onMutate } from "./store.js";
import { settings, emit } from "./state.js";
import { debounce } from "./utils.js";

const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const FILE_NAME = "gymlog-backup.json";

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;
let gisLoaded = false;

export const sync = {
  status: "idle",      // idle | connecting | syncing | synced | error | offline
  message: "",
  lastSyncedAt: 0,
};

function setStatus(status, message = "") {
  sync.status = status;
  sync.message = message;
  emit();
}

// ---------- GIS bootstrap ----------
function loadGis() {
  return new Promise((resolve, reject) => {
    if (gisLoaded && window.google?.accounts?.oauth2) return resolve();
    if (!navigator.onLine) return reject(new Error("You're offline — connect to the internet to sync."));
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) { existing.addEventListener("load", () => { gisLoaded = true; resolve(); }); return; }
    const s = document.createElement("script");
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = () => { gisLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(s);
  });
}

function ensureTokenClient() {
  const clientId = settings().googleClientId?.trim();
  if (!clientId) throw new Error("Add your Google Client ID in settings first.");
  if (tokenClient && tokenClient._clientId === clientId) return tokenClient;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: () => {}, // replaced per request
  });
  tokenClient._clientId = clientId;
  return tokenClient;
}

/** Request an access token. interactive=false tries silently first. */
function requestToken(interactive) {
  return new Promise((resolve, reject) => {
    const tc = ensureTokenClient();
    tc.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error));
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3600000) - 60000;
      resolve(accessToken);
    };
    try {
      tc.requestAccessToken({ prompt: interactive ? "consent" : "" });
    } catch (e) { reject(e); }
  });
}

async function getToken(interactive) {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  await loadGis();
  return requestToken(interactive);
}

// ---------- Drive REST ----------
async function driveFetch(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${accessToken}`, ...(opts.headers || {}) } });
  if (res.status === 401) { accessToken = null; throw new Error("Session expired — reconnect."); }
  if (!res.ok) throw new Error(`Drive error ${res.status}`);
  return res;
}

async function findFileId() {
  const url = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,modifiedTime)&q=" + encodeURIComponent(`name='${FILE_NAME}'`);
  const res = await driveFetch(url);
  const json = await res.json();
  return json.files?.[0]?.id || null;
}

async function downloadFile(id) {
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  return res.json();
}

async function uploadFile(id, dataObj) {
  const body = JSON.stringify(dataObj);
  if (id) {
    await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body,
    });
    return id;
  }
  const boundary = "gymlog" + Math.random().toString(36).slice(2);
  const metadata = { name: FILE_NAME, parents: ["appDataFolder"] };
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const res = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body: multipart,
  });
  return (await res.json()).id;
}

// ---------- merge (last-write-wins per record, union of history) ----------
export function mergeData(local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const byId = (arr) => { const m = new Map(); for (const x of arr || []) m.set(x.id, x); return m; };

  const sessions = byId(local.sessions);
  for (const s of remote.sessions || []) if (!sessions.has(s.id)) sessions.set(s.id, s);

  const body = byId(local.body);
  for (const b of remote.body || []) {
    const cur = body.get(b.id);
    // same-day body entries: keep the most complete / newer side wins by updatedAt of blob
    if (!cur) body.set(b.id, b);
  }

  const localNewer = (local.updatedAt || 0) >= (remote.updatedAt || 0);
  const newer = localNewer ? local : remote;
  return {
    version: 1,
    updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0),
    settings: newer.settings,
    sessions: [...sessions.values()].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    body: [...body.values()].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    active: newer.active || null,
  };
}

// ---------- public actions ----------
export async function connectDrive() {
  try {
    setStatus("connecting", "Opening Google sign-in…");
    await getToken(true); // interactive consent
    mutate((d) => { d.settings.driveConnected = true; });
    await syncNow(true);
  } catch (e) {
    setStatus("error", e.message || "Sign-in failed");
  }
}

export function disconnectDrive() {
  accessToken = null; tokenExpiry = 0;
  mutate((d) => { d.settings.driveConnected = false; });
  if (window.google?.accounts?.oauth2 && accessToken) {
    try { window.google.accounts.oauth2.revoke(accessToken); } catch {}
  }
  setStatus("idle", "Disconnected");
}

export async function syncNow(interactive = false) {
  if (!settings().driveConnected && !interactive) return;
  if (!navigator.onLine) { setStatus("offline", "Offline — will sync when back online"); return; }
  try {
    setStatus("syncing", "Syncing…");
    await getToken(interactive);
    const id = await findFileId();
    const remote = id ? await downloadFile(id) : null;
    const merged = mergeData(db(), remote);
    setData(merged);
    await uploadFile(id, db());
    sync.lastSyncedAt = Date.now();
    setStatus("synced", "Up to date");
  } catch (e) {
    setStatus("error", e.message || "Sync failed");
  }
}

// auto-push after local edits (debounced)
const autoPush = debounce(() => { if (settings().driveConnected) syncNow(false); }, 4000);
export function notifyChanged() { if (settings().driveConnected) autoPush(); }

// called on app boot
export async function initSync() {
  onMutate(notifyChanged); // auto-push after genuine user edits
  if (settings().driveConnected && settings().googleClientId) {
    // try a silent sync; if it needs consent the user can tap Connect again
    try { await syncNow(false); } catch {}
  }
  window.addEventListener("online", () => { if (settings().driveConnected) syncNow(false); });
}
