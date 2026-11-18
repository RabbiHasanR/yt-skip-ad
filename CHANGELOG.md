# Changelog

All notable changes to this project. Versions match `version` in
`manifest.json`.

## 0.2.1 — 2026-11-18

### Fixed

- Skipping now works on real YouTube. YouTube ignores clicks made by
  scripts (`event.isTrusted` is `false`), so the Skip click was made but
  had no effect. A new script running in YouTube's own page world makes
  YouTube's Skip handler see the click as trusted. It touches only click
  listeners on Skip buttons, and needs no new permission.

## 0.2.0 — 2026-11-17

Auto-skip ([Phase 1 spec](specs/2026-11-17-auto-skip/requirements.md)).

### Added

- Clicks the Skip button as soon as it becomes visible during an ad, within
  about 0.1 s. Hidden buttons (the countdown) are never clicked.
- One click per Skip button appearance: both ads in a two-ad pod are
  skipped, and no ad is clicked twice.
- Keeps working across YouTube's in-page navigation, and on players that
  appear after the page loads.
- No errors on pages without a player (home page, Shorts, search).
- End-to-end test in real Chromium with the extension loaded, fully offline.

## 0.1.0 — 2026-11-17

Project skeleton ([Phase 0 spec](specs/2026-11-17-project-skeleton/requirements.md)).

### Added

- MV3 manifest that asks only for `storage` and YouTube host access.
- Placeholder icons (16/48/128 px).
- Content script that loads on YouTube through a small loader and logs
  `[yt-skip-ad] content script loaded` once per page load.
- Placeholder popup with light and dark themes.
- Dev tooling: Vitest + jsdom, ESLint, Prettier, `tsc` type checks, and a
  `chrome` API mock.
- A lint rule that blocks network APIs in extension code.
