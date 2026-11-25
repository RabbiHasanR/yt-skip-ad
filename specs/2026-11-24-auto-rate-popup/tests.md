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
