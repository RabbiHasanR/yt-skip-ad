# Phase 7 — Auto-open rating popup: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. A user
who updates from 1.2.0 keeps their auto-skip and delay settings and their
skip counter; if they had closed the rating prompt, it comes back 100 ads
later.

## Behaviours

### Repeat asks

- B1 — With fewer than 50 ads skipped on a fresh install, the popup shows no
  rating prompt. [core] [popup]
- B2 — With 50 or more ads skipped, the popup shows the prompt with "Rate it
  ★", "×", and "Don't ask again", and says "50+ ads skipped" (150+, 250+, …
  as the count grows). [core] [popup]
- B3 — Clicking × hides the prompt; it comes back once 100 more ads are
  skipped. [core] [popup]
- B4 — Clicking "Rate it ★" opens the store's reviews page in a new tab and
  hides the prompt; it comes back once 100 more ads are skipped. [core]
  [popup]
- B5 — Clicking "Don't ask again" hides the prompt for good: it never shows
  again, however high the counter goes, even after a counter reset. [core]
  [popup]
- B6 — In an open popup, the prompt appears when the count reaches the next
  ask, without reopening. [popup]
- B7 — Resetting the counter never brings the prompt back early: the next
  ask waits until the counter climbs back to it. [core] [popup]
- B8 — Invalid stored values fall back: a bad next-ask count reads as 50,
  and only a stored `true` means "never ask". [core]
- B9 — Updating from 1.2.0: a user who had closed or rated the prompt is
  asked again 100 ads after the update, and the old Phase 6 state is gone
  from storage. [core]

### Auto-open

- B10 — When the 50th ad is skipped, the popup opens by itself, showing the
  prompt, without the video being paused or the page changed. [core]
  [background]
- B11 — While the prompt stays unhandled, the popup opens by itself again
  every 100 ads (150, 250, …); after × or Rate, at the new next ask. [core]
  [background]
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
- B16 — Opening the popup clears the ★ badge; after "Don't ask again", no
  badge and no auto-open ever appear. [background] [popup]

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
   reloading the card, `chrome.storage.local.get(null)` has no
   `ratePromptDone` and `rateNextAskAt` 170 (B9).
3. Fresh state at 49 skips, play a YouTube video with a skippable ad: when
   it is skipped, the popup opens by itself with the prompt; the video keeps
   playing (B10, B2).
4. Click ×: the popup stays open, the prompt hides. Set the count to 149,
   skip a real ad: the popup opens by itself again (B3, B11).
5. Click "Rate it ★": the reviews page opens. Reopen the popup: no prompt
   until 100 more skips (B4).
6. Click "Don't ask again". Set the count past several milestones and skip
   a real ad: no popup, no badge; reset the counter and climb again: still
   nothing (B5, B16).
7. Two YouTube tabs, both near a milestone: the popup opens once (B12).
8. Fullscreen video crossing a milestone: no popup; ★ badge on the icon.
   Leave fullscreen, open the popup: prompt shown, badge gone (B14, B16).
9. Chrome not focused (another app in front) while a background tab skips
   across a milestone: ★ badge; opening the popup clears it (B15, B16).
10. Popup: light and dark mode, about 280px wide, no horizontal scroll;
    keyboard reaches "Rate it ★", "×", "Don't ask again", and every footer
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
