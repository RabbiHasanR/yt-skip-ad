# Phase 6 — Store rating: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. A user
who updates from 1.1.0 keeps their auto-skip and delay settings and their
skip counter; with 50 or more ads skipped, they see the rating prompt the
next time they open the popup.

## Behaviours

### Rating prompt

- B1 — With fewer than 50 ads skipped, the popup shows no rating prompt.
  [core] [popup]
- B2 — With 50 or more ads skipped, the popup asks for a rating, says "50+
  ads skipped", and its "Rate it ★" link opens the store's reviews page in a
  new tab. [core] [popup]
- B3 — If the counter reaches 50 while the popup is open, the prompt appears
  without reopening it. [popup]
- B4 — Clicking "Rate it ★" or "×" hides the prompt at once, and it never
  appears again, in this popup or any later one, however high the counter
  goes. [core] [popup]
- B5 — Resetting the counter after the prompt was handled never brings it
  back. [core] [popup]
- B6 — A missing or invalid stored prompt state reads as not done; only a
  stored `true` hides it for good. [core]
- B7 — The prompt state is kept on this computer only; Chrome Sync never
  gets a copy. [core]

### Footer links

- B8 — The footer shows "🔒 No data collected" on one line and "Privacy ·
  Source ★ · Rate" below it; Rate opens the store's reviews page in a new
  tab. [popup]
- B9 — The Source link still opens the source code; its ★ is decorative and
  its tooltip invites a GitHub star. [popup]
- B10 — The prompt's controls and every footer link are reachable with Tab,
  with visible focus, and the popup stays about 280px wide with no
  horizontal scroll in light and dark mode. [popup]

### Privacy

- B11 — The extension makes no network requests; opening the reviews page is
  a normal tab the user chose to open. [popup]

## Automated checks

| Check      | Command                        | Pass criteria                                                        |
| ---------- | ------------------------------ | -------------------------------------------------------------------- |
| Fast tests | `npm test`                     | All pass, under 10 s                                                 |
| All tests  | `npm run test:all`             | Fast tests and every e2e test pass, `network-lock.spec.js` included  |
| Lint       | `npm run lint`                 | No errors or warnings (includes the network ban on `src/`, `popup/`) |
| Type check | `npm run typecheck`            | No errors                                                            |
| Format     | `npm run format:check`         | No files need formatting                                             |
| Coverage   | `npm run coverage`             | ~70% guide on `src/`, `popup/`; gaps explained                       |
| Dist zips  | `npm run package` and `:store` | Only extension files; the store zip's manifest has no `key`          |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.
Every test written after its code was shown failing with that code removed.

## Manual checks

In real Chrome, with DevTools open on the popup (right-click → Inspect).

1. Load unpacked in `chrome://extensions`: no errors; permissions are still
   only storage and YouTube.
2. In the popup's console, `await chrome.storage.local.set({ skipCount: 49 })`,
   reopen: no prompt (B1).
3. Set `skipCount` to 50 with the popup open: the prompt appears (B3, B2).
4. Click "Rate it ★": the reviews page opens in a new tab and the popup
   closes. Reopen the popup: no prompt; in its console,
   `await chrome.storage.local.get('ratePromptDone')` is `true` (B4, B7).
5. Remove `ratePromptDone`, reopen, click "×": the prompt hides; reopen: it
   stays gone. Reset the counter and set it to 60 again: still gone (B4,
   B5).
6. `await chrome.storage.local.set({ ratePromptDone: 'true' })` with 50+
   skips: the prompt shows (B6).
7. Footer: two lines; Privacy, Source and Rate each open the right page in a
   new tab; hovering Source shows the star tooltip (B8, B9).
8. Keyboard only: Tab reaches "Rate it ★", "×", and every footer link with
   visible focus; light and dark mode readable, about 280px wide, no
   horizontal scroll (B10).
9. Phase 1–5 regression on real YouTube: a pre-roll is skipped with delay 0;
   delay and toggle apply live; the counter goes up and resets.
10. DevTools Network tab, filtered to the extension, on YouTube and in the
    popup: no requests (B11).
11. Chrome's Task Manager: the extension's CPU use stays negligible.

## Done means

All checks above pass; `specs/tech-stack.md`, `specs/mission.md`,
`specs/roadmap.md`, `README.md`, and `CHANGELOG.md` are updated; the
version is `1.2.0`; no `node_modules/`, `dist/`, `test-results/`, or secrets
are committed.
