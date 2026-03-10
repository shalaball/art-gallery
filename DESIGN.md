# Art Gallery — Design Document

## Overview
A clean, professional art gallery website hosted on GitHub Pages at:
**https://shalaball.com**

---

## Design Philosophy
Inspired by sites like Saatchi Art and Artsy — minimal, elegant, and focused on letting the artwork speak. The design uses generous white space, refined typography, and subtle interactions to create a museum-quality feel.

---

## Typography
- **Titles & Captions:** Cormorant Garamond (Google Font) — a classic, refined serif that feels gallery-appropriate
- **Navigation & Body:** Montserrat Light — a clean, modern sans-serif for readability and contrast

---

## Color Palette
| Element | Color |
|---|---|
| Background | Warm light gray `#ebebeb` |
| Primary text | Dark charcoal `#222222` |
| Secondary text / captions | Medium gray `#888888` |
| Caption descriptions | Light gray `#aaaaaa` |
| Dividers | Light gray `#cccccc` |
| Navigation (inactive) | Medium gray `#888888` |
| Navigation (active/hover) | Dark charcoal `#222222` |
| Footer text | Light gray `#cccccc` |

---

## Layout & Structure

### Home Page (`/index.html`)
- Top navigation bar with links to all gallery sections
- Large elegant title: "Shala Ball Art"
- Subtitle: "A curated collection"
- Thin horizontal divider line (40px wide, 1px tall)
- Dark button-style links to each gallery section
- Footer with copyright

### Gallery Pages (`/page-1/`, `/page-2/`, `/page-3/`)
- Top navigation (Home | New Art | On Display in the San Francisco Bay Area | On Display in San Diego | All)
- Active page highlighted in nav
- Large page title in Cormorant Garamond
- Thin divider
- Photos rendered from `labels.js` via JavaScript
- All photos pulled from shared `../photos/` directory
- Two layout options (set per page via admin):
  - **Single-column:** centered, max 720px wide, 5rem gap between photos
  - **Two-column:** CSS grid, 1fr 1fr, max 1400px, collapses to single column at ≤768px
- Title and optional description below each photo
- Click any photo to open lightbox
- Footer with copyright

### Library Page (`/library/`)
- Same layout as gallery pages (single-column)
- Shows all photos sorted by modification time
- Title: "Photo Library"

---

## Interactive Features

### Lightbox (all gallery and library pages)
- Click any photo to open full-screen view
- White overlay background (97% opacity)
- Subtle drop shadow on the enlarged photo (`0 4px 40px rgba(0,0,0,0.12)`)
- Arrow buttons (‹ ›) to navigate between photos
- Photo title shown below image in italic Cormorant Garamond
- Photo counter (e.g. "2 / 6") at bottom center
- Close with ✕ button (top right), Escape key, or clicking outside the photo
- Left/Right arrow keys for navigation

### Hover Effects
- Photos fade to 85% opacity on hover (0.3s ease transition)

### Photo Zoom
- Individual photos can have a zoom scale applied (saved in `labels.js` as `zoom` property)
- Applied via inline `transform: scale()` on the img-wrap

---

## Site Structure
```
art-gallery/
├── index.html              ← Home page (auto-updated by admin)
├── CLAUDE.md               ← Claude instructions
├── CONTENT.md              ← Source of truth for page names & photo labels
├── DESIGN.md               ← This document
├── CNAME                   ← Custom domain: shalaball.com
├── photos/                 ← Shared photo library (all photos live here)
├── library/
│   ├── index.html          ← "All" page
│   └── labels.js           ← Auto-generated, all photos sorted by mtime
├── page-1/                 ← "New Art"
│   ├── index.html
│   └── labels.js
├── page-2/                 ← "On Display in San Diego"
│   ├── index.html
│   └── labels.js
├── page-3/                 ← "On Display in the San Francisco Bay Area"
│   ├── index.html
│   └── labels.js
└── admin/                  ← Local admin UI (not deployed)
    ├── server.js
    ├── package.json
    └── public/
        ├── index.html
        └── style.css
```

---

## Content Management

### labels.js format
All gallery pages use the same object format:
```js
const LABELS = [
  { filename: "photo.jpeg", title: "Storm on the Sea", desc: "Acrylic on canvas, 24\"x36\"" },
  { filename: "photo2.jpeg", title: "Untitled", desc: "", zoom: 1.1 },
];
```

### CONTENT.md
Source of truth for all page names and photo metadata. The admin rewrites `labels.js` files from this on every Save.

---

## Admin UI (http://localhost:3000)
- **Save Changes** — writes CONTENT.md, rebuilds labels.js, updates nav
- **Sync Website** — git pull --rebase + push (deploys to GitHub Pages)
- **Preview** — auto-saves then opens preview tab
- **Layout dropdown** — toggle One Column / Two Column per page
- **Download button** — downloads original photo file
- **Rotate buttons** (↺ ↻) — rotate photo in-place via sharp
- **Zoom buttons** (− +) — scale thumbnail, saved to labels.js
- Drag-and-drop reordering via SortableJS
- HEIC upload: auto-converted to JPEG via heic-convert

---

## Hosting
- **Platform:** GitHub Pages (free)
- **Repository:** https://github.com/shalaball/art-gallery
- **Live URL:** https://shalaball.com
- **Deployment:** Automatic — any push to the `master` branch triggers a redeploy
- **Custom domain:** `shalaball.com` via CNAME file and GitHub Pages settings
