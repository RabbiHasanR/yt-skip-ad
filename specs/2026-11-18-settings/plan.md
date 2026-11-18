# Phase 2 — Settings: Plan

Branch: `phase-2-settings`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time.

Per-behaviour gate: `npm test`, `npm run lint`, `npm run typecheck`, and
`npm run format:check` are green, then a conventional commit with no
Co-Authored-By or AI attribution lines.

## 1. Groundwork

- Fetch current docs with `ctx7`: `chrome.storage` (`sync`, `get` with
  defaults, `set`, `onChanged` and its `(changes, areaName)` arguments,
  write quotas), ES modules in extension pages, Vitest fake timers, jsdom
  `change` events and `valueAsNumber` on number inputs, and Playwright
  (opening `chrome-extension://` pages in a persistent context).
- `src/shared/constants.js`: `DEFAULT_SETTINGS = { enabled: true,
delaySec: 0 }`, `DELAY_SEC_MIN = 0`, `DELAY_SEC_MAX = 10`, and the storage
  keys, as agreed at Gate 0. Update the file's header comment.
- `tests/setup/chrome.js`: add `storage.sync.get`, `set`, `remove` backed by
  an in-memory store, and `storage.onChanged.addListener` /
  `removeListener`. Writes fire listeners with `(changes, 'sync')`, where
  each change has `oldValue` / `newValue`, as Chrome does. Still rebuilt
  before every test.
- `tests/setup/` helper to seed stored values before a test (including
  invalid ones).
- No new fixture: `tests/fixtures/player.html` and `player.js` already cover
  the ad and Skip-button states.

## 2. Settings storage (slice 1)

- **Behaviours:** B1–B8.
- **Acceptance:** `tests/integration/content-settings.test.js` → "stops
  clicking when auto-skip is turned off in storage, without a reload".
- **Storage/selectors:** `enabled`, `delaySec` (read only; nothing writes
  them yet but tests).

Tasks, in build order:

- **Core:** `src/core/settings.js` (`normalizeSettings(raw)`: defaults,
  `enabled` must be a boolean, `delaySec` rounded then clamped, anything
  else to the default); tests in `tests/unit/settings.test.js`.
- **Shared:** `src/shared/storage.js` (`getSettings()`, `setSettings(partial)`
  normalizing before writing, `onSettingsChanged(callback)` filtered to the
  `sync` area and the settings keys, merging the change and normalizing,
  returning an unsubscribe function); tests in `tests/unit/storage.test.js`
  against the `chrome` mock.
- **Core:** `src/core/skipper.js` takes a settings getter; with auto-skip
  off, a check never clicks. Tests added to `tests/unit/skipper.test.js`.
- **Content:** `src/content/main.js` awaits `getSettings()`, then calls
  `followPlayer(document, settings)`, where `settings` gives the current
  settings and a change subscription. `src/content/follow-player.js` passes
  the getter to each skipper and runs a check when auto-skip turns on;
  `stop()` also unsubscribes. Tests in
  `tests/integration/content-settings.test.js` against
  `tests/fixtures/player.html`; existing content tests updated to pass
  settings where they call `followPlayer`.

## 3. Delay (slice 2)

- **Behaviours:** B9–B14.
- **Acceptance:** `tests/integration/content-delay.test.js` → "clicks the
  Skip button `delaySec` seconds after it appears".
- **Storage/selectors:** `delaySec` (read).

Tasks, in build order:

- **Core:** `src/core/skipper.js` (`createSkipper({ schedule, cancel,
getSettings })`): a check that sees a visible Skip button while an ad
  shows and auto-skip is on starts one wait of `delaySec` seconds; when it
  ends, the player is checked again before clicking; a check that sees no
  button or auto-skip off calls the wait off and re-arms. Tests in
  `tests/unit/skipper.test.js` with `vi.useFakeTimers`; existing skipper
  tests keep passing with `delaySec` 0.
- **Content:** `src/content/follow-player.js` passes `setTimeout` /
  `clearTimeout` to each skipper and calls off a pending wait when the
  player is replaced or `stop()` runs. Tests in
  `tests/integration/content-delay.test.js`.

## 4. Popup controls (slice 3)

- **Behaviours:** B15–B21.
- **Acceptance:** `tests/integration/popup-settings.test.js` → "shows the
  stored settings when the popup opens".
- **Storage/selectors:** `enabled`, `delaySec` (written by the popup).

Tasks, in build order:

- **Core:** `src/core/settings.js` gains the delay-field rule (a number is
  normalized; empty or non-numeric means "keep the stored value"); tests in
  `tests/unit/settings.test.js`.
- **Popup:** `popup/popup.html` (form with the labelled checkbox and number
  input, `<script type="module" src="popup.js">`, placeholder line removed),
  `popup/popup.css` (control layout, focus styles, light and dark),
  `popup/popup.js` (fill the controls from `getSettings()`, save the
  checkbox on `change`, save the delay on `change` and show the cleaned-up
  value). Tests in `tests/integration/popup-settings.test.js`; delete
  `tests/integration/popup-placeholder.test.js`.
- **End to end:** `tests/e2e/settings.spec.js` → "turning auto-skip off in
  the popup stops the Skip click on a YouTube-like page". Add an
  extension-ID helper to `tests/e2e/fixtures.js` (SHA-256 of the extension
  folder's absolute path, first 32 hex digits mapped `0–f` → `a–p`); open
  `chrome-extension://<id>/popup/popup.html`, untick the checkbox, then load
  `https://www.youtube.com/watch?v=fixture` and expect no trusted Skip click.

## 5. Verify and document

- Run [validation.md](validation.md), including the manual pass on real
  YouTube.
- Update `specs/tech-stack.md`: change the `enabled` and `delaySec`
  **Storage schema** rows from _planned_ to _built_ and match them to
  `src/shared/constants.js`; record decisions under **Decided in Phase 2**
  (clean-up rules, adapter API, settings read before following, delay in the
  skipper, changes during an ad, popup save on `change`, e2e extension ID);
  reword the **Popup UI standard**'s "changes apply on input" to "on change,
  with no Save button"; update the `chrome` mock note; add **Known
  limitations** (settings reset when the folder moves, until the stable ID
  in Phase 4; `chrome.storage.sync` copies the two settings to the user's
  other signed-in Chrome browsers through Chrome Sync).
- `README.md`: the popup's two controls and what they do.
- `manifest.json` and `package.json` version `0.3.0`, if the build will be
  shared.
- `specs/roadmap.md`: mark Phase 2 `✅ Complete` and link this spec.
- `CHANGELOG.md`: add a `0.3.0` entry.
