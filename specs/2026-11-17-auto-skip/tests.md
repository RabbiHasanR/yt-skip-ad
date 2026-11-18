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

## 3. Follow the player

Behaviours: B5, B7–B10, B12 · Branch: phase-1-auto-skip

| #   | Behaviour | Level       | File                                            | Test name                                                          | Status |
| --- | --------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------ | ------ |
| T1  | B7, B10   | acceptance  | tests/integration/content-follow-player.test.js | skips an ad that starts after the page has loaded                  | ✅     |
| T2  | B10       | unit        | tests/unit/throttle.test.js                     | runs once, after the wait, for a burst of calls                    | ✅     |
| T3  | B10       | unit        | tests/unit/throttle.test.js                     | runs again for calls made after the previous run                   | ✅     |
| T4  | B8        | integration | tests/integration/content-follow-player.test.js | follows a player that appears after the content script loads       | ✅     |
| T5  | B9        | integration | tests/integration/content-follow-player.test.js | keeps skipping after navigation replaces the player                | ✅     |
| T6  | B5        | integration | tests/integration/content-follow-player.test.js | does not click when the ad ends before the throttled check runs    | ✅     |
| T7  | B12       | —           | —                                               | —                                                                  | ➖     |
| T8  | B1        | e2e         | tests/e2e/auto-skip.spec.js                     | the loaded extension clicks the Skip button on a YouTube-like page | ✅     |
| T9  | B4        | integration | tests/integration/content-follow-player.test.js | does not click again when navigation keeps the same player         | ✅     |

- T1 also pins B10's latency: the click happens after exactly
  `CHECK_THROTTLE_MS` of fake time.
- T6 is a guard expected to pass on arrival (each check reads the DOM fresh);
  it is mutation-checked instead.
- T7 (B12, background tabs): jsdom has no real background tab, and a test of
  "uses `setTimeout`, not `requestAnimationFrame`" would test implementation.
  Covered by manual check 8 and the Gate 0 throttle decision.
- `src/content/follow-player.js` exports `followPlayer(doc)` returning
  `stop()`, so integration tests can tear down their observers and
  `yt-navigate-finish` listener; `main.js` only calls it (agreed at Gate 2).
- T9 was added after Gate 2 with the user's agreement: coverage showed the
  same-player navigation branch untested; without it a still-visible Skip
  button gets a second click. A guard, mutation-checked.

## 5. Trusted click

Behaviours: B14, B15 · Branch: phase-1-auto-skip

| #   | Behaviour | Level       | File                                            | Test name                                                            | Status |
| --- | --------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------- | ------ |
| T1  | B14       | acceptance  | tests/e2e/auto-skip.spec.js                     | the loaded extension clicks the Skip button on a YouTube-like page   | ✅     |
| T2  | B14       | integration | tests/integration/manifest.test.js              | runs the trusted-click script in the page's world before its scripts | ✅     |
| T3  | B14       | integration | tests/integration/content-trusted-click.test.js | a click listener on a $selector Skip button sees a trusted click     | ✅     |
| T4  | B14       | integration | tests/integration/content-trusted-click.test.js | the trusted click still acts as the real event                       | ✅     |
| T5  | B15       | integration | tests/integration/content-trusted-click.test.js | leaves $listener untouched                                           | ✅     |
| T6  | B15       | integration | tests/integration/content-trusted-click.test.js | removing a Skip button's click listener still stops it ($case)       | ✅     |

- T1 tightens group 3's T8 instead of adding a second e2e test: the page's
  click counter now counts only `isTrusted` clicks, as YouTube's handler
  does. It is the acceptance test; it was marked `test.fail` until T6 was green.
- T5 is a guard expected to pass on arrival; it is mutation-checked
  instead: dropping each of the three conditions (click only, functions
  only, Skip buttons only) fails exactly one of its cases.
- T3 runs once per entry in `SKIP_BUTTON_SELECTORS`, so it also fails if the
  copy of the list in `trusted-click.js` drifts from `src/core/selectors.js`.
- The script's tests are integration tests: it lives in `src/content/`
  because it must be a classic script in the page's world and can't import
  from `src/core/`.
