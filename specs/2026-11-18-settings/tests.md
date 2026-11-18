# Phase 2 — Settings: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-2-settings

| #   | Behaviour | Level | File                      | Test name                                                                | Status |
| --- | --------- | ----- | ------------------------- | ------------------------------------------------------------------------ | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js | the storage mock returns seeded values and the defaults for missing keys | ✅     |
| T2  | setup     | unit  | tests/unit/sanity.test.js | the storage mock tells listeners what changed, with the 'sync' area      | ✅     |
| T3  | setup     | unit  | tests/unit/sanity.test.js | the storage mock reports no change when a value is set to what it was    | ✅     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). The tests prove the `chrome.storage` mock behaves like Chrome
(`get` with defaults, `onChanged` with `(changes, 'sync')`, no event for an
unchanged value), so later reds are real reds. The settings constants in
`src/shared/constants.js` are data and are exercised by group 2's tests.

## 2. Settings storage

Behaviours: B1–B8 · Branch: phase-2-settings

| #   | Behaviour | Level       | File                                       | Test name                                                                 | Status |
| --- | --------- | ----------- | ------------------------------------------ | ------------------------------------------------------------------------- | ------ |
| T1  | B2        | acceptance  | tests/integration/content-settings.test.js | stops clicking when auto-skip is turned off in storage, without a reload  | 🔴     |
| T2  | B4        | unit        | tests/unit/settings.test.js                | uses a stored delay of $stored as $expected                               | ✅     |
| T3  | B5        | unit        | tests/unit/settings.test.js                | uses the default when the stored $key is $label                           | ✅     |
| T4  | B1        | unit        | tests/unit/storage.test.js                 | reads auto-skip on with no delay when nothing is stored                   | ✅     |
| T5  | B2        | unit        | tests/unit/storage.test.js                 | tells listeners the new settings when they change in storage              | ✅     |
| T6  | setup     | unit        | tests/unit/sanity.test.js                  | the storage mock reports a removed key with only its old value            | ⬜     |
| T7  | B6        | unit        | tests/unit/storage.test.js                 | goes back to the default when a setting is removed from storage           | ⬜     |
| T8  | B2        | unit        | tests/unit/skipper.test.js                 | does not click a visible Skip button while auto-skip is off               | ⬜     |
| T9  | B3        | integration | tests/integration/content-settings.test.js | skips the ad on screen when auto-skip is turned back on                   | ⬜     |
| T10 | B7        | integration | tests/integration/content-settings.test.js | does not click an ad already showing at load when auto-skip is stored off | ⬜     |
| T11 | B8        | integration | tests/integration/content-settings.test.js | handles a settings change on a page without a player without errors       | ⬜     |

Agreed at Gate 2: `storage.js` exports `getSettings()` and `watchSettings()`
(`{ current(), onChange(listener) }`) instead of `onSettingsChanged`, so
merge state stays out of `main.js`; no area or key filter yet
(`normalizeSettings` ignores unknown keys; only `sync` is used);
`setSettings` moves to group 4; existing skipper and follow-player tests pass
settings in, with no assertion changes. T10 is a guard expected to pass on
arrival: T8's wiring makes `main.js` read settings before following the
player.
