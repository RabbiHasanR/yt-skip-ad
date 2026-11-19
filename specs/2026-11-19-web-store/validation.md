# Phase 5 — Web Store: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. A
colleague who replaces the 1.0.0 folder with this version keeps their
auto-skip and delay settings (moved from sync to local storage) and their
skip counter.

## Behaviours

### Local-only settings

- B1 — The settings are saved on this computer only; Chrome Sync never gets a
  copy. [core]
- B2 — Upgrading from 1.0.0 keeps the settings: values stored in sync are
  moved to local storage once, and removed from sync. [core]
- B3 — If a setting is already in local storage, the old sync value never
  overwrites it, and it is still removed from sync. [core]
- B4 — A fresh install writes nothing to storage just by reading the
  settings. [core]
- B5 — Settings changes still apply live to open YouTube tabs, and a counted
  skip is still not a settings change. [core] [content]

### Network lock

- B6 — The popup is blocked by Chrome from making any network connection and
  from loading anything not bundled with the extension. [manifest]
- B7 — The extension still asks only for storage and YouTube, and names its
  public source as its homepage. [manifest]

### Store zip

- B8 — `npm run package:store` builds `yt-skip-ad-<version>-store.zip` with
  the same files as the dist zip, and a `manifest.json` without `key`.
  [scripts]
- B9 — The colleague dist zip is unchanged: it keeps the `key`. [scripts]

### Privacy line

- B10 — The popup says "No data collected" and links to the privacy policy
  and the source code, opening in a new tab. [popup]
- B11 — The links are reachable with Tab, with visible focus, and the popup
  stays about 280px wide with no horizontal scroll in light and dark mode.
  [popup]

### Privacy

- B12 — The extension makes no network requests; nothing leaves the device.
  [content] [popup]

## Automated checks

| Check      | Command                        | Pass criteria                                                        |
| ---------- | ------------------------------ | -------------------------------------------------------------------- |
| Fast tests | `npm test`                     | All pass, under 10 s                                                 |
| All tests  | `npm run test:all`             | Fast tests and every e2e test pass                                   |
| Lint       | `npm run lint`                 | No errors or warnings (includes the network ban on `src/`, `popup/`) |
| Type check | `npm run typecheck`            | No errors                                                            |
| Format     | `npm run format:check`         | No files need formatting                                             |
| Coverage   | `npm run coverage`             | ~70% guide on `src/`, `popup/`, `scripts/`; gaps explained           |
| Dist zips  | `npm run package` and `:store` | Only extension files; the store zip's manifest has no `key`          |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.

## Manual checks

On real youtube.com, with DevTools open. Turn other ad-related extensions off
first.

1. Load unpacked in `chrome://extensions`: no errors; permissions are still
   only storage and YouTube.
2. Upgrade over 1.0.0 with a delay of 3 and auto-skip on: after reloading the
   card and opening the popup, the delay is still 3 (B2).
3. In the popup's DevTools console:
   `await chrome.storage.sync.get(null)` returns `{}`, and
   `await chrome.storage.local.get(null)` holds `enabled`, `delaySec` and
   `skipCount` (B1, B2).
4. In the popup's DevTools console: `await fetch('https://example.com')`
   fails with a Content Security Policy error (B6).
5. The popup shows "🔒 No data collected · Privacy · Source"; each link opens
   the right GitHub page in a new tab (B10).
6. Keyboard only: Tab reaches both links with visible focus; light and dark
   mode readable, about 280px wide, no horizontal scroll (B11).
7. Phase 1–4 regression: a pre-roll is skipped with delay 0; delay and
   toggle apply live; the counter goes up and resets.
8. DevTools Network tab, filtered to the extension, on YouTube and in the
   popup: no requests (B12).
9. Unzip the store zip: `manifest.json` has no `key`, and it loads with
   "Load unpacked" (with a different ID, as expected) (B8).

## Done means

All checks above pass; `specs/tech-stack.md`, `specs/mission.md`,
`README.md`, `specs/roadmap.md`, and `CHANGELOG.md` are updated; no
`node_modules/`, `dist/`, `test-results/`, or secrets are committed.
