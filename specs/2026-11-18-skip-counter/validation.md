# Phase 3 — Skip Counter: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. A
colleague who replaces the 0.3.0 folder with this version keeps their
auto-skip and delay settings, and the skip counter starts at 0 (0.3.0 stored
none).

## Behaviours

### Count skips

- B1 — Each Skip button click made by the extension adds 1 to the skip
  counter, with or without a delay. [core] [content]
- B2 — A two-ad pod adds 2 to the counter. [core] [content]
- B3 — When auto-skip is off, or turned off during the delay, nothing is
  clicked and the counter doesn't change. [core]
- B4 — If the ad ends, the Skip button is hidden again, or in-page
  navigation replaces the player during the delay, the counter doesn't
  change. [core] [content]
- B5 — A stored count that is fractional is read as the whole number below
  it; one that is negative or not a number is read as 0, with no error.
  [core]
- B6 — Counting a skip doesn't change the settings, and if saving the count
  fails, auto-skip keeps working and no error reaches the page. [content]
- B7 — Pages without a player (home page, Shorts, search) show no errors and
  never change the counter. [content]
- B8 — The counter is kept on this computer only; Chrome Sync doesn't copy it
  to the colleague's other browsers. [core]

### Popup counter

- B9 — The popup shows "Ads skipped:" with the stored count when it opens,
  and 0 on a fresh install or right after upgrading. [popup]
- B10 — While the popup is open, the count goes up as soon as an ad is
  skipped, without reopening it. [popup]
- B11 — "Reset counter" sets the count to 0 at once, with no confirmation,
  and the popup shows 0 right away. [popup]
- B12 — "Reset counter" works with the keyboard alone (Tab, then Enter or
  Space), with visible focus. [popup]
- B13 — The popup stays about 280px wide with no horizontal scroll, readable
  in light and dark mode, even with a large count (e.g. 12,345). [popup]
- B14 — The count survives closing and reopening the popup and restarting
  Chrome. [popup]

### Privacy

- B15 — The extension makes no network requests; the count is kept only in
  Chrome's own storage on this computer. [content] [popup]

## Automated checks

| Check      | Command                | Pass criteria                                                                           |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------- |
| Fast tests | `npm test`             | All pass, under 10 s                                                                    |
| All tests  | `npm run test:all`     | Fast tests and the existing e2e tests (`auto-skip`, `settings`, `extension-loads`) pass |
| Lint       | `npm run lint`         | No errors or warnings (includes the network ban on `src/` and `popup/`)                 |
| Type check | `npm run typecheck`    | No errors                                                                               |
| Format     | `npm run format:check` | No files need formatting                                                                |
| Coverage   | `npm run coverage`     | ~70% guide on `src/` and `popup/`; gaps explained                                       |

`npm run package` doesn't exist yet (Phase 4), so there is no dist-zip
check.

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.

## Manual checks

On real youtube.com, with DevTools open on the content-script context. Turn
other ad-related extensions (ad blockers) off first.

1. Load unpacked in `chrome://extensions`: no errors; permissions are still
   only storage and YouTube.
2. Upgrade over 0.3.0 (replace the folder, reload the card): the auto-skip
   and delay settings are kept, and the popup shows "Ads skipped: 0" (B9).
3. With delay 0, a pre-roll is skipped, and the popup then shows 1 (B1).
4. Keep the popup open (or reopen it right after a skip) while a mid-roll is
   skipped on a long video: the count goes up by 1 (B1, B10).
5. A two-ad pod adds 2 (B2).
6. Delay 5; during the wait, untick "Auto-skip ads": no click, and the count
   doesn't change (B3).
7. An unskippable ad plays through: the count doesn't change.
8. Click "Reset counter": the count shows 0 at once; close and reopen the
   popup, it is still 0 (B11, B14).
9. After a few skips, restart Chrome and open the popup: the count is kept
   (B14).
10. Keyboard only: Tab to "Reset counter" and press Enter, then Space; focus
    is visible (B12).
11. Light and dark mode (Chrome or OS theme): the popup is readable, about
    280px wide, with no horizontal scroll (B13).
12. Home page, Shorts, and search: no `[yt-skip-ad]` errors, and the count
    doesn't change (B7).
13. Phase 1–2 regression: ads are still skipped after clicking through 5+
    videos without a reload, with delay 0 and delay 2; toggle and delay
    still apply live.
14. Logged in and logged out (Incognito, with Allow in Incognito on): both
    work.
15. DevTools Network tab, filtered to the extension, on YouTube and in the
    popup: no requests (B15).
16. Chrome Task Manager: the extension's CPU stays near 0% while a video
    plays, including right after a skip.

## Manual pass record

Version 0.4.0 on real youtube.com, 2026-11-18. All 16 checks pass, as
reported by Rabbi after running them; no per-check notes were recorded.

## Done means

All checks above pass; `specs/tech-stack.md`, `README.md`,
`specs/roadmap.md`, and `CHANGELOG.md` are updated; no `node_modules/`,
`dist/`, `test-results/`, or secrets are committed.
