# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

Build a simple HTML/CSS photo gallery website to display art photos, designed to be embedded in a Google Sites page.

## Tech Stack

Plain HTML and CSS — no build tools, frameworks, or package managers. Keep it simple and self-contained so it can be embedded in Google Sites.

## Google Sites Embedding Constraints

Google Sites embeds external content via `<iframe>` using "Embed" blocks. Code pasted directly into Google Sites must be valid HTML. Keep in mind:

- Avoid external dependencies that may be blocked by Google Sites' content security policy
- Inline CSS or use a single `<style>` block within the HTML file
- Avoid JavaScript if possible; if needed, keep it minimal and self-contained
- No server-side code — purely static HTML/CSS
