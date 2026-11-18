# Phase 2 — Settings: Requirements

## Context

Phase 2 is the third phase in the [roadmap](../roadmap.md). Phase 0 delivered
a loadable MV3 extension, the dev tooling, and the `chrome` mock in
`tests/setup/chrome.js`. Phase 1 delivered auto-skip: the content script
follows YouTube's player (`src/content/follow-player.js`), and the skipper
(`src/core/skipper.js`) clicks a visible **Skip button** once per appearance,
with the trusted-click script (`src/content/trusted-click.js`) making
YouTube accept the click. Auto-skip is always on, with no **delay**, and the
popup is still a placeholder.

After this phase, a colleague can turn auto-skip on or off and set a delay of
0–10 seconds from the popup, and changes apply to open YouTube tabs without
a reload.

It serves the [mission](../mission.md)'s promises of an on/off toggle and a
0–10 s delay (default 0), and its success criterion "toggle and delay
changes apply immediately, without reloading the page". See
[tech-stack.md](../tech-stack.md) for the principles and storage schema, and
[PLAN.md §4, §6, §7.2–7.4 and §8](../../docs/PLAN.md) for the original flow,
pseudocode, edge cases, and popup sketch.

## Scope

**In scope**

- `[core]` `[content]` **Settings storage:** the `enabled` and `delaySec`
  **settings** with defaults and the rules that clean up stored values; the
  storage adapter `src/shared/storage.js`; the content script reads the
  settings before it starts and follows `chrome.storage.onChanged`.
- `[core]` `[content]` **Delay:** the click happens `delaySec` seconds after
  the Skip button appears, and is called off when auto-skip is turned off or
  the button disappears during the wait.
- `[popup]` **Popup controls:** an auto-skip checkbox and a delay number
  input that show the stored settings on open and save on change, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- **End to end:** one Playwright test where turning auto-skip off in the real
  popup stops the Skip click on the local fixture page.

**Out of scope**

- The **skip counter** and "Reset counter" (Phase 3).
- The `DEBUG` flag, final icons, README install steps, `1.0.0` (Phase 4).
- A stable extension ID (`key` in `manifest.json`): deferred to Phase 4, so
  moving the folder still resets the settings (a known limitation).
