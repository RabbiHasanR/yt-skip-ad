# Phase 6 — Store rating: Tests

## 1. Groundwork

Behaviours: none · Branch: phase-6-store-rating

No test rows. Docs fetched with `ctx7`:

- `chrome.storage.local.get(object)`: the object gives default values;
  resolves with them for missing keys. `set()` returns a promise.
- Popups close as soon as focus leaves them, and nothing can keep them open.
  The docs don't say whether a `storage.set` started in a click handler
  finishes after the popup closes; manual check 4 covers it.

Constants added in `src/shared/constants.js`: `STORE_REVIEWS_URL`,
`RATE_PROMPT_THRESHOLD` (50), `RATE_PROMPT_DONE_KEY` (`ratePromptDone`).
Written before the spec; they are exercised by the tests in groups 2–3.
