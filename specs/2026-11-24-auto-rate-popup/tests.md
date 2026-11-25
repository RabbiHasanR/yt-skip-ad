# Phase 7 — Auto-open rating popup: Tests

## 1. Groundwork

Behaviours: none · Branch: phase-7-auto-rate-popup

No test rows.

### Real-Chrome trial (2026-11-25)

Chrome 158.0.8127.36 (Official Build, x86_64) on Linux (Fedora 44), with the
1.2.0 extension loaded unpacked. Run by Rabbi from the popup page opened as a
tab: a timer read `chrome.windows.getLastFocused()` 8 seconds after it
started and, where noted, called `chrome.action.openPopup()`.

| Step | Situation                                        | `state`      | `focused` | `openPopup()`                                                                |
| ---- | ------------------------------------------------ | ------------ | --------- | ---------------------------------------------------------------------------- |
| 1    | YouTube tab playing in the same window           | `maximized`  | `true`    | Opened: the popup appeared with the rating prompt and the video kept playing |
| 2    | Baseline, the extension's tab in front           | `maximized`  | `true`    | Not called                                                                   |
| 3    | YouTube video in fullscreen (F)                  | `fullscreen` | `true`    | Rejected: "Browser window has no toolbar."                                   |
| 4    | Another app in front (Chrome not the active app) | `maximized`  | `false`   | Rejected: "Could not find an active browser window."                         |

Results:

- YouTube's video fullscreen is reported as `state: 'fullscreen'`, so the
  planned check works and no fallback is needed.
