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
| T1  | B2        | acceptance  | tests/integration/popup-rate-prompt.test.js | asks for a rating at the threshold, naming it                  | ✅     |
| T2  | B1, B4    | unit        | tests/unit/rate-prompt.test.js              | with $count ads skipped and done=$done, shows it: $expected    | ✅     |
| T3  | B6        | unit        | tests/unit/storage.test.js                  | reads a fresh install as not done                              | ✅     |
| T4  | B6        | unit        | tests/unit/storage.test.js                  | reads an invalid stored state of %s as not done                | ✅     |
| T5  | B7        | unit        | tests/unit/storage.test.js                  | remembers the prompt as done, in local storage only            | ✅     |
| T6  | B1        | integration | tests/integration/popup-rate-prompt.test.js | stays hidden below the threshold                               | ✅     |
| T7  | B3        | integration | tests/integration/popup-rate-prompt.test.js | appears while the popup is open, once the threshold is reached | ✅     |
| T8  | B4        | integration | tests/integration/popup-rate-prompt.test.js | hides for good after the user clicks %s                        | ✅     |
| T9  | B4        | integration | tests/integration/popup-rate-prompt.test.js | never comes back in a later popup once handled                 | ✅     |
| T10 | B5        | integration | tests/integration/popup-rate-prompt.test.js | stays gone after the counter is reset and climbs again         | ✅     |

Notes: the code was written before this spec (see `plan.md`). It was backed
up, reset to `HEAD`, and brought back one test at a time: each test below
was seen failing first. T4 passed when added (the T3 stub always read
`false`); once T5 brought the real read, a naive `Boolean(stored)` read was
shown to fail T4 for `1` and `"true"`. T9 passed when added: T7's green
already read the stored state on load, one step early. Ignoring that read
was shown to fail T9. T10 is a guard: no code clears the state, so it passed
when added; a reset that also cleared `ratePromptDone` was shown to fail
it.

## 3. Footer links

Behaviours: B8–B10 · Branch: phase-6-store-rating

| #   | Behaviour | Level       | File                                    | Test name                                                   | Status |
| --- | --------- | ----------- | --------------------------------------- | ----------------------------------------------------------- | ------ |
| T11 | B8        | acceptance  | tests/integration/popup-privacy.test.js | links to the store reviews, so users can rate it            | ✅     |
| T12 | B8        | integration | tests/integration/popup-privacy.test.js | opens the %s link in a new tab, without giving it the popup | ✅     |
| T13 | B9        | integration | tests/integration/popup-privacy.test.js | invites a GitHub star on the Source link, keeping its name  | ⬜     |
| —   | B10       | manual      | validation.md → manual check 8          | keyboard, focus ring, width, light and dark mode            | ➖     |

Notes: B10 and the two-line layout (B8) are styling and Chrome's own
keyboard handling; manual checks 7 and 8 cover them. The footer code was
written before this spec and brought back one test at a time.
