# Phase 1 — Auto-skip: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-1-auto-skip

| #   | Behaviour | Level | File                              | Test name                                                       | Status |
| --- | --------- | ----- | --------------------------------- | --------------------------------------------------------------- | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js         | loads the player fixture with a Skip button inside the player   | ✅     |
| T2  | setup     | e2e   | tests/e2e/extension-loads.spec.js | the unpacked extension runs its content script on a YouTube URL | ✅     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). `src/core/selectors.js` and `src/shared/constants.js` are data and are
exercised by group 2's tests; `main.js` importing `LOG_PREFIX` is a refactor
covered by Phase 0's `content-loader` test. T2 is a setup proof for Playwright
and the real loader, so group 3's e2e failures are about skipping, not setup.

## 2. Detect and click

Behaviours: B1–B4, B6, B11 · Branch: phase-1-auto-skip

| #   | Behaviour | Level       | File                                        | Test name                                                          | Status |
| --- | --------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------ | ------ |
| T1  | B1        | acceptance  | tests/integration/content-auto-skip.test.js | clicks a visible Skip button while an ad is showing                | ✅     |
| T2  | B1        | unit        | tests/unit/ad-detection.test.js             | finds a visible Skip button by its $selector class                 | ✅     |
| T3  | B3        | unit        | tests/unit/ad-detection.test.js             | ignores a Skip button hidden by $how                               | ✅     |
| T4  | B1        | unit        | tests/unit/ad-detection.test.js             | ignores a Skip button outside the player                           | ✅     |
| T5  | B1        | unit        | tests/unit/ad-detection.test.js             | finds the player by $how                                           | ✅     |
| T6  | B3        | unit        | tests/unit/skipper.test.js                  | clicks the Skip button once it becomes visible after the countdown | ✅     |
| T7  | B2        | unit        | tests/unit/skipper.test.js                  | does not click a visible Skip button when no ad is showing         | ✅     |
| T8  | B4        | unit        | tests/unit/skipper.test.js                  | clicks only once while the same Skip button stays visible          | ✅     |
| T9  | B4        | unit        | tests/unit/skipper.test.js                  | clicks again for the next ad in a pod after its countdown          | ✅     |
| T10 | B6        | unit        | tests/unit/skipper.test.js                  | does nothing during an ad without a Skip button                    | ✅     |
| T11 | B11       | integration | tests/integration/content-auto-skip.test.js | loads without errors on a page without a player                    | ✅     |

B5 moved to group 3 and B11 moved here at Gate 2 (see `plan.md`). T4 and T10
are guards expected to pass on arrival: the minimal code already searches only
inside the player, and an ad with no Skip button has no path to fail on.