- Delays in fractions of a second; the delay is a whole number of seconds.
- A countdown overlay or a way to cancel one skip (roadmap **Later**).
- An options page, a background service worker, or a toolbar badge.
- CI (still deferred; see
  [Deferred decisions](../tech-stack.md#deferred-decisions)).

## Features

### Settings storage

- The settings are `enabled` (default `true`) and `delaySec` (default `0`),
  in `chrome.storage.sync`.
- A missing key reads as its default. Defaults are never written on install;
  there is no background worker to write them, and none is needed.
- Stored values are cleaned up by `normalizeSettings(raw)` in
  `src/core/settings.js`, on every read and before every write:
  - `enabled`: anything other than `true` or `false` reads as `true`.
  - `delaySec`: a finite number is rounded to a whole number, then clamped to
    0–10 (`15` → `10`, `-3` → `0`, `2.6` → `3`). Anything else (missing,
    `NaN`, `Infinity`, `null`, the string `"5"`) reads as `0`.
- `src/shared/storage.js` is the only file that touches `chrome.storage`. It
  offers `getSettings()`, `setSettings(partial)`, and
  `onSettingsChanged(callback)`, which returns a function that stops
  listening. It reacts only to the `sync` area and only to the two settings
  keys; a removed key falls back to its default.
- At load, `main.js` reads the settings first and only then starts following
  the player, so no ad is clicked before the stored settings are known.
- The content script keeps the current settings in memory and updates them
  from `onSettingsChanged`; checks never read storage.
- Turning auto-skip **off** stops clicks right away, including during a
  delay. Turning it **on** runs a check right away, so an ad whose Skip
  button is already visible is skipped.
- Pages without a player (home page, Shorts, search) still show no errors,
  with auto-skip on or off.

### Delay

- The skipper starts a wait of `delaySec` seconds when a check first sees a
  visible Skip button while an ad is showing and auto-skip is on. With
  `delaySec` 0 the wait is 0 ms, so the click lands within the mission's
  ~0.5 s target.
- When the wait ends, the skipper looks at the player again and clicks only
  if an ad is still showing, a Skip button is still visible (it may be a new
  element), and auto-skip is still on.
- A check during the wait that finds no visible Skip button, or finds
  auto-skip off, calls the wait off and re-arms the skipper.
- Click once per appearance still holds: a wait, then at most one click, per
  appearance of the Skip button. A two-ad pod gets two waits and two clicks.
- A new `delaySec` applies from the next appearance of the Skip button; a
  wait that already started keeps its length.
- The timer functions (`setTimeout`, `clearTimeout`) are passed into
  `createSkipper`, so unit tests use Vitest's fake timers. Stopping
  `followPlayer` calls off any pending wait.
- Edge cases (PLAN.md §7.4):
  - Auto-skip turned off during the delay: no click.
  - The ad ends, or the button is hidden again, during the delay: no click.
  - The player is replaced by navigation during the delay: the old player's
    wait is called off with it.

### Popup controls

- `popup/popup.html` gains a form with a checkbox labelled "Auto-skip ads"
  and a number input labelled "Delay (seconds)" (`min="0"`, `max="10"`,
  `step="1"`). `popup/popup.js` is loaded as `<script type="module">` and
  imports `../src/shared/storage.js`.
- On open, the controls show the stored settings (the defaults on a fresh
  install).
- Ticking or unticking the checkbox saves `enabled` at once.
- The delay is saved on the input's `change` event (spinner click, Enter, or
  leaving the field), not on every keystroke. After saving, the field shows
  the cleaned-up value (typing `25` shows `10`). An empty or non-numeric
  field saves nothing and goes back to the stored value.
- There is no Save button.
- Meets [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard):
  ~280px wide, no horizontal scroll, light and dark mode, native controls
  with visible labels, usable with Tab, Space, Enter, and the arrow keys.
- The Phase 0 placeholder line and its test
  (`tests/integration/popup-placeholder.test.js`) are removed; the heading
  "YT Skip Ad" stays.

### End to end

- `tests/e2e/settings.spec.js` opens the real popup at
  `chrome-extension://<id>/popup/popup.html`, unticks "Auto-skip ads", then
  loads the fixture page and expects no Skip click.
- The extension has no service worker, so Playwright can't look up its ID
  the usual way. The test helper works the ID out from the folder path the
  way Chrome does for unpacked extensions: SHA-256 of the absolute path,
  first 32 hex digits, each mapped `0–f` → `a–p`.

## Storage and selectors

No selector, permission, content-script, or `web_accessible_resources`
change. The popup is an extension page, so it imports `src/shared/` modules
without a manifest entry.

Agreed at Gate 0, in `src/shared/constants.js`:

| Key        | Area   | Type    | Default | Valid range    | Written by | Why                                         |
| ---------- | ------ | ------- | ------- | -------------- | ---------- | ------------------------------------------- |
| `enabled`  | `sync` | boolean | `true`  | `true`/`false` | popup      | Auto-skip on/off; follows the user's Chrome |
| `delaySec` | `sync` | integer | `0`     | 0–10           | popup      | Wait before the click; same reason          |

**Contested choices:**

- **The delay lives in the skipper** (`createSkipper({ schedule, cancel,
getSettings })`), not in `follow-player.js`: timing is logic, so it stays
  in `src/core/` and is unit-tested with fake timers; the wiring only passes
  in `setTimeout`/`clearTimeout` and a settings getter.
- **Read settings before following the player**, over starting with defaults
  and swapping in stored values: costs one storage read (a few milliseconds)
  at load, but a colleague who turned auto-skip off never gets a click on an
  ad that was already showing.
- **Changes during an ad:** off calls a pending wait off; on runs a check
  right away; a new delay applies from the next Skip button, over restarting
  the running wait (more state and edge cases for little gain).
- **The popup saves the delay on `change`**, over `input`: typing `10` would
  otherwise save `1` and then `10`, and an empty field mid-typing would need
  special handling. The Popup UI standard's "changes apply on input" is
  reworded to "on change, with no Save button" in the Verify group.
- **e2e extension ID from the folder path**, over a test-only background
  worker (changes the manifest for tests) and over reading
  `chrome://extensions` (brittle): relies on Chrome's long-stable rule for
  unpacked extension IDs.

**Upgrade impact:** earlier versions stored nothing, so a colleague who
replaces the folder with this version gets auto-skip on with no delay,
exactly as 0.2.1 behaves. Moving the folder resets the settings, because the
extension ID comes from the folder path.

## Decisions

| Decision                | Choice                                                                | Why                                                                   |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Scope                   | Settings storage, delay, popup controls, one e2e test                 | User's choice; all roadmap sub-slices                                 |
| Slicing                 | One group per roadmap sub-slice                                       | User's choice; each group has a clear acceptance test                 |
| Merge bar               | Automated checks plus a manual pass on real YouTube                   | User's choice; only live ads prove the delay                          |
| Stable extension ID     | Deferred to Phase 4                                                   | User's choice; already a known limitation                             |
| Storage keys            | `enabled`, `delaySec` in `sync`, as in the table above                | Agreed at Gate 0                                                      |
| Clean-up rules          | `normalizeSettings` on read and write; round, then clamp `delaySec`   | Agreed at Gate 0; a bad value is never an error and never stored      |
| Defaults on install     | Not written; a missing key reads as its default                       | Agreed at Gate 0; no background worker needed                         |
| Where the delay lives   | In `createSkipper`, with timers and a settings getter passed in       | Agreed at Gate 0; logic in `core/`, fake-timer unit tests             |
| Settings at load        | Read before `followPlayer` starts; then follow `onSettingsChanged`    | Agreed at Gate 0; no click before the stored settings are known       |
| Changes during an ad    | Off calls the wait off; on checks now; new delay from the next button | Agreed at Gate 0                                                      |
| Popup delay save        | On `change`; the field shows the cleaned-up value                     | Agreed at Gate 0                                                      |
| e2e extension ID        | Worked out from the folder path                                       | Agreed at Gate 0; tests the real popup with no manifest change        |
| Delay unit              | Whole seconds only                                                    | Matches the roadmap and schema; a number input with `step="1"`        |
| Empty delay field       | Saves nothing; the field goes back to the stored value                | Clearing the field to retype it shouldn't save `0`                    |
| Module split            | `src/core/settings.js` (rules) and `src/shared/storage.js` (I/O only) | One responsibility each; rules testable without the `chrome` mock     |
| Settings to the content | `followPlayer(doc, settings)` gets a getter and a change subscription | `follow-player.js` stays wiring; `main.js` owns the storage calls     |
| `chrome` mock           | `storage.sync.get/set/remove` and `storage.onChanged`, in memory      | Fires `(changes, 'sync')` like Chrome; still rebuilt before each test |
| Popup placeholder test  | Replaced by `tests/integration/popup-settings.test.js`                | The placeholder line goes away                                        |
| Popup script            | `popup/popup.js` as an ES module                                      | Same files Vitest tests; no build step                                |
| Version                 | `0.3.0` in the Verify group, if the build will be shared              | Colleagues can tell builds apart; `1.0.0` stays reserved for v1       |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` before coding for: Chrome Extensions
  `chrome.storage` (`sync`, `get`/`set` with defaults, `onChanged`, quotas),
  ES modules in extension pages, Vitest (fake timers, `it.fails`), jsdom
  form events (`change` on checkbox and number inputs, `valueAsNumber`), and
  Playwright (opening `chrome-extension://` pages in a persistent context).
- Every behaviour is built test-first, as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd).
- Logic lives in `src/core/`; `src/content/` and `popup/` only wire the DOM
  and `chrome.*`.
- Only `src/shared/storage.js` touches `chrome.storage`; keys and defaults
  live only in `src/shared/constants.js`; selectors only in
  `src/core/selectors.js`.
- No new permission without the user's agreement.
- No network requests, no data leaving the device.
- No build step for the extension itself.