- Chrome rejects `openPopup()` in fullscreen and when unfocused instead of
  opening it. The worker still checks `focused` and `state` first
  ([requirements.md → Guards](requirements.md#guards)), because other
  platforms may differ (for example, macOS can keep the toolbar in
  fullscreen).

### Docs, constants, and mock

Docs fetched with `ctx7`:

- `chrome.action.openPopup(options?)` returns a promise; Chrome 127+;
  `windowId` defaults to the active window. The docs don't say when it
  rejects; the trial does (fullscreen, unfocused).
- `chrome.action.setBadgeText({ text })` returns a promise; `''` clears it;
  about four characters fit.
- `chrome.windows.getLastFocused()` resolves to the window "on top", with
  `focused` and `state`.
- Service worker listeners must be added at the top level, synchronously,
  or Chrome may miss the event that woke the worker; `storage.onChanged`
  works in a worker.

Constants in `src/shared/constants.js`: `RATE_PROMPT_THRESHOLD` renamed to
`RATE_FIRST_ASK_AT` (50; a refactor, guarded by the Phase 6 tests);
`RATE_ASK_EVERY` (100), `RATE_NEXT_ASK_AT_KEY` (`rateNextAskAt`),
`RATE_NEVER_ASK_KEY` (`rateNeverAsk`), `RATE_BADGE_TEXT` (★).
`RATE_PROMPT_DONE_KEY` stays until group 2's one-time move reads and
removes it. Used by the tests in groups 2–4.

`chrome` mock (`tests/setup/chrome.js`): `action.openPopup` and
`action.setBadgeText` (resolve), `windows.getLastFocused` (resolves a
focused `'normal'` window, the "safe to open" case; group 4 tests override
it). `storage.local.remove` was already there.

## 2. Repeat asks (first run, superseded)

Superseded on 2026-11-25: Rabbi revised the rule so × and "Rate it ★"
end the asks for good. This run is kept as the record of what was built;
the rebuild to the revised rule follows in its own section.

Behaviours: B1–B9 · Branch: phase-7-auto-rate-popup

| #   | Behaviour | Level       | File                                        | Test name                                                                  | Status |
| --- | --------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| T1  | B3        | acceptance  | tests/integration/popup-rate-prompt.test.js | asks again 100 skips after the user closes the prompt                      | ✅     |
| T2  | B1, B5    | unit        | tests/unit/rate-ask.test.js                 | with $count skipped and answered=$done, due $expected                      | ✅     |
| T3  | B8        | unit        | tests/unit/rate-ask.test.js                 | reads a stored next ask of $stored as $expected                            | ✅     |
| T4  | B8        | unit        | tests/unit/rate-ask.test.js                 | reads a stored "never ask" of $stored as $expected                         | ✅     |
| T5  | B2        | unit        | tests/unit/rate-ask.test.js                 | names $count skips as "$shown+"                                            | ✅     |
| T6  | B1        | unit        | tests/unit/storage.test.js                  | reads a fresh install as a first ask at 50, writing nothing                | ✅     |
| T7  | B3, B5    | unit        | tests/unit/storage.test.js                  | saves a postponed ask and "don't ask again" in local storage only          | ✅     |
| T8  | B9        | unit        | tests/unit/storage.test.js                  | moves a handled 1.2.0 prompt to ask again 100 skips later                  | ✅     |
| T9  | B9        | unit        | tests/unit/storage.test.js                  | removes a 1.2.0 prompt state that wasn't true, keeping the first ask at 50 | ✅     |
| T10 | B2        | integration | tests/integration/popup-rate-prompt.test.js | asks for a rating once due, naming the count and offering three choices    | ✅     |
| T11 | B4        | integration | tests/integration/popup-rate-prompt.test.js | opens the reviews page and asks again 100 skips later after Rate it ★      | ✅     |
| T12 | B5        | integration | tests/integration/popup-rate-prompt.test.js | never asks again after "Don't ask again", even after a counter reset       | ✅     |
| T13 | B6        | integration | tests/integration/popup-rate-prompt.test.js | appears while the popup is open, once the next ask is reached              | ✅     |
| T14 | B7        | integration | tests/integration/popup-rate-prompt.test.js | doesn't come back early after the counter is reset                         | ✅     |

Phase 6 tests changed on purpose (× and Rate were final; now they postpone):

- `tests/unit/rate-prompt.test.js` is replaced by T2 (`src/core/rate-prompt.js`
  becomes `rate-ask.js`).
- storage "rating prompt storage" (3 tests) is replaced by T6–T9
  (`isRatePromptDone` / `markRatePromptDone` become `getRateAsk`,
  `postponeRateAsk`, `stopRateAsk`).
- popup "asks for a rating at the threshold, naming it" becomes T10.
- popup "hides for good after the user clicks %s" becomes T1 (×) and T11
  (Rate it ★).
- popup "never comes back in a later popup once handled" is replaced by T1,
  which reopens the popup before and at the next ask.
- popup "appears while the popup is open…" becomes T13; "stays gone after the
  counter is reset…" becomes T14.
- popup "stays hidden below the threshold" is unchanged (B1).

Gate 2 decisions: the prompt names the last milestone at or below the count
(50, 150, 250, …; Rabbi's choice, requirements.md updated). The ask state is
cleaned up by `normalizeRateAsk` in `src/core/rate-ask.js`; the one-time move
runs inside `getRateAsk()`. It sets the next ask even if one is stored: both
can only exist together after a downgrade to 1.2.0 and back, and asking 100
skips later is then still right.

Notes: T14 was built before T10. Switching the popup to `getRateAsk()` runs
the one-time move, which removes `ratePromptDone`, so the Phase 6 reset test
it replaces broke at that step. T3 and T4 became tables of stored and
expected values: "always 50" would otherwise pass T3. T1 turned green with
T11, since × and Rate share one handler. T13 passed when written, because
T10's green already refreshed the prompt on live count changes; a popup
whose live updates only refresh the counter was shown to fail it. The
replaced Phase 6 code (`src/core/rate-prompt.js`, `isRatePromptDone`,
`markRatePromptDone`) and tests were removed once nothing used them.

## 2. Prompt (rebuild)

Behaviours: B1–B9 · Branch: phase-7-auto-rate-popup

| #   | Behaviour | Level       | File                                        | Test name                                                             | Status |
| --- | --------- | ----------- | ------------------------------------------- | --------------------------------------------------------------------- | ------ |
| T15 | B3        | acceptance  | tests/integration/popup-rate-prompt.test.js | never asks again after the user closes the prompt                     | ✅     |
| T16 | B8        | unit        | tests/unit/storage.test.js                  | reads a stored prompt state of $stored as answered: $expected         | ✅     |
| T17 | B3, B4    | unit        | tests/unit/storage.test.js                  | remembers the answer, in local storage only                           | ✅     |
| T18 | B4        | integration | tests/integration/popup-rate-prompt.test.js | opens the reviews page and never asks again after Rate it ★           | ✅     |
| T19 | B2        | integration | tests/integration/popup-rate-prompt.test.js | asks for a rating once due, naming the count, with Rate it ★ and ×    | ✅     |
| T20 | B9        | integration | tests/integration/popup-rate-prompt.test.js | keeps a 1.2.0 answer: never asks again                                | ✅     |
| T21 | B5        | integration | tests/integration/popup-rate-prompt.test.js | stays gone after the counter is reset, once answered                  | ✅     |
| T22 | B6        | integration | tests/integration/popup-rate-prompt.test.js | appears while the popup is open at 50, its number following the count | ✅     |
| T23 | B7        | integration | tests/integration/popup-rate-prompt.test.js | hides after a reset before answering, until the counter is back at 50 | ✅     |

Kept from the first run: T5 (`promptCount`, B2) and Phase 6's "stays hidden
below the threshold" (B1). T2 (`isAskDue`, B1) is kept, its signature going
back to `(skipCount, done)` in T18's refactor.

Removed, with what replaces them:

- At T18's green, when the popup switches to `ratePromptDone`: first-run T1
  (→ T15), T11 (→ T18), T12 "Don't ask again" (behaviour dropped), T13
  (→ T22), T14 (→ T23).
- At T19: T10 (→ T19), and the "Don't ask again" button.
- Final refactor, once nothing uses them: T3, T4, T6–T9, with
  `normalizeRateAsk`, `nextAskAfter`, `getRateAsk`, `postponeRateAsk`,
  `stopRateAsk`, the one-time move, `RATE_NEXT_ASK_AT_KEY`, and
  `RATE_NEVER_ASK_KEY`.

Notes: T18 was the switching step. Its green moved the popup to
`ratePromptDone` and made × final too, so T15 turned green with it; the
first-run tests T1, T11, T12, T13, and T14 failed at that step, as listed,
and were removed. T18's refactor took `isAskDue` back to `(skipCount, done)`
and T2's table with it. T20–T23 passed when written, since the Phase 6 rule
was back after T18; each was shown failing against a mutation: the popup
ignoring the stored answer (T20), a reset that also clears it (T21), live
updates that skip the prompt (T22), and a prompt that never hides once shown
(T23). The final refactor removed the first run's state, its move, its two
keys, and T3, T4, T6–T9.

## 3. Auto-open

Behaviours: B10–B13 · Branch: phase-7-auto-rate-popup

| #   | Behaviour | Level       | File                                          | Test name                                                                | Status |
| --- | --------- | ----------- | --------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| T24 | B10       | acceptance  | tests/integration/background-rate-ask.test.js | opens the popup when the 50th ad is skipped                              | ✅     |
| T25 | B11, B12  | unit        | tests/unit/rate-ask.test.js                   | from $from to $to skips, crosses a milestone: $expected                  | ✅     |
| T26 | B11       | integration | tests/integration/background-rate-ask.test.js | opens the popup again at 150 and 250 while the prompt is unanswered      | ✅     |
| T27 | B11       | integration | tests/integration/background-rate-ask.test.js | never opens the popup once the prompt is answered                        | ✅     |
| T28 | B12       | integration | tests/integration/background-rate-ask.test.js | doesn't open the popup for $change                                       | ✅     |
| T29 | B12       | integration | tests/integration/background-rate-ask.test.js | opens the popup once when two tabs store the same milestone              | ➖     |
| T30 | B13       | integration | tests/integration/manifest.test.js            | runs the rating worker as a module service worker                        | ✅     |
| T31 | B13       | integration | tests/integration/package.test.js             | builds dist/yt-skip-ad-<version>.zip containing only the extension files | ✅     |

T25 cases: 49→50 and 149→150 cross; 0→1, 48→49, 50→51, and 100→149 don't;
0→200 crosses (two milestones at once, one open); 150→149 and 200→0
(resets) don't. T28 cases: a skip between milestones (50→51), a counter
reset (120→0), and a settings save. T31 extends the existing test: the
worker is in the zip, so in the store zip too (same files). T30 also adds
the worker to "every file the manifest references exists". "Loads with no
errors" (B13) is checked by group 4's e2e test and manual check 1.

Notes: the worker started as an empty module (`export {};`) so T24's red
was a missing behaviour, not a broken import. T24 turned green with T26,
whose green added `watchSkipCountChange` in `src/shared/storage.js`
(`watchSkipCount` now builds on it) and the worker's top-level listener.
`crossedMilestone` reuses `promptCount`, so the milestone step lives in one
place. T28 passed when written: a worker opening on every count change was
shown to fail its first two cases, and a storage watcher treating any local
change as a count change its third. T29 is ➖: a second tab's stale write of
the same count fires no `storage.onChanged` at all (Chrome's rule, which the
mock copies), so the test could only check the mock; the other order
(50 → 51) is a T25 case, and manual check 7 covers two real tabs. T31
passed when written, since the packager zips all of `src/`; a packager
leaving `src/background/` out was shown to fail it.

## 4. Guards

Behaviours: B14–B18 · Branch: phase-7-auto-rate-popup

| #   | Behaviour | Level       | File                                          | Test name                                                                     | Status |
| --- | --------- | ----------- | --------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| T32 | B14       | acceptance  | tests/integration/background-rate-ask.test.js | shows a badge instead of opening the popup in a fullscreen window             | 🔴     |
| T33 | B14, B15  | unit        | tests/unit/rate-ask.test.js                   | in a $state window, focused $focused, can open the popup: $expected           | ⬜     |
| T34 | B15       | integration | tests/integration/background-rate-ask.test.js | shows a badge when Chrome isn't the focused app                               | ⬜     |
| T35 | B15       | integration | tests/integration/background-rate-ask.test.js | shows a badge when Chrome refuses to open the popup                           | ⬜     |
| T36 | B16       | integration | tests/integration/background-rate-ask.test.js | never shows the badge once the prompt is answered                             | ⬜     |
| T37 | B18       | integration | tests/integration/background-rate-ask.test.js | logs a failed check with [yt-skip-ad] and still opens at the next milestone   | ⬜     |
| T38 | B16       | integration | tests/integration/popup-rate-prompt.test.js   | clears the ★ badge when the popup opens                                       | ⬜     |
| T39 | B13, B14  | e2e         | tests/e2e/rate-ask.spec.js                    | the real worker shows a ★ badge when a skip crosses 50 in a fullscreen window | ⬜     |
| T40 | B17       | e2e         | tests/e2e/network-lock.spec.js                | Chrome blocks a network request from the extension's service worker           | ⬜     |

T33 cases: normal and maximized focused → yes; fullscreen, minimized, and
normal unfocused → no. B17's lint half (the network ban covers
`src/background/`) is already in `eslint.config.js`; T40 is its runtime
half. B18 was added to `validation.md` at this Gate 2: `requirements.md`
asked for logged worker errors, but no behaviour covered it.
