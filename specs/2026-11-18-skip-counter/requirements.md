# Phase 3 — Skip Counter: Requirements

## Context

Phase 3 is the fourth phase in the [roadmap](../roadmap.md). Phase 0
delivered a loadable MV3 extension, the dev tooling, and the `chrome` mock.
Phase 1 delivered auto-skip: the content script follows YouTube's player
(`src/content/follow-player.js`) and the skipper (`src/core/skipper.js`)
clicks a visible **Skip button** once per appearance. Phase 2 delivered the
**settings**: an on/off toggle and a 0–10 s **delay** in
`chrome.storage.sync`, read through `src/shared/storage.js` and set from the
popup.

After this phase, a colleague sees in the popup how many **ads** were
skipped, the count goes up live while the popup is open, and "Reset counter"
sets it back to 0.

It serves the [mission](../mission.md)'s promise "a user sees the **skip
counter** in the popup and can reset it". See
[tech-stack.md](../tech-stack.md) for the principles and storage schema, and
[PLAN.md §4, §6, §7.3 and §8](../../docs/PLAN.md) for the original flow,
pseudocode (`incrementCount()` after the click), and popup sketch.

## Scope

**In scope**

- `[core]` `[content]` **Count skips:** each Skip button click made by the
  skipper adds 1 to `skipCount`; a wait that is called off, or no click,
  adds nothing.
- `[popup]` **Show the counter:** the popup shows the skip counter when it
  opens and updates it live while open, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `[popup]` **Reset counter:** a "Reset counter" button sets it to 0,
  meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).

**Out of scope**

