# Building the Admin App Launcher

This documents the different approaches tried to make the Shala Gallery admin tool
launchable without opening a Terminal window.

The admin tool is a Node.js/Express server (`admin/server.js`) that runs locally.
The goal was a double-click launcher that starts the server and opens the browser —
ideally with no visible Terminal window.

---

## Approach 1: .command File (Current — Works)

**File:** `Art-gallery.command`

A plain bash script with a `.command` extension. macOS opens `.command` files in
Terminal automatically when double-clicked.

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_DIR="$SCRIPT_DIR/admin"
cd "$ADMIN_DIR" || { echo "Error: admin/ directory not found."; exit 1; }
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
(sleep 1.5 && open http://localhost:3000) &
npm start
```

**Pros:**
- Simple and reliable
- Correctly finds the admin folder relative to its own location using `BASH_SOURCE`
- Installs `node_modules` automatically on first run
- Small (just a text file)
- Works on any Mac with Node.js installed

**Cons:**
- Opens a Terminal window (by design — that's how `.command` files work)
- Terminal stays open while the server runs

---

## Approach 2: Shell Script .app (Tried — Abandoned)

A macOS `.app` bundle with a bash launcher script at `Contents/MacOS/launcher`.
Used `osascript` / AppleScript to try to start the server without showing a Terminal window.

Several strategies were tried:

**Strategy A:** `osascript do shell script` — runs the command silently, no Terminal.
- **Blocked by macOS TCC** (Transparency, Consent, and Control). When an `.app` launches
  a shell script this way, macOS denies access to `~/Documents`. Node.js could not read
  the gallery files.

**Strategy B:** `osascript tell application "Terminal" to do script` — opens a Terminal
window, runs the command inside it. Terminal has TCC permission to access `~/Documents`
so the server starts successfully.
- **Problem:** Terminal window stays open with "Process completed" after the server starts.
  Many attempts were made to close it (using window IDs, temp files, `close window`
  AppleScript), but all either broke the server startup or left the window open anyway.
- **Outcome:** Works, but always leaves a lingering Terminal window. User accepted this
  as good enough for a while, but eventually looked for a cleaner solution.

---

## Approach 3: Automator .app (User Made — Fragile)

**File:** `ArtAdmin.app` — created by the user in macOS Automator using a
"Run Shell Script" action.

```bash
APP_PATH=$(dirname "$0")
cd "$APP_PATH/Contents/Resources/admin"
NODE_EXEC=$(which node || echo "/usr/local/bin/node")
$NODE_EXEC server.js >/dev/null 2>&1 &
sleep 2
open "http://localhost:3000"
```

**Pros:**
- No Terminal window (Automator apps run shell scripts silently)
- Automator apparently has TCC access to `~/Documents`

**Cons / Problems:**
- **Path resolution is wrong:** In Automator's shell context, `$0` is the shell binary
  (`/bin/zsh`), not the `.app` path. So `dirname "$0"` returns `/bin`, and
  `cd "/bin/Contents/Resources/admin"` silently fails. The server doesn't actually start
  on a cold launch — it only appears to work if the server was already running from before.
- **`admin/` is not inside the .app bundle** — the script assumes `Contents/Resources/admin`
  exists inside the bundle, but the admin folder lives next to the .app at `art-gallery/admin/`.
- The reliable fix would be to hardcode the full path, but that breaks on another computer.
- No check for `node_modules` installation.

---

## Approach 4: Electron App (Built — Works, But Large)

**Files:** `admin/electron-main.js`, built to `admin/dist/Art Gallery Admin.app/`
(gitignored), then installed to `art-gallery/Art Gallery Admin.app/` (also gitignored).

Electron is a framework that bundles Node.js + Chromium into a standalone `.app`.
Instead of opening a browser tab, it opens its own native window.

**How it works:**
- `electron-main.js` sets up `PATH` so Node can find binaries, then `require('./server.js')`
  to start the Express server in-process.
- Polls `http://localhost:3000` every 200ms until the server is ready, then opens a
  `BrowserWindow` pointing to it.
- When packaged, `__dirname` is inside the bundle (`Contents/Resources/app/`), so
  `process.env.GALLERY_DIR` is set to `path.resolve(__dirname, '../../../..')` — which
  points to the folder containing the `.app`, i.e., `art-gallery/`.

```js
if (app.isPackaged) {
  process.env.GALLERY_DIR = path.resolve(__dirname, '../../../..');
}
require('./server.js');
```

**Build command:**
```bash
cd art-gallery/admin
npm run build
# produces: admin/dist/Art Gallery Admin.app/
```

**Pros:**
- No Terminal window at all
- Native app experience (Dock icon, Cmd+Q to quit, etc.)
- Server and UI are one process

**Cons:**
- **~200MB** — bundles all of Chromium and Node.js
- **Not shareable easily:** Not code-signed (Gatekeeper blocks it for other users),
  built for arm64 only, and must be placed in `art-gallery/` to resolve paths correctly
- Must be rebuilt on each computer (`npm run build`) — too large to commit to git
- `sharp` and other native modules are compiled for the build machine and may not work
  on a different Mac

---

## Summary

| Approach | Terminal window | Works cold? | Shareable | Size |
|---|---|---|---|---|
| `.command` file | Yes (by design) | Yes | Yes (needs Node.js) | Tiny |
| Shell script `.app` | Yes (lingers) | Yes | Rebuild needed | Small |
| Automator `.app` | No | No (path bug) | No (hardcoded path) | Small |
| Electron `.app` | No | Yes | No (unsigned, arm64, 200MB) | ~200MB |

**Current setup:**
- `Art-gallery.command` — double-click launcher (opens Terminal, always works)
- `ArtAdmin.app` — Automator launcher (no Terminal, but fragile — path resolution bug)
- `Art Gallery Admin.app` — Electron launcher (no Terminal, fully works, but large and not committed to git)

The root challenge throughout was **macOS TCC**: the operating system blocks unsigned
shell scripts launched from `.app` bundles from accessing `~/Documents`, which is where
the gallery lives. The workarounds that succeeded either involved Terminal (which has
TCC permission) or Electron (which runs as a proper app and gets TCC access).
