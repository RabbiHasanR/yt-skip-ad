# Phase 1 — Auto-skip: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-1-auto-skip

| #   | Behaviour | Level | File                              | Test name                                                       | Status |
| --- | --------- | ----- | --------------------------------- | --------------------------------------------------------------- | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js         | loads the player fixture with a Skip button inside the player   | ✅     |
| T2  | setup     | e2e   | tests/e2e/extension-loads.spec.js | the unpacked extension runs its content script on a YouTube URL | ⬜     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). `src/core/selectors.js` and `src/shared/constants.js` are data and are
exercised by group 2's tests; `main.js` importing `LOG_PREFIX` is a refactor
covered by Phase 0's `content-loader` test. T2 is a setup proof for Playwright
and the real loader, so group 3's e2e failures are about skipping, not setup.