- An end-to-end test for the counter (user's choice); the integration
  acceptance tests cover content → storage → popup with the `chrome` mock.
  The existing e2e tests keep passing.
- A toolbar badge counter (roadmap **Later**; needs a service worker).
- Counts per day, per channel, or time saved.
- A confirmation before reset.
- Counting ads that are not skipped (unskippable ads, auto-skip off).
- Live refresh of the _settings_ in an open popup (still a known
  limitation); only the counter updates live.
- `DEBUG` flag, final icons, README install steps, stable extension ID,
  `1.0.0` (Phase 4). CI (still deferred).

## Features

### Count skips

- The skipper's click is the only thing that counts: right after
  `button.click()` in `src/core/skipper.js`, the skipper calls the `onSkip`
  callback it was given. `follow-player.js` passes `incrementSkipCount` from
  `src/shared/storage.js`.
- A click counts as a skip when the skipper made it; whether YouTube accepted
  it can't be seen.
- One click, one count: a two-ad pod adds 2; a delayed click adds 1 when it
  happens.
- Nothing is counted when (PLAN.md §7.4):
  - auto-skip is off, or turned off during the delay;
  - the ad ends, or the Skip button is hidden again, during the delay;
  - in-page navigation replaces the player during the delay.
- `incrementSkipCount()` reads `skipCount` from `chrome.storage.local`,
  cleans it up, adds 1, and writes it back. No lock: two tabs clicking in the
  same few milliseconds can lose one count (a known limitation).
- A failed write is never thrown at the page; auto-skip keeps working.
- Counting a skip never looks like a settings change: `watchSettings()`
  follows only the `sync` area, so a `local` write does not trigger an extra
  check.
- Pages without a player (home page, Shorts, search) show no errors and
  never change the counter.

### Show the counter

- `popup/popup.html` gains a line "Ads skipped: N", with N in an
  `<output>` element, below the settings form.
- On open, `popup.js` shows the stored count (0 on a fresh install).
- While the popup is open, it follows `watchSkipCount(listener)` and shows
  each new count without reopening.
- N is formatted with `toLocaleString()` (e.g. `1,234`) and fits the popup's
  fixed width with no horizontal scroll.

### Reset counter

- A native `<button type="button">` labelled "Reset counter" calls
  `resetSkipCount()`, which writes `skipCount: 0`.
- No confirmation; the popup shows 0 at once.
- Works with the keyboard (Tab, then Enter or Space) with a visible focus
  ring, in light and dark mode.

## Storage and selectors

No selector, DOM signal, permission, content-script, or
`web_accessible_resources` change. `storage` already covers the `local`
area.

Agreed at Gate 0, in `src/shared/constants.js`:

| Key         | Area    | Type    | Default | Valid range | Written by                       | Why                                         |
| ----------- | ------- | ------- | ------- | ----------- | -------------------------------- | ------------------------------------------- |
| `skipCount` | `local` | integer | `0`     | ≥ 0         | content (+1), popup (reset to 0) | The skip counter; kept per device, unsynced |

Clean-up rule, `normalizeSkipCount(raw)` in `src/core/skip-count.js`: a
finite number ≥ 0 is rounded down to a whole number; anything else
(negative, `NaN`, `Infinity`, a string, `null`, missing) reads as `0`.

Storage adapter additions in `src/shared/storage.js`: `getSkipCount()`,
`incrementSkipCount()`, `resetSkipCount()`, `watchSkipCount(listener)`
(filtered to the `local` area and `skipCount`).

**Contested choices:**

- **`local`, not `sync`:** each device keeps its own count, so two synced
  Chrome installs can't overwrite each other's counts (Chrome Sync is
  last-write-wins), no sync write quota is spent per skip, and the count
  never leaves the machine through Chrome Sync. Cost: a second storage area
  in `storage.js` and the mock; the counter doesn't follow the colleague to
  another computer.
- **Read, add 1, write, with no lock**, over a background service worker as
  the only writer: a lost count needs two tabs skipping within milliseconds;
  a worker adds messaging and a new failure point for a vanity number.
- **Counting in the skipper** (`createSkipper({ getSettings, onSkip })`),
  over wrapping the click in `follow-player.js`: "only a real click counts"
  is logic, so it stays in `src/core/` and gets fake-timer unit tests.

**Upgrade impact:** 0.3.0 stored no `skipCount`, so a colleague who replaces
the folder with this version starts at 0; `enabled` and `delaySec` stay in
`sync`, untouched. Moving the folder still resets the settings and the
counter, because the extension ID comes from the folder path.

## Decisions

| Decision                | Choice                                                                        | Why                                                                     |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Scope                   | Count skips, show the counter live, reset; no e2e test                        | User's choice                                                           |
| Slicing                 | Two slices: count skips (core + content), then the popup                      | User's choice; same split as Phase 2                                    |
| Merge bar               | Automated checks plus a manual pass on real YouTube                           | User's choice; only real ads prove one count per skip                   |
| Storage area            | `skipCount` in `chrome.storage.local`                                         | Agreed at Gate 0; no cross-device overwrites, no sync quota, stays here |
| Increment               | Read, add 1, write; no lock, no service worker                                | Agreed at Gate 0; a rare lost count is a known limitation               |
| Where counting happens  | `onSkip` callback passed to `createSkipper`, called right after the click     | Agreed at Gate 0; logic stays in `src/core/`                            |
| Clean-up rule           | `normalizeSkipCount`: finite ≥ 0 rounded down, else `0`                       | Agreed at Gate 0; a bad value is never an error                         |
| Adapter API             | `getSkipCount`, `incrementSkipCount`, `resetSkipCount`, `watchSkipCount`      | Agreed at Gate 0; only `storage.js` touches `chrome.storage`            |
| Settings watcher filter | `watchSettings` follows only the `sync` area                                  | Agreed at Gate 0; a counted skip mustn't trigger an extra check         |
| Popup counter           | "Ads skipped: N" in an `<output>`, `toLocaleString()`                         | Agreed at Gate 0; `<output>` is announced by screen readers             |
| Reset                   | Native `<button>` "Reset counter", no confirmation                            | Agreed at Gate 0; one click, low stakes                                 |
| Key constant            | `SKIP_COUNT_KEY = 'skipCount'`, `DEFAULT_SKIP_COUNT = 0` in `constants.js`    | Keys and defaults live only there                                       |
| New core module         | `src/core/skip-count.js`, not `settings.js`                                   | The counter isn't a setting; one responsibility per file                |
| Failed increment        | Caught and logged once with `LOG_PREFIX`; never thrown at the page            | Counting must never break skipping                                      |
| `chrome` mock           | Add `storage.local` (`get`, `set`, `remove`), firing `onChanged` with `local` | Same shape as `sync`; still rebuilt before each test                    |
| Version                 | `0.4.0` in the Verify group, if the build will be shared                      | Colleagues can tell builds apart; `1.0.0` stays reserved for v1         |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` before coding for: Chrome Extensions
  `chrome.storage` (`local` area, `get` with defaults, `set`, `onChanged`
  `areaName`), Vitest (fake timers, `it.fails`), and jsdom (`<output>`
  `value`, button `click`).
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
