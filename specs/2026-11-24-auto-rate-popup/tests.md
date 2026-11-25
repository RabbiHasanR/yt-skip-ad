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

## 2. Repeat asks

Behaviours: B1–B9 · Branch: phase-7-auto-rate-popup

| #   | Behaviour | Level       | File                                        | Test name                                                                  | Status |
| --- | --------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| T1  | B3        | acceptance  | tests/integration/popup-rate-prompt.test.js | asks again 100 skips after the user closes the prompt                      | 🔴     |
| T2  | B1, B5    | unit        | tests/unit/rate-ask.test.js                 | with $count skipped, next ask $nextAskAt, never $neverAsk: due $expected   | ✅     |
| T3  | B8        | unit        | tests/unit/rate-ask.test.js                 | reads a stored next ask of $stored as $expected                            | ✅     |
| T4  | B8        | unit        | tests/unit/rate-ask.test.js                 | reads a stored "never ask" of $stored as $expected                         | ✅     |
| T5  | B2        | unit        | tests/unit/rate-ask.test.js                 | names $count skips as "$shown+"                                            | ✅     |
| T6  | B1        | unit        | tests/unit/storage.test.js                  | reads a fresh install as a first ask at 50, writing nothing                | ✅     |
| T7  | B3, B5    | unit        | tests/unit/storage.test.js                  | saves a postponed ask and "don't ask again" in local storage only          | ✅     |
| T8  | B9        | unit        | tests/unit/storage.test.js                  | moves a handled 1.2.0 prompt to ask again 100 skips later                  | ✅     |
| T9  | B9        | unit        | tests/unit/storage.test.js                  | removes a 1.2.0 prompt state that wasn't true, keeping the first ask at 50 | ✅     |
| T10 | B2        | integration | tests/integration/popup-rate-prompt.test.js | asks for a rating once due, naming the count and offering three choices    | ✅     |
| T11 | B4        | integration | tests/integration/popup-rate-prompt.test.js | opens the reviews page and asks again 100 skips later after Rate it ★      | ⬜     |
| T12 | B5        | integration | tests/integration/popup-rate-prompt.test.js | never asks again after "Don't ask again", even after a counter reset       | ⬜     |
| T13 | B6        | integration | tests/integration/popup-rate-prompt.test.js | appears while the popup is open, once the next ask is reached              | ⬜     |
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
