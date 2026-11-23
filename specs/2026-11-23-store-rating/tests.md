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

## 2. Rating prompt

Behaviours: B1–B7 · Branch: phase-6-store-rating

| #   | Behaviour | Level       | File                                        | Test name                                                      | Status |
| --- | --------- | ----------- | ------------------------------------------- | -------------------------------------------------------------- | ------ |
| T1  | B2        | acceptance  | tests/integration/popup-rate-prompt.test.js | asks for a rating at the threshold, naming it                  | 🔴     |
| T2  | B1, B4    | unit        | tests/unit/rate-prompt.test.js              | with $count ads skipped and done=$done, shows it: $expected    | ✅     |
| T3  | B6        | unit        | tests/unit/storage.test.js                  | reads a fresh install as not done                              | ⬜     |
| T4  | B6        | unit        | tests/unit/storage.test.js                  | reads an invalid stored state of %s as not done                | ⬜     |
| T5  | B7        | unit        | tests/unit/storage.test.js                  | remembers the prompt as done, in local storage only            | ⬜     |
| T6  | B1        | integration | tests/integration/popup-rate-prompt.test.js | stays hidden below the threshold                               | ⬜     |
| T7  | B3        | integration | tests/integration/popup-rate-prompt.test.js | appears while the popup is open, once the threshold is reached | ⬜     |
| T8  | B4        | integration | tests/integration/popup-rate-prompt.test.js | hides for good after the user clicks %s                        | ⬜     |
| T9  | B4        | integration | tests/integration/popup-rate-prompt.test.js | never comes back in a later popup once handled                 | ⬜     |
| T10 | B5        | integration | tests/integration/popup-rate-prompt.test.js | stays gone after the counter is reset and climbs again         | ⬜     |

Notes: the code was written before this spec (see `plan.md`). It was backed
up, reset to `HEAD`, and brought back one test at a time: each test below
was seen failing first.
