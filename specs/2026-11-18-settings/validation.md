# Phase 2 — Settings: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. Earlier
versions stored nothing, so a colleague who replaces the folder with this
version gets auto-skip on with no delay, as before; there is no skip counter
yet to keep.

## Behaviours

### Settings storage

- B1 — On a fresh install, auto-skip is on with no delay. [core] [content]
- B2 — Turning auto-skip off stops the Skip click on open YouTube tabs,
  without reloading them. [content]
- B3 — Turning auto-skip back on while a Skip button is visible skips that
  ad. [content]
- B4 — A stored delay outside 0–10 is used as the nearest limit, and a
  fractional one as the nearest whole number. [core]
- B5 — A stored setting of the wrong type (a delay that isn't a number, an
  on/off value that isn't true or false) is used as its default, with no
  error. [core]
- B6 — A setting removed from storage goes back to its default. [core]
- B7 — No ad is clicked before the stored settings have been read, so a
  colleague with auto-skip off never gets a click on an ad already showing
  at page load. [content]
- B8 — Pages without a player (home page, Shorts, search) show no errors
  from the extension, with auto-skip on or off. [content]

### Delay

- B9 — With a delay of N seconds, the Skip button is clicked about N seconds
  after it appears; with 0, as soon as it appears. [core] [content]
- B10 — Turning auto-skip off during the delay means no click. [core]
  [content]
- B11 — If the ad ends or the Skip button is hidden again during the delay,
  nothing is clicked. [core]
- B12 — A changed delay applies from the next Skip button; a wait already
  running keeps its length. [core]
- B13 — With a delay, each appearance of the Skip button still gets exactly
  one click; a two-ad pod gets two. [core]
- B14 — If in-page navigation replaces the player during the delay, the old
  wait is called off and the new player is followed as usual. [content]

### Popup controls

- B15 — The popup shows the stored on/off setting and delay when it opens,
  and the defaults on a fresh install. [popup]
- B16 — Ticking or unticking "Auto-skip ads" saves at once, with no Save
  button. [popup]
- B17 — A new delay is saved when the colleague uses the spinner, presses
  Enter, or leaves the field. [popup]
- B18 — A delay typed outside 0–10, or with a fraction, is saved and shown
  as the nearest valid whole number; an empty field saves nothing and shows
  the stored delay again. [core] [popup]
- B19 — Every control has a visible label and works with the keyboard alone
  (Tab, Space, Enter, arrow keys). [popup]
- B20 — The popup is about 280px wide with no horizontal scroll, and is
  readable in light and dark mode. [popup]
- B21 — Settings survive closing and reopening the popup and restarting
  Chrome. [popup]

### Privacy

- B22 — The extension makes no network requests; the settings are kept only
  in Chrome's own storage. [content] [popup]

## Automated checks

| Check      | Command                | Pass criteria                                                       |
| ---------- | ---------------------- | ------------------------------------------------------------------- |
| Fast tests | `npm test`             | All pass, under 10 s                                                |
| End to end | `npm run test:e2e`     | `tests/e2e/auto-skip.spec.js` and `settings.spec.js` pass           |
| All tests  | `npm run test:all`     | Fast tests and e2e all pass                                         |
| Lint       | `npm run lint`         | No errors or warnings (includes the network ban, now on `popup.js`) |
| Type check | `npm run typecheck`    | No errors                                                           |
| Format     | `npm run format:check` | No files need formatting                                            |
| Coverage   | `npm run coverage`     | ~70% guide on `src/` and `popup/`; gaps explained                   |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.

## Manual checks

On real youtube.com, with DevTools open on the content-script context. Turn
other ad-related extensions (ad blockers) off first.

1. Load unpacked in `chrome://extensions`: no errors; permissions are still
   only storage and YouTube.
2. Fresh install (remove the extension, then load it again): the popup shows
   auto-skip on and delay 0, and a pre-roll is skipped as soon as the Skip
   button appears (B1, B9, B15).
3. With a video open, untick "Auto-skip ads": the next ad is not skipped, and
   the page was not reloaded (B2, B16).
4. Tick it again while an ad's Skip button is visible: that ad is skipped
   (B3).
5. Set the delay to 3 with the spinner: the click comes about 3 s after the
   Skip button appears (B9, B17).
6. Set the delay to 5; during the wait, untick "Auto-skip ads": no click
   (B10).
7. Type 25 and press Enter: the field shows 10. Type -2 and press Tab: it
   shows 0. Clear the field and press Tab: it shows the stored delay (B18).
8. Close and reopen the popup, then restart Chrome and open it again: the
   settings are kept (B21).
9. Keyboard only: Tab to the checkbox and toggle it with Space; Tab to the
   delay and change it with the arrow keys and Enter; focus is visible on
   each (B19).
10. Light and dark mode (Chrome or OS theme): the popup is readable, about
    280px wide, with no horizontal scroll (B20).
11. Home page, Shorts, and search, with auto-skip on and then off: no
    `[yt-skip-ad]` errors (B8).
12. Phase 1 regression: a two-ad pod is fully skipped with delay 0 and with
    delay 2 (B13); ads are still skipped after clicking through 5+ videos
    without a reload (B14); a mid-roll on a long video is skipped.
13. Logged in and logged out (Incognito, with Allow in Incognito on): both
    work.
14. DevTools Network tab, filtered to the extension, on YouTube and in the
    popup: no requests (B22).
15. Chrome Task Manager: the extension's CPU stays near 0% while a video
    plays, including during a delay.

## Manual pass record

Version 0.3.0 on real youtube.com, 2026-11-18. All 15 checks pass, as
reported by Rabbi after running them; no per-check notes were recorded.

## Done means

All checks above pass; `specs/tech-stack.md`, `README.md`,
`specs/roadmap.md`, and `CHANGELOG.md` are updated; no `node_modules/`,
`dist/`, `test-results/`, or secrets are committed.
