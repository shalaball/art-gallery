# Getting Started — Shala Gallery Admin

This guide sets up the gallery admin app on a new computer.

---

## Prerequisites

Install these before you begin:

- **Git** — https://git-scm.com/downloads
- **Node.js** (v18 or later) — https://nodejs.org

Verify they are installed by opening a terminal and running:

```bash
git --version
node --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/shalaball/art-gallery.git
cd art-gallery
```

---

## 2. Launch the App

Double-click **`Art-gallery.command`** in the `art-gallery` folder.

A Terminal window will open, install any missing dependencies automatically, start the server, and open the admin in your browser.

> **First launch only:** macOS may block the file with a security warning.
> If that happens: right-click `Art-gallery.command` → **Open** → click **Open** in the dialog.

---

## 2a. Add to Applications (optional)

To launch the app from Spotlight or the Dock like any other Mac app:

1. In Finder, open the `art-gallery` folder
2. Right-click **`Art Gallery Admin.app`** → **Make Alias**
3. Drag the alias into your `/Applications` folder

You can then launch it from Spotlight (`Cmd+Space` → type "Art Gallery Admin") or pin it to the Dock.

> **First launch only:** Right-click the app → **Open** → click **Open** to allow it past Gatekeeper.

---

## 2b. Launching from the Terminal (alternative)

If you prefer the command line:

```bash
cd art-gallery
./Art-gallery.command
```

---

## 4. Using the Admin

- **Left sidebar** — lists all gallery pages. Click a page to manage its photos and labels.
- **Home** — edit the site title, subtitle, footer, and design settings (colors, fonts).
- **Upload Photos** — drag and drop or click the Upload button on any page.
- **Save Changes** — saves edits to disk (CONTENT.md and labels.js). Do this before publishing.
- **Publish on GitHub** — commits all changes and pushes to GitHub. The live site at shalaball.com updates within ~30 seconds.

---

## 5. Publishing to GitHub (Push Authentication)

The **Publish on GitHub** button runs `git push` under the hood. The new computer needs to be authenticated with GitHub for this to work.

### Option A — HTTPS with a Personal Access Token (simpler)

1. Go to https://github.com/settings/tokens and create a **Personal Access Token (classic)** with `repo` scope.
2. The first time you push, Git will ask for your username and password — use your GitHub username and the token as the password.
3. Git will cache the credentials so you won't be asked again.

### Option B — SSH Key

1. Generate a key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your@email.com"
   ```
2. Copy the public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. Add it to GitHub: https://github.com/settings/keys
4. Update the repo's remote URL to use SSH:
   ```bash
   git remote set-url origin git@github.com:shalaball/art-gallery.git
   ```

---

## Stopping the Server

Press `Ctrl+C` in the Terminal window, or simply close it. You can also use the **✕ Quit** button in the admin UI.

## Starting Again Later

Double-click **`Art-gallery.command`** in the `art-gallery` folder.

## Getting the Latest Changes

If changes were made on another computer and published, run this inside the `art-gallery` folder to sync them locally:

```bash
git pull
```
