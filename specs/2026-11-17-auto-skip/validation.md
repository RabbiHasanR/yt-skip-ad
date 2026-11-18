# Phase 1 — Auto-skip: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. Nothing is
stored yet, so replacing a colleague's folder with this version loses no
settings or counter.

## Behaviours

### Detect and click

- B1 — While an ad is showing, a visible Skip button inside the player is
  clicked, whichever of the known Skip-button classes it uses. [core]
  [content]
- B2 — A Skip button is never clicked when no ad is showing. [core]
- B3 — A hidden Skip button (the countdown) is not clicked; it is clicked once
  it becomes visible. [core]
- B4 — Each appearance of the Skip button gets exactly one click; a two-ad pod
  gets two clicks. [core]
- B5 — If the ad ends before the check runs, nothing is clicked. [core]
- B6 — An unskippable ad plays normally, with no click and no errors. [core]
  [content]

### Follow the player

- B7 — An ad that starts after the page has loaded is skipped. [content]
- B8 — A player that appears after the content script loads is found and
  followed. [content]
- B9 — After in-page navigation replaces the player, ads are still skipped,
  across 5+ videos without a reload. [content]
- B10 — A burst of player changes runs one check, and a visible Skip button
  is clicked within about 0.5 s. [core] [content]
- B11 — Pages without a player (home page, Shorts, search) show no errors
  from the extension. [content]
- B12 — Ads in a background tab are still skipped. [content]

### Trusted click

- B14 — YouTube accepts the extension's Skip click: its Skip handler, which
  checks `event.isTrusted`, sees the click as trusted. [content]
- B15 — Only click listeners on Skip buttons are affected: every other
  listener on the page sees events unchanged, and removing a listener still
  works. [content]

### Privacy

- B13 — Nothing is sent off the device; the extension makes no network
  requests. [content]

## Automated checks

| Check      | Command                | Pass criteria                                    |
| ---------- | ---------------------- | ------------------------------------------------ |
| Fast tests | `npm test`             | All pass, under 10 s                             |
| End to end | `npm run test:e2e`     | `tests/e2e/auto-skip.spec.js` passes in Chromium |
| All tests  | `npm run test:all`     | Fast tests and e2e all pass                      |
| Lint       | `npm run lint`         | No errors or warnings (includes the network ban) |
| Type check | `npm run typecheck`    | No errors                                        |
| Format     | `npm run format:check` | No files need formatting                         |
| Coverage   | `npm run coverage`     | ~70% guide on `src/`; gaps explained             |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.

## Manual checks

On real youtube.com, with DevTools open on the content-script context:

1. Load unpacked in `chrome://extensions`: no errors; permissions are still
   only storage and YouTube.
2. Pre-roll skippable ad: skipped about as soon as the Skip button appears
   (B1, B3, B10), and the ad really ends, not just a click on the button
   (B14). Turn other ad-related extensions (ad blockers) off first.
3. Mid-roll skippable ad on a long video: skipped (B7).
4. Two-ad pod: both ads skipped (B4).
5. Unskippable ad: plays normally, no `[yt-skip-ad]` errors (B6).
6. Click through 5+ videos without a reload: ads are still skipped (B9).
7. Home page, Shorts, and search: no `[yt-skip-ad]` errors (B11).
8. Start a video, switch to another tab, and come back after the ad: it was
   skipped (B12).
9. Logged in and logged out: both work.
10. During the countdown, inspect the Skip button: note how YouTube hides it
    (`display`, `visibility`, or `opacity`). If `opacity`, record it as a bug
    and add a failing test first.
11. DevTools Network tab, filtered to the extension: no requests (B13).
12. Chrome Task Manager: the extension's CPU stays near 0% while a video
    plays.

## Manual pass record

Version 0.2.1 on real youtube.com, 2026-11-18. (On 0.2.0 the click was made
but YouTube ignored it; see [plan.md group 5](plan.md).) All 12 checks
pass.

| Check | Result  | Notes                                                                                                                                                                                                           |
| ----- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | ✅ pass | No errors on the extension card. Permissions are also pinned by `tests/integration/manifest.test.js`.                                                                                                           |
| 2     | ✅ pass | Pre-roll skipped when the Skip button appeared, and the ad ended.                                                                                                                                               |
| 3     | ✅ pass | Mid-roll ad on a long video skipped when its Skip button appeared.                                                                                                                                              |
| 4     | ✅ pass | Two-ad pod: both ads skipped.                                                                                                                                                                                   |
| 5     | ✅ pass | Ad without a Skip button played normally, no errors.                                                                                                                                                            |
| 6     | ✅ pass | More than 5 videos without a reload; each pre-roll was skipped.                                                                                                                                                 |
| 7     | ✅ pass | No `[yt-skip-ad]` errors. The console's other lines (Polymer `LegacyDataMixin`, sandboxed `about:blank`, `googlevideo.com` 403s, `No available adapters`, `generate_204` preload) come from YouTube's own code. |
| 8     | ✅ pass | Ad skipped while the video's tab was in the background.                                                                                                                                                         |
| 9     | ✅ pass | Logged in (main profile) and logged out (Incognito, with Allow in Incognito on).                                                                                                                                |
| 10    | ✅ pass | From the console probes: the button sits in `.ytp-ad-player-overlay-layout__skip-or-preview-container`, is not opacity-hidden, and was `opacity: 0.5` only while the ad was paused.                             |
| 11    | ✅ pass | No requests from the extension.                                                                                                                                                                                 |
| 12    | ✅ pass | 0–0.5% CPU while a video plays.                                                                                                                                                                                 |

## Done means

All checks above pass; `specs/tech-stack.md`, `README.md`,
`specs/roadmap.md`, and `CHANGELOG.md` are updated; no `node_modules/`,
`dist/`, `test-results/`, or secrets are committed.
