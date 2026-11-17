# Phase 1 — Auto-skip: Plan

Branch: `phase-1-auto-skip`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time.

Per-behaviour gate: `npm test`, `npm run lint`, `npm run typecheck`, and
`npm run format:check` are green, then a conventional commit with no
Co-Authored-By or AI attribution lines.

## 1. Groundwork

- Fetch current docs with `ctx7`: Chrome MV3 content scripts and isolated
  worlds (DOM events from the page), `MutationObserver` options, jsdom
  `getComputedStyle`, Vitest fake timers, and Playwright (loading a Chrome
  extension in a persistent context, headless support, `page.route`).
- `src/shared/constants.js`: `LOG_PREFIX = '[yt-skip-ad]'`; `main.js`
  imports it for its load log.
- `src/core/selectors.js`: `PLAYER_SELECTORS`, `AD_SHOWING_CLASS`,
  `SKIP_BUTTON_SELECTORS`, `NAVIGATE_EVENT`, as agreed at Gate 0.
- `tests/fixtures/player.html`: a minimal player (`#movie_player`, the
  `html5-video-player` class) with an ad slot holding a Skip button. Tests
  toggle `ad-showing` and the button's visibility.
- `tests/fixtures/` helper to load a fixture into jsdom's `document`.
- Playwright: add `@playwright/test` as a devDependency, install its
  Chromium, add `playwright.config.js` (testDir `tests/e2e/`), and set the
  scripts `test:e2e` and `test:all` (Vitest, then Playwright).
- No `chrome` mock changes; this phase uses no new `chrome.*` API.

## 2. Detect and click (slice 1)

- **Behaviours:** B1–B6.
- **Acceptance:** `tests/integration/content-auto-skip.test.js` → "clicks a
  visible Skip button while an ad is showing".
- **Storage/selectors:** `AD_SHOWING_CLASS`, `SKIP_BUTTON_SELECTORS`,
  `PLAYER_SELECTORS` (used, not yet observed).

Tasks, in build order:

- **Core:** `src/core/ad-detection.js` (`isAdShowing(player)`,
  `findSkipButton(player)` with the visibility rule); tests in
  `tests/unit/ad-detection.test.js` against fixture DOM.
- **Core:** `src/core/skipper.js` (arm/disarm; `check(player)` clicks at most
  once per appearance); tests in `tests/unit/skipper.test.js`.
- **Content:** `src/content/main.js` finds the player at load and runs one
  check; tests in `tests/integration/content-auto-skip.test.js` against
  `tests/fixtures/player.html`.

## 3. Follow the player (slice 2)

- **Behaviours:** B7–B12.
- **Acceptance:** `tests/integration/content-follow-player.test.js` → "skips
  an ad that starts after the page has loaded".
- **Storage/selectors:** `NAVIGATE_EVENT`.

Tasks, in build order:

- **Core:** `src/core/throttle.js` (the first call schedules one run after
  `CHECK_THROTTLE_MS`; calls in between are dropped); tests in
  `tests/unit/throttle.test.js` with `vi.useFakeTimers`.
- **Content:** `src/content/main.js` waits for the player with a
  document-level observer, observes the player (subtree, childList,
  `class`/`style`/`hidden`) through the throttle, and re-attaches on
  `yt-navigate-finish` when the player element changed; tests in
  `tests/integration/content-follow-player.test.js`.
- **End to end:** `tests/e2e/auto-skip.spec.js` → "the loaded extension
  clicks the Skip button on a YouTube-like page". Chromium with the unpacked
  extension; `page.route` serves `tests/fixtures/player.html` at
  `https://www.youtube.com/watch?v=fixture` and aborts every other request.

## 4. Verify and document

- Run [validation.md](validation.md), including the manual pass on real
  YouTube.
- Update `specs/tech-stack.md`: record decisions under **Decided in Phase 1**
  (selectors, visibility rule, arm/disarm, throttle, observed target, e2e
  fixture hosting); update the `src/core/` row in **Project conventions** if
  the module list changed; add **Known limitations** (`.click()` and
  `isTrusted`, `opacity`-hidden buttons, embeds and other YouTube hosts not
  covered); replace the "One log per full page load" limitation, now handled
  by `yt-navigate-finish`. The **Storage schema** is unchanged.
- `README.md`: what now works, and the `npm run test:e2e` setup (Chromium
  install).
- `manifest.json` and `package.json` version `0.2.0`, if the build will be
  shared.
- `specs/roadmap.md`: mark Phase 1 `✅ Complete` and link this spec.
- `CHANGELOG.md`: add a `0.2.0` entry.
