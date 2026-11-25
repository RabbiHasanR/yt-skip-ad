# Changelog

All notable changes to this project. Versions match `version` in
`manifest.json`.

## 1.3.0 — 2026-11-25

The rating request reaches people who never open the popup
([Phase 7 spec](specs/2026-11-24-auto-rate-popup/requirements.md)).

### Added

- At 50 ads skipped, the popup opens by itself to ask for a rating, then
  again every 100 more (150, 250, …) until it is answered. The video keeps
  playing. **Rate it ★** or **×** ends it for good, as in 1.2.0; anyone who
  answered in 1.2.0 is never asked.
- It never opens over a fullscreen video or in front of another app: a ★
  badge on the toolbar icon shows instead, and opening the popup clears it.
- A background service worker, the extension's first. It reads only the
  skip counter and the rating answer, makes no network requests (Chrome
  blocks them), and needs no new permission.

### Changed

- The request names the last milestone reached: "50+ ads skipped", then
  "150+", "250+", and so on.
- The privacy policy and README now list the stored rating answer.

## 1.2.0 — 2026-11-24

Ratings help others find the extension
([Phase 6 spec](specs/2026-11-23-store-rating/requirements.md)).

### Added

- After 50 ads skipped, the popup asks once for a rating on the Chrome Web
  Store. **Rate it ★** opens the reviews page and **×** closes it; either
  way it never asks again. Nothing is sent anywhere: it is only a link.
- A **Rate** link in the popup footer, always there.

### Changed

- The footer is on two lines: "🔒 No data collected", then "Privacy ·
  Source ★ · Rate". Source's ★ invites a GitHub star.

## 1.1.0 — 2026-11-19

Ready for the Chrome Web Store
([Phase 5 spec](specs/2026-11-19-web-store/requirements.md)).

### Added

- The popup says **🔒 No data collected**, with links to the privacy policy
  and the source code.
- Chrome now blocks the extension's pages from connecting to anything
  (Content Security Policy `connect-src 'none'`).
- `PRIVACY.md`: the privacy policy, a "check it yourself" guide, and a pledge
  that the extension will never be sold or add tracking.
- `npm run package:store` builds the zip to upload to the Chrome Web Store
  (the same files, without the manifest `key`).
- Store listing text, privacy-practices answers, and images in
  `docs/store/`.

### Changed

- **New name: Skip Ad for YouTube** (was YT Skip Ad).
- **Settings stay on this computer.** Auto-skip and the delay are kept in
  Chrome's local storage instead of sync storage, so Chrome Sync no longer
  copies them. Upgrading from 1.0.0 moves them once and keeps their values.
- The README is written for the public; the User Guide covers installing
  from the store.

## 1.0.0 — 2026-11-18

Ready for colleagues ([Phase 4 spec](specs/2026-11-18-mvp/requirements.md)).

### Added

- A fixed extension ID: the extension keeps its ID, settings, and skip
  counter wherever its folder lives. Moving the folder now needs only
  "Load unpacked" again.
- `npm run package` builds `dist/yt-skip-ad-<version>.zip` with only the
  extension files, ready to share over WhatsApp or the shared folder.
- README for colleagues: install from the zip or the shared folder, use,
  update, uninstall, troubleshooting, and a privacy note (no data
  collected, nothing sent off the computer, why each permission is needed).

### Changed

- **Upgrading from 0.x:** remove the old card in `chrome://extensions`,
  then "Load unpacked" again. Because the ID changes once, settings and the
  skip counter start again from the defaults this one time.

## 0.4.0 — 2026-11-18

Skip counter ([Phase 3 spec](specs/2026-11-18-skip-counter/requirements.md)).

### Added

- The popup shows **Ads skipped:** with the number of ads the extension has
  skipped, and updates it while open. Large numbers are grouped (12,345).
- **Reset counter** sets it back to 0 at once.
- Only real clicks count: nothing is counted when auto-skip is off, or when
  a delay is called off because auto-skip was turned off, the ad ended, the
  button disappeared, or you moved to another video.
- The counter is kept in Chrome's local storage on this computer, not
  synced. A missing or invalid stored count reads as 0. If saving it fails,
  skipping still works.

### Changed

- Settings changes are followed only in sync storage, so counting a skip
  never triggers a settings update.

## 0.3.0 — 2026-11-18

Settings ([Phase 2 spec](specs/2026-11-18-settings/requirements.md)).

### Added

- Popup controls: an **Auto-skip ads** checkbox and a **Delay (seconds)**
  field (0–10). Changes are saved at once, with no Save button, and apply
  to open YouTube tabs without a reload.
- Delay: the Skip button is clicked that many seconds after it appears. No
  click if, during the wait, auto-skip is turned off, the ad ends, the
  button disappears, or you move to another video.
- Turning auto-skip back on skips the ad already on screen.
- Settings are kept in Chrome's sync storage. Missing or invalid values fall
  back to the defaults (on, no delay); a typed delay outside 0–10 is saved
  as the nearest limit.

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
