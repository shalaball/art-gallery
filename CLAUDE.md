# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Goal

A clean, minimal art gallery website for Shala, hosted on GitHub Pages at **[shalaball.com](https://shalaball.com)**.

## Tech Stack

Plain HTML and CSS only — no build tools, frameworks, or package managers.

## Content Management

**CONTENT.md is the source of truth** for all page names and photo labels.

When the user says "rebuild from CONTENT.md":

1. Read `CONTENT.md`
2. Parse the photo tables for each gallery page
3. Update `artwork/labels.js` — array of caption strings, in table order
4. Update `artwork2/labels.js` — array of `{ title, desc }` objects, in table order
5. If photo order changed, rename/reorder files in the `photos/` directories accordingly

## Site Structure

```text
art-gallery/
├── index.html          ← Home page
├── CLAUDE.md           ← This file
├── DESIGN.md           ← Design reference (typography, colors, layout)
├── CONTENT.md          ← Source of truth for page names & photo labels
├── CNAME               ← Custom domain: shalaball.com
├── artwork/
│   ├── index.html      ← Masonry two-column gallery with lightbox
│   ├── labels.js       ← Photo captions: array of strings
│   └── photos/         ← Image files
└── artwork2/
    ├── index.html      ← Single-column centered gallery with lightbox
    ├── labels.js       ← Photo labels: array of { title, desc } objects
    └── photos/         ← Image files
```

## Deployment

GitHub Pages auto-deploys on every push to the `master` branch.
Custom domain `shalaball.com` is configured via the CNAME file and GitHub Pages settings.
