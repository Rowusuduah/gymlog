# Connect GymLog to your Google Drive (5-minute setup)

GymLog syncs to **your own** Google Drive using a free Google "OAuth Client ID".
You create it once, paste it into GymLog, and you're done. GymLog only ever uses a
private app folder in your Drive (the `drive.appdata` scope) — it can't see your
other files, and your data never passes through any server.

You only need to do this **once**, on your Google account.

---

## Step 1 — Open Google Cloud Console
Go to **https://console.cloud.google.com/** and sign in with the Google account
you want your data saved to.

## Step 2 — Create a project
- Click the project dropdown (top-left) → **New Project**.
- Name it e.g. `GymLog` → **Create**. Wait a few seconds, then select it.

## Step 3 — Enable the Google Drive API
- In the search bar, type **Google Drive API** → open it → **Enable**.

## Step 4 — Configure the consent screen
- Left menu → **APIs & Services → OAuth consent screen**.
- User type: **External** → **Create**.
- App name: `GymLog`. User support email: your email. Developer email: your email.
  Leave the rest blank → **Save and Continue**.
- **Scopes**: skip → **Save and Continue**.
- **Test users**: click **Add Users**, add **your own Gmail address** → **Save and Continue**.
  (This lets you use the app while it's unverified.)

## Step 5 — Create the Client ID
- Left menu → **APIs & Services → Credentials**.
- **+ Create Credentials → OAuth client ID**.
- Application type: **Web application**. Name: `GymLog Web`.
- Under **Authorized JavaScript origins**, click **+ Add URI** and add **exactly**:
  ```
  https://rowusuduah.github.io
  ```
  (origin only — no `/gymlog`, no trailing slash.)
- Click **Create**.
- Copy the **Client ID** (looks like `1234567890-abcd....apps.googleusercontent.com`).

## Step 6 — Paste it into GymLog
- Open https://rowusuduah.github.io/gymlog/ → **Settings → Cloud sync**.
- Paste the Client ID → **Save**.
- Tap **Connect Google Drive** → choose your Google account.
- You'll see **"Google hasn't verified this app"** — this is expected for a
  personal app. Click **Advanced → Go to GymLog (unsafe)** → **Allow**.

Done! Your workouts now back up to your Drive automatically after each change, and
restore when you open GymLog on any device (just paste the same Client ID there).

---

### Notes
- **Privacy:** the `drive.appdata` scope means GymLog can only read/write its own
  hidden folder — it cannot access any of your other Drive files, and you never
  share your Google password with the app (you approve on Google's own screen).
- **Offline:** logging always works offline; syncing happens next time you're online.
- **Other devices:** install GymLog and paste the *same* Client ID — your data
  merges together (no workout is lost).
- **Want it fully verified** (no "unverified" warning)? That requires Google's
  verification review; not necessary for personal use.
