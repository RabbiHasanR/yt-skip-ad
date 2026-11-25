# Phase 7 — Auto-open rating popup: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. A user
who updates from 1.2.0 keeps their auto-skip and delay settings, their skip
counter, and their answer to the rating prompt.

## Behaviours

### Prompt

- B1 — With fewer than 50 ads skipped, the popup shows no rating prompt.
  [core] [popup]
- B2 — With 50 or more ads skipped, the popup shows the prompt with "Rate it
  ★" and "×", and says "50+ ads skipped" (150+, 250+, … as the count
  grows). [core] [popup]
- B3 — Clicking × hides the prompt for good: it never shows again, in this
  popup or a later one, however high the counter goes. [core] [popup]
- B4 — Clicking "Rate it ★" opens the store's reviews page in a new tab and
  hides the prompt for good, like ×. [core] [popup]
- B5 — Resetting the counter after the prompt was answered never brings it
  back. [core] [popup]
- B6 — In an open popup, the prompt appears when the count reaches 50, and
  its number follows the count, without reopening. [popup]
- B7 — Resetting the counter before answering hides the prompt until the
  counter is back at 50. [core] [popup]
- B8 — A missing or invalid stored prompt state reads as not answered; only
  a stored `true` ends the asks. [core]
- B9 — Updating from 1.2.0 keeps the prompt state: a user who had answered
  the prompt is never asked again. [core]

### Auto-open

- B10 — When the 50th ad is skipped, the popup opens by itself, showing the
  prompt, without the video being paused or the page changed. [core]
  [background]
- B11 — While the prompt stays unanswered (the popup was closed by clicking
  elsewhere), the popup opens by itself again every 100 ads (150, 250, …).
  [core] [background]
- B12 — Each milestone opens the popup at most once, even with several
  YouTube tabs skipping; skips between milestones and a counter reset never
  open it. [core] [background]
- B13 — The extension still asks only for storage and YouTube; its
  background worker loads with no errors. [manifest] [background]

### Guards

- B14 — In a fullscreen window, the popup doesn't open; a ★ badge appears on
  the toolbar icon instead. [background]
- B15 — If Chrome can't open the popup (for example, Chrome is not the
  focused window), a ★ badge appears instead. [background]
- B16 — Opening the popup clears the ★ badge; once the prompt was answered
  (× or "Rate it ★"), no badge and no auto-open ever appear. [background]
  [popup]

- B18 — A failure inside the background worker is logged with
  `[yt-skip-ad]`, and later milestones still open the popup. [background]

### Privacy

- B17 — Nothing is sent off the device: the worker makes no network
  requests, and the extension's pages are still blocked from connecting.
  [background] [popup]

## Automated checks

| Check      | Command                        | Pass criteria                                                                |
| ---------- | ------------------------------ | ---------------------------------------------------------------------------- |
| Fast tests | `npm test`                     | All pass, under 10 s                                                         |
| All tests  | `npm run test:all`             | Fast tests and every e2e test pass, `rate-ask.spec.js` and the network lock  |
| Lint       | `npm run lint`                 | No errors or warnings (the network ban covers `src/background/` too)         |
| Type check | `npm run typecheck`            | No errors                                                                    |
| Format     | `npm run format:check`         | No files need formatting                                                     |
| Coverage   | `npm run coverage`             | ~70% guide on `src/`, `popup/`; gaps explained                               |
| Dist zips  | `npm run package` and `:store` | Only extension files, the worker included; the store zip's manifest no `key` |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.
Phase 6 tests changed on purpose are named, with the reason.

## Manual checks

In real Chrome (127 or newer). Use the popup's DevTools console (right-click
the popup → Inspect) to set values; close DevTools before any check where
the popup must open or close by itself.

1. Load unpacked in `chrome://extensions`: no errors on the card or in the
   service worker ("Inspect views: service worker"); permissions still only
   storage and YouTube (B13).
2. Upgrade over 1.2.0 with `ratePromptDone: true` and 70 skips: after
   reloading the card, the popup shows no prompt; set the count to 149 and
   skip a real ad: no popup, no badge (B9, B16).
3. Fresh state at 49 skips, play a YouTube video with a skippable ad: when
   it is skipped, the popup opens by itself with the prompt; the video keeps
   playing (B10, B2).
4. Close that popup by clicking the page (not ×). Set the count to 149,
   skip a real ad: the popup opens by itself again (B11).
5. Click "Rate it ★": the reviews page opens. Set the count to 249 and skip
   a real ad: no popup, no badge; reopen the popup: no prompt (B4, B16).
6. Remove `ratePromptDone`, reopen, click ×: the prompt hides. Set the count
   past several milestones and skip a real ad: no popup, no badge; reset the
   counter and climb again: still nothing (B3, B5, B16).
7. Two YouTube tabs, both near a milestone: the popup opens once (B12).
8. Fullscreen video crossing a milestone: no popup; ★ badge on the icon.
   Leave fullscreen, open the popup: prompt shown, badge gone (B14, B16).
9. Chrome not focused (another app in front) while a background tab skips
   across a milestone: ★ badge; opening the popup clears it (B15, B16).
10. Popup: light and dark mode, about 280px wide, no horizontal scroll;
    keyboard reaches "Rate it ★", "×", and every footer
    link with visible focus (B2).
11. Phase 1–6 regression on real YouTube: pre-roll skipped with delay 0;
    delay and toggle apply live; counter goes up and resets.
12. DevTools Network tab for the popup and the service worker: no requests
    (B17).
13. Chrome's Task Manager: the extension's CPU use stays negligible, the
    worker idle between skips.

## Done means

All checks above pass; `specs/tech-stack.md`, `specs/mission.md`,
`specs/roadmap.md`, `README.md`, `USER-GUIDE.md`, `docs/store/listing.md`,
and `CHANGELOG.md` are updated; the version is `1.3.0`; no `node_modules/`,
`dist/`, `test-results/`, or secrets are committed.
