# Phase 3 — Skip Counter: Plan

Branch: `phase-3-skip-counter`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time.

Per-behaviour gate: `npm test`, `npm run lint`, `npm run typecheck`, and
`npm run format:check` are green, then a conventional commit with no
Co-Authored-By or AI attribution lines.

## 1. Groundwork

- Fetch current docs with `ctx7`: `chrome.storage.local` (`get` with
  defaults, `set`, quotas), `chrome.storage.onChanged` and its `areaName`
  argument, Vitest fake timers and `it.fails`, jsdom `<output>` and button
  clicks.
- `src/shared/constants.js`: `SKIP_COUNT_KEY = 'skipCount'` and
  `DEFAULT_SKIP_COUNT = 0`, as agreed at Gate 0. Update the file's header
  comment.
- `tests/setup/chrome.js`: add `storage.local` (`get`, `set`, `remove`)
  backed by its own in-memory store, firing `storage.onChanged` listeners
  with `(changes, 'local')`, with the same change shape and "unchanged JSON
  is skipped" rule as `sync`. Still rebuilt before every test.
- `tests/setup/storage.js`: let `seedStorage()` seed the `local` area too
  (including invalid counts).
- No new fixture: `tests/fixtures/player.html` and `player.js` already cover
  the ad, Skip-button, and pod states.

## 2. Count skips (slice 1)

- **Behaviours:** B1–B8.
- **Acceptance:** `tests/integration/content-skip-counter.test.js` → "adds 1
  to the skip counter when the content script clicks Skip".
- **Storage/selectors:** `skipCount` in `local` (read and +1 by the content
  script).

Tasks, in build order:

- **Core:** `src/core/skip-count.js` (`normalizeSkipCount(raw)`: finite ≥ 0
  rounded down, anything else `0`); tests in `tests/unit/skip-count.test.js`.
- **Shared:** `src/shared/storage.js` gains `getSkipCount()` and
  `incrementSkipCount()` (read, clean up, add 1, write, in `local`);
  `watchSettings()` ignores changes outside the `sync` area. Tests in
  `tests/unit/storage.test.js` against the `chrome` mock.
- **Core:** `src/core/skipper.js` takes `onSkip` and calls it right after
  each click, never when a wait is called off or no click happens. Tests
  added to `tests/unit/skipper.test.js` with `vi.useFakeTimers`.
- **Content:** `src/content/follow-player.js` passes an `onSkip` to each
  skipper that calls `incrementSkipCount()` and logs a failure once with
  `LOG_PREFIX` instead of throwing. Tests in
  `tests/integration/content-skip-counter.test.js` against
  `tests/fixtures/player.html`; existing content tests keep passing.

## 3. Popup counter (slice 2)

- **Behaviours:** B9–B14.
- **Acceptance:** `tests/integration/popup-skip-counter.test.js` → "shows
  the skip counter increased by 1 after the content script clicks Skip".
- **Storage/selectors:** `skipCount` in `local` (read, followed, and reset
  by the popup).

Tasks, in build order:

- **Shared:** `src/shared/storage.js` gains `resetSkipCount()` and
  `watchSkipCount(listener)` (filtered to the `local` area and `skipCount`,
  cleaned up through `normalizeSkipCount`); tests in
  `tests/unit/storage.test.js`.
- **Popup:** `popup/popup.html` (an "Ads skipped:" line with an `<output>`
  and a "Reset counter" `<button type="button">`), `popup/popup.css`
  (layout, focus ring, light and dark), `popup/popup.js` (show
  `getSkipCount()` on open with `toLocaleString()`, follow
  `watchSkipCount`, reset on click). Tests in
  `tests/integration/popup-skip-counter.test.js`; existing
  `popup-settings.test.js` keeps passing.
- No e2e test this phase (user's choice); `npm run test:all` must still pass.

## 4. Verify and document

- Run [validation.md](validation.md), including the manual pass on real
  YouTube.
- Update `specs/tech-stack.md`: change the `skipCount` **Storage schema** row
  from _planned_ to _built_ and match it to `src/shared/constants.js`;
  update the **Stack summary** database line (`skipCount` in
  `chrome.storage.local`); record decisions under **Decided in Phase 3**
  (local area, unlocked increment, `onSkip` in the skipper, clean-up rule,
  adapter API, `sync`-only settings watcher, popup counter and reset, the
  `local` mock); add **Known limitations** (two tabs skipping at the same
  moment can lose one count; the counter is per device and not synced; it
  counts clicks made, not clicks YouTube accepted).
- `README.md`: the popup's counter and "Reset counter".
- `manifest.json` and `package.json` version `0.4.0`, if the build will be
  shared.
- `specs/roadmap.md`: mark Phase 3 `✅ Complete` and link this spec.
- `CHANGELOG.md`: add a `0.4.0` entry.
