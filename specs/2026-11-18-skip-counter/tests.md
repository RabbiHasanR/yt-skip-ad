# Phase 3 — Skip Counter: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-3-skip-counter

| #   | Behaviour | Level | File                      | Test name                                                                      | Status |
| --- | --------- | ----- | ------------------------- | ------------------------------------------------------------------------------ | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js | the local storage mock returns seeded values and the defaults for missing keys | ✅     |
| T2  | setup     | unit  | tests/unit/sanity.test.js | the storage mock tells listeners what changed, with the 'local' area           | ⬜     |
| T3  | setup     | unit  | tests/unit/sanity.test.js | the sync and local storage areas keep their values apart                       | ⬜     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). The tests prove the `chrome.storage.local` mock behaves like Chrome,
so later reds are real reds. The unchanged-JSON and removed-key rules are not
repeated for `local`: both areas are built by the same `createStorageArea`,
and T3 shows they are separate. `SKIP_COUNT_KEY` and `DEFAULT_SKIP_COUNT` in
`src/shared/constants.js` are data and are exercised by group 2's tests.
`seedStorage(values, area = 'sync')` gains an optional area; existing
callers are unchanged.
