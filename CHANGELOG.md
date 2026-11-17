# Changelog

All notable changes to this project. Versions match `version` in
`manifest.json`.

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
