# Phase 3 — Skip Counter: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-3-skip-counter

| #   | Behaviour | Level | File                      | Test name                                                                      | Status |
| --- | --------- | ----- | ------------------------- | ------------------------------------------------------------------------------ | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js | the local storage mock returns seeded values and the defaults for missing keys | ✅     |
| T2  | setup     | unit  | tests/unit/sanity.test.js | the storage mock tells listeners what changed, with the 'local' area           | ✅     |
| T3  | setup     | unit  | tests/unit/sanity.test.js | the sync and local storage areas keep their values apart                       | ✅     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). The tests prove the `chrome.storage.local` mock behaves like Chrome,
so later reds are real reds. The unchanged-JSON and removed-key rules are not
repeated for `local`: both areas are built by the same `createStorageArea`,
and T3 shows they are separate. `SKIP_COUNT_KEY` and `DEFAULT_SKIP_COUNT` in
`src/shared/constants.js` are data and are exercised by group 2's tests.
`seedStorage(values, area = 'sync')` gains an optional area; existing
callers are unchanged.

## 2. Count skips

Behaviours: B1–B8 · Branch: phase-3-skip-counter

| #   | Behaviour | Level       | File                                           | Test name                                                            | Status |
| --- | --------- | ----------- | ---------------------------------------------- | -------------------------------------------------------------------- | ------ |
| T1  | B1        | acceptance  | tests/integration/content-skip-counter.test.js | adds 1 to the skip counter when the content script clicks Skip       | 🔴     |
| T2  | B5        | unit        | tests/unit/skip-count.test.js                  | reads a stored count of $stored as $expected                         | ✅     |
| T3  | B1        | unit        | tests/unit/storage.test.js                     | adds 1 to a stored count of $stored, saving $expected                | ⬜     |
| T4  | B8        | unit        | tests/unit/storage.test.js                     | keeps the skip counter in local storage, never in sync               | ⬜     |
| T5  | B6        | unit        | tests/unit/storage.test.js                     | does not tell settings listeners about a skip counter change         | ⬜     |
| T6  | B1        | unit        | tests/unit/skipper.test.js                     | calls onSkip once for each click it makes, with or without a delay   | ⬜     |
| T7  | B2        | unit        | tests/unit/skipper.test.js                     | calls onSkip once for each ad of a pod                               | ⬜     |
| T8  | B3, B4    | unit        | tests/unit/skipper.test.js                     | does not call onSkip when $what                                      | ⬜     |
| T9  | B4        | integration | tests/integration/content-skip-counter.test.js | does not count a wait called off when navigation replaces the player | ⬜     |
| T10 | B6        | integration | tests/integration/content-skip-counter.test.js | keeps skipping when saving the skip counter fails, logging one error | ⬜     |
| T11 | B7        | integration | tests/integration/content-skip-counter.test.js | never changes the skip counter on a page without a player            | ⬜     |

Agreed at Gate 2: `onSkip` is optional in `createSkipper`, so existing
skipper and follow-player tests are unchanged; a failed save logs one
`console.error('[yt-skip-ad] failed to save the skip counter', error)` per
failure and is never thrown at the page. T7, T8, T9, and T11 are guards
expected to pass on arrival and are mutation-checked.
