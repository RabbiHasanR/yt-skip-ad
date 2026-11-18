# Phase 2 — Settings: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-2-settings

| #   | Behaviour | Level | File                      | Test name                                                                | Status |
| --- | --------- | ----- | ------------------------- | ------------------------------------------------------------------------ | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js | the storage mock returns seeded values and the defaults for missing keys | ✅     |
| T2  | setup     | unit  | tests/unit/sanity.test.js | the storage mock tells listeners what changed, with the 'sync' area      | ✅     |
| T3  | setup     | unit  | tests/unit/sanity.test.js | the storage mock reports no change when a value is set to what it was    | ⬜     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). The tests prove the `chrome.storage` mock behaves like Chrome
(`get` with defaults, `onChanged` with `(changes, 'sync')`, no event for an
unchanged value), so later reds are real reds. The settings constants in
`src/shared/constants.js` are data and are exercised by group 2's tests.
