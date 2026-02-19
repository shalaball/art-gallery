# Art Gallery — Design Document

## Overview
A clean, professional art gallery website hosted on GitHub Pages at:
**https://shalaball.github.io/art-gallery/**

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
| Background | White `#ffffff` |
| Primary text | Dark charcoal `#222222` |
| Secondary text / captions | Medium gray `#888888` |
| Dividers | Light gray `#cccccc` |
| Navigation (inactive) | Medium gray `#888888` |
| Navigation (active/hover) | Dark charcoal `#222222` |
| Footer text | Light gray `#cccccc` |

---

## Layout & Structure

### Home Page (`/index.html`)
- Top navigation bar with links to all gallery sections
- Large elegant title: "Art Gallery"
- Subtitle: "A curated collection"
- Thin horizontal divider line
- Dark button-style links to each gallery section
- Footer with copyright

### Artwork Page (`/artwork/`)
- Top navigation (Home | Artwork | Artwork 2)
- Two-column masonry layout — photos flow naturally into columns respecting their orientation
- Italic captions in Cormorant Garamond below each photo
- Click any photo to open lightbox

### Artwork 2 Page (`/artwork2/`)
- Top navigation (Home | Artwork | Artwork 2)
- Single-column centered layout — one photo per row, max width 720px
- Photos display in their original order
- Title and optional description below each piece
- Ideal for mixed portrait/landscape orientations

---

## Interactive Features

### Lightbox (both gallery pages)
- Click any photo to open full-screen view
- White overlay background (97% opacity)
- Subtle drop shadow on the enlarged photo
- Arrow buttons to navigate between photos
- Photo counter (e.g. "2 / 6")
- Close with ✕ button, Escape key, or clicking outside the photo
- Left/Right arrow keys for navigation

### Hover Effects
- Photos gently fade to 88% opacity on hover (subtle, not distracting)

---

## Site Structure
```
art-gallery/
├── index.html              ← Home page
├── DESIGN.md               ← This document
├── artwork/
│   ├── index.html          ← Masonry grid gallery
│   ├── labels.js           ← Photo captions
│   └── photos/             ← Image files
└── artwork2/
    ├── index.html          ← Single-column gallery
    ├── labels.js           ← Photo titles & descriptions
    └── photos/             ← Image files
```

---

## Editing Labels

### Artwork page (`artwork/labels.js`)
Labels are simple strings:
```js
const LABELS = [
  "Storm on the Sea",   // Photo 1
  "Untitled 2",         // Photo 2
  ...
];
```

### Artwork 2 page (`artwork2/labels.js`)
Labels support both a title and an optional description:
```js
const LABELS = [
  { title: "Storm on the Sea", desc: "Oil on canvas, 2023" },
  { title: "Untitled 2",       desc: "" },
  ...
];
```

---

## Hosting
- **Platform:** GitHub Pages (free)
- **Repository:** https://github.com/shalaball/art-gallery
- **Live URL:** https://shalaball.github.io/art-gallery/
- **Deployment:** Automatic — any push to the `master` branch triggers a redeploy

---

## Future Ideas
- Add artist bio / About page
- Add a contact page
- Custom domain name (e.g. www.yourname.com) — ~$10-20/year
- Additional gallery sections for different series or media
