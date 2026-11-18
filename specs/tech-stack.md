# YT Skip Ad — Tech Stack

## Principles

- **Minimal permissions** — only `storage` and YouTube hosts; easier to trust
  for colleagues (Rabbi's requirement).
- **No build step for the extension** — the browser loads the source files
  directly; dev tooling exists only for tests and lint (Rabbi's requirement).
- **Test-driven** — every behaviour starts as a failing test (Rabbi's
  requirement). See [Development workflow (TDD)](#development-workflow-tdd).
- **Logic out of the edges** — rules live in plain modules; the content
  script and popup only wire the DOM and `chrome.*` to them.
- **Nothing leaves the device** — no network requests, no analytics
  (colleagues' requirement).
- Popular, well-supported, reliable tools (Rabbi's requirement).

## Recommended framework: none (vanilla JS on Chrome MV3)

We commit to **vanilla JavaScript (ES2020+)** running as a **Chrome Manifest
V3** extension.

Why no framework:

- **Tiny UI** — the popup has three controls; a framework adds weight and a
  build step for no gain (Rabbi's no-build requirement).
- **Easy to debug** — the code that runs is the code in the repo.
- **MV3** — required by current Chrome and the Web Store, if we ever publish.

## Stack summary

| Layer       | Choice                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Language    | JavaScript (ES2020+), JSDoc types                                      |
| Framework   | None — Chrome Extension Manifest V3                                    |
| UI          | Popup: plain HTML + CSS                                                |
| Backend     | None — content script on YouTube pages                                 |
| Data access | Thin adapter over `chrome.storage.sync`                                |
| Database    | `chrome.storage` — `sync`: `enabled`, `delaySec`; `local`: `skipCount` |
| Lint/format | ESLint (flat config) + Prettier                                        |
| Type checks | `tsc --noEmit` with `checkJs` over JSDoc types                         |
| Tests       | Vitest + jsdom (fast); Playwright + Chromium (e2e)                     |

## Storage schema

The living schema for `chrome.storage`. Keys and defaults are defined once,
in `src/shared/constants.js`; only `src/shared/storage.js` reads or writes
them. Changes are agreed first (`/feature-spec` Gate 0), and each row says
which phase built it.

| Key         | Area    | Type    | Default | Valid range    | Written by             | Read by        | Status             |
| ----------- | ------- | ------- | ------- | -------------- | ---------------------- | -------------- | ------------------ |
| `enabled`   | `sync`  | boolean | `true`  | `true`/`false` | popup                  | content, popup | _(Phase 2, built)_ |
| `delaySec`  | `sync`  | integer | `0`     | 0–10           | popup                  | content, popup | _(Phase 2, built)_ |
| `skipCount` | `local` | integer | `0`     | ≥ 0            | content, popup (reset) | popup          | _(Phase 3, built)_ |

Rules:

- A missing or invalid stored value is read as its default; it is never an
  error. Defaults are not written on install.
- _(Phase 2, built)_ Values are cleaned up by `normalizeSettings` in
  `src/core/settings.js`, when read and before written: `enabled` that is
  not a boolean reads as `true`; `delaySec` that is a finite number is
  rounded to a whole number, then clamped to 0–10; any other `delaySec`
  reads as `0`.
- Upgrades never wipe stored values; a renamed key needs a migration step in
  `storage.js`.
- _(Phase 3, built)_ `skipCount` lives in `local`, not `sync`: each device
  keeps its own count, so synced browsers can't overwrite each other's
  counts, and no sync write quota is spent per skip. It is cleaned up by
  `normalizeSkipCount` in `src/core/skip-count.js` (a finite number ≥ 0 is
  rounded down; anything else reads as `0`). The increment is read, add 1,
  write, with no lock, so two tabs skipping at the same moment can lose one
  count.

## Decided in Phase 0

See [the Phase 0 spec](2026-11-17-project-skeleton/requirements.md#decisions).

- **Content-script module loading:** a classic `src/content/loader.js` runs
  `import(chrome.runtime.getURL('src/content/main.js'))`; everything else is
  ES modules — real `import`s, the same files Vitest tests, no build step.
- **`web_accessible_resources`:** `src/**/*.js`, matched to
  `*://*.youtube.com/*` only — one glob means a new module never needs a
  manifest edit; the cost is listed under [Known limitations](#known-limitations).
- **Loader failure:** logged once as `[yt-skip-ad] failed to load content
script` and never thrown at the page.
- **Log prefix:** `[yt-skip-ad]`. The loader can't import, so it repeats the
  prefix; `main.js` imports `LOG_PREFIX` from `src/shared/constants.js`
  (since Phase 1).
- **`chrome` mock:** hand-written in `tests/setup/chrome.js`, rebuilt before
  every test so no calls or state leak — `sinon-chrome` is poorly maintained
  and we need only a few APIs.
- **Tooling modules:** `"type": "module"` in `package.json`; `jsconfig.json`
  drives `tsc` (`checkJs`, `strict`, `maxNodeModuleJsDepth: 0` so it never
  type-checks JavaScript inside `node_modules`).
- **TypeScript 6.0** for `tsc`, not 7.0 — 6.0's JSDoc checking is mature; 7.0
  (the native port) reworked it.
- **Extra dev dependencies:** `@eslint/js` and `globals` (ESLint flat config),
  `@types/chrome` (types for `chrome.*`), `@types/node` (tests read files
  with `node:fs`).
- **Imports, not globals:** tests import `describe`/`it`/`expect` from
  `vitest` explicitly.
- **No network (B8):** enforced by ESLint (`no-restricted-globals` for
  `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`;
  `no-restricted-properties` for `navigator.sendBeacon`) in `src/` and
  `popup/`.
- **Version:** `0.1.0`; `1.0.0` is reserved for the feature-complete v1.

## Decided in Phase 1

See [the Phase 1 spec](2026-11-17-auto-skip/requirements.md#decisions).

- **YouTube DOM contract** (`src/core/selectors.js`): player
  `#movie_player`, then `.html5-video-player`; ad signal `ad-showing` on the
  player; Skip button `.ytp-skip-ad-button`, `.ytp-ad-skip-button-modern`,
  `.ytp-ad-skip-button`, searched inside the player only; navigation event
  `yt-navigate-finish` on `document`.
- **Visibility:** computed style — neither the button nor an ancestor up to
  the player is `display: none`, and the button is not `visibility: hidden`.
  Works in jsdom, where `offsetParent` is always `null` and
  `checkVisibility()` doesn't exist.
- **Click once per appearance:** the skipper disarms after a click and
  re-arms on any check that sees no visible Skip button, so a two-ad pod gets
  two clicks. Each followed player gets a fresh skipper.
- **Throttle:** `CHECK_THROTTLE_MS = 100` in `src/shared/constants.js`; the
  first change of a burst schedules one check, and the pending flag clears
  before the run so changes caused by the click get their own check. Timers,
  not `requestAnimationFrame` (stops in background tabs) or debounce (starves
  while an ad's progress bar keeps changing).
- **Observing:** the player with `subtree`, `childList`, and
  `class`/`style`/`hidden` attributes; while there is no player, a throttled
  document-wide observer waits for one. On `yt-navigate-finish` the player is
  looked up again and re-watched only if the element changed.
- **Content wiring:** `src/content/follow-player.js` exports
  `followPlayer(doc)`, returning `stop()` so integration tests can tear down
  observers and listeners; `main.js` only calls it.
- **End-to-end tests:** `@playwright/test` 1.64.x with its Chromium
  (`npx playwright install chromium`, kept in `~/.cache/ms-playwright`). The
  extension loads into a persistent context (`channel: 'chromium'`, headless).
  Only `http(s)` requests are routed: `https://www.youtube.com/watch?v=fixture`
  serves `tests/fixtures/player.html`, everything else is aborted, and
  `chrome-extension://` loads are left alone (routing them breaks the
  loader's `import()`). Playwright sees content-script `console` output.
- **Scripts:** `npm run test:e2e` is `playwright test`; `npm run test:all` is
  `vitest run && playwright test`.
- **Test helpers:** `tests/fixtures/player.js` drives the fixture with
  YouTube's literal class names, not `selectors.js`, so a typo in a selector
  fails a test instead of agreeing with itself.
- **Trusted click** (added 2026-11-18, after the manual pass showed YouTube
  ignores `.click()` because `event.isTrusted` is `false`):
  `src/content/trusted-click.js` runs in the page's world (`"world": "MAIN"`,
  `"run_at": "document_start"`) and wraps `click` listener functions added
  to a Skip button, so they get a `Proxy` of the real event whose
  `isTrusted` reads `true`. Every other listener is untouched, and
  `removeEventListener` also removes the wrapper. No new permission.
- **Version:** `0.2.1`.

## Decided in Phase 2

See [the Phase 2 spec](2026-11-18-settings/requirements.md#decisions) and
its [tests.md](2026-11-18-settings/tests.md) Gate 2 notes.

- **Settings rules** (`src/core/settings.js`): `normalizeSettings(raw)`
  cleans up values on every read and write; `parseDelayField(text)` reads
  the popup's field, where empty or non-numeric means "save nothing".
- **Storage adapter** (`src/shared/storage.js`): `getSettings()`;
  `setSettings(changes)` cleans up and writes only the keys it is given, so
  saving one setting never resets the other; `watchSettings()` resolves to
  `{ current(), onChange(listener) }`, merging each change through
  `normalizeSettings` (a removed key becomes its default). No area or key
  filter: unknown keys are ignored by the rules, and only `sync` is used.
- **Settings first:** `main.js` uses a top-level `await` to read the
  settings before following the player, so a stored "off" is never ignored
  at page load. `popup.js` uses the same pattern.
- **Settings changes** run the same throttled check as a player change
  (within 100 ms), so turning auto-skip on skips the ad on screen. While
  off, the skipper stays armed, so that button can still be clicked.
- **Delay** lives in the skipper, using the global `setTimeout` /
  `clearTimeout` (as `throttle.js` does), faked with `vi.useFakeTimers()`.
  A delay of 0 clicks right away with no timer. Otherwise one wait per Skip
  button appearance; when it ends, the click happens only if the ad, a
  visible Skip button, and auto-skip are all still there, else the skipper
  re-arms. A check that sees no Skip button calls the wait off, and
  `skipper.stop()` does so when navigation replaces the player. A new delay
  applies from the next appearance.
- **Popup:** native checkbox and number input (`min` 0, `max` 10, `step`
  1); the field shows the cleaned-up delay after saving; an emptied field
  shows the stored delay again, re-read from storage.
- **`chrome` mock:** `storage.sync.get` (defaults-object form), `set`,
  `remove`, and `storage.onChanged`, in memory; change events report
  `{ oldValue?, newValue? }` with the area, and skip values whose JSON did
  not change, as Chrome does. `seedStorage()` in `tests/setup/storage.js`
  stores values before a test.
- **e2e extension ID:** with no service worker, `tests/e2e/fixtures.js`
  works it out as Chrome does: SHA-256 of the folder's real path, first 32
  hex digits mapped 0–f to a–p.
- **Stable extension ID:** still deferred, to Phase 4.
- **Version:** `0.3.0`.

## Decided in Phase 3

See [the Phase 3 spec](2026-11-18-skip-counter/requirements.md#decisions)
and its [tests.md](2026-11-18-skip-counter/tests.md) Gate 2 notes.

- **Counter area:** `skipCount` in `chrome.storage.local`
  (`SKIP_COUNT_KEY`, `DEFAULT_SKIP_COUNT` in `src/shared/constants.js`):
  per device, no cross-device overwrites, no sync quota spent per skip.
- **Clean-up rule** (`src/core/skip-count.js`): `normalizeSkipCount(raw)`
  rounds a finite number ≥ 0 down; anything else reads as `0`.
- **Counting point:** `createSkipper({ getSettings, onSkip })`; the optional
  `onSkip` is called right after each click the skipper makes, never for a
  wait that was called off.
- **Content wiring:** `follow-player.js` passes `countSkip`, which calls
  `incrementSkipCount()` and logs `[yt-skip-ad] failed to save the skip
counter` with `console.error` on failure, never throwing at the page.
- **Storage adapter** (`src/shared/storage.js`): `getSkipCount()`,
  `incrementSkipCount()` (read, add 1, write; no lock), `resetSkipCount()`,
  `watchSkipCount(listener)` (only `local` changes that include
  `skipCount`). `watchSettings()` now follows only the `sync` area, so a
  counted skip is not a settings change.
- **Popup:** "Ads skipped:" with the count in a labelled `<output>`,
  formatted with `toLocaleString()`; a native `<button type="button">`
  "Reset counter" with no confirmation. The open popup shows each new count,
  including 0 after a reset, through `watchSkipCount`.
- **`chrome` mock:** `storage.local` built by the same `createStorageArea`
  as `sync`, firing `onChanged` with `'local'`; `seedStorage(values, area)`.
  `tests/fixtures/popup.js` → `openPopup()` is the shared popup helper.
- **No e2e test** for the counter; integration tests cover content →
  storage → popup.
- **Version:** `0.4.0`.

## Project conventions

Every phase follows this layout. Update this section when a convention
changes. Approved in Phase 0.

| Directory            | Holds                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `manifest.json`      | Extension manifest                                                   |
| `src/core/`          | Pure logic: selectors, ad detection, skip scheduling, settings rules |
| `src/shared/`        | Constants (storage keys, defaults) and the storage adapter           |
| `src/content/`       | Content script entry: observer and event wiring; page-world scripts  |
| `popup/`             | Popup HTML, CSS, and thin JS wiring                                  |
| `icons/`             | 16/48/128 px icons                                                   |
| `tests/unit/`        | Unit tests for `src/core/` and `src/shared/`                         |
| `tests/integration/` | Content script and popup against fixtures + `chrome` mock            |
| `tests/e2e/`         | Playwright tests with the real extension (slow)                      |
| `tests/fixtures/`    | HTML fixtures that mimic the YouTube player DOM                      |
| `tests/setup/`       | `chrome` API mock and shared test setup                              |
| `specs/`             | Mission, roadmap, tech stack, and per-phase specs                    |
| `docs/`              | Background docs (original plan)                                      |

Rules:

- New logic goes in `src/core/`; its test goes in `tests/unit/` with the same
  file name plus `.test.js`.
- Dependency direction: `content/` and `popup/` → `core/` and `shared/`;
  `core/` imports nothing from `chrome.*` or the DOM globals beyond what it is
  given.
- Only `src/shared/storage.js` touches `chrome.storage`.
- Storage keys and defaults are defined once, in `src/shared/constants.js`.
- YouTube selectors are defined once, in `src/core/selectors.js`. One
  exception: `src/content/trusted-click.js` runs in the page's world, where
  it can't import, so it repeats the Skip-button selectors; a test fails if
  the two lists drift.
- Page-world (`"world": "MAIN"`) scripts are classic scripts with no imports
  and no `chrome.*` calls, which don't exist there.
- Naming: kebab-case file names, camelCase functions and variables,
  UPPER_SNAKE_CASE constants (standard JS style, matching `chrome.*` APIs).
- No secrets exist in this project; if one ever appears, it comes from env
  vars and is never committed.

## Validation

Vitest tests are how we validate every change. Work isn't done until they
pass.

- `npm test` runs the fast suite (unit + integration) once. Use it before
  committing.
- `npm run test:watch` re-runs tests as you edit.
- `npm run test:e2e` runs the slow Playwright tests.
- Each phase's acceptance criteria are written as tests in `tests/`.
- Run `npm run lint`, `npm run format:check`, and `npm run typecheck`
  alongside the tests.
- Real YouTube ads can't be reproduced in tests, so each release also gets a
  manual pass on youtube.com: pre-roll, mid-roll, two-ad pod, unskippable ad,
  toggle off, delay 3 s, 5+ navigations, home page and Shorts, logged in and
  out, popup reopen.
- CI is deferred (see [Deferred decisions](#deferred-decisions)).

## Development workflow (TDD)

We follow **outside-in TDD**. Per feature: sketch the design, list the
behaviours as plain sentences and confirm them, write one failing
**acceptance test** at the public boundary and mark it `it.fails(...)`, then
for each behaviour run **red → green → refactor** with one unit test at a
time. Remove the `it.fails` mark when the acceptance test passes, then add one
e2e test for the main journey.

Rules:

- No behaviour without a failing test that requires it; see it fail first.
- Write the minimum code to pass; refactor only on green.
- Test behaviour through public entry points, never private helpers.
- One behaviour, one test; every test independent and order-free.
- Never delete, skip, or loosen a failing test to get green; ask first.
- Mock only external things: `chrome.*` APIs, timers, and the YouTube DOM
  (via fixtures). Never mock the project's own modules.
- Test names describe the behaviour; bodies follow GIVEN / WHEN / THEN.
- Coverage is a guide: below ~70%, look for untested behaviour.
- Bug fix: first a failing test that reproduces it; it stays as a regression
  test.

Project settings:

| Setting                   | Value                                                           |
| ------------------------- | --------------------------------------------------------------- |
| System type               | Browser extension (Chrome MV3)                                  |
| Language and framework    | Vanilla JS (ES2020+), no framework                              |
| Test framework            | Vitest + jsdom; Playwright for e2e                              |
| Fast tests                | `npm test`                                                      |
| All tests, including e2e  | `npm run test:all`                                              |
| Coverage                  | `npm run coverage` (`@vitest/coverage-v8`)                      |
| Lint and type checks      | `npm run lint && npm run typecheck`                             |
| Fast-test time budget     | Under 10 seconds                                                |
| Where tests live          | `tests/unit/`, `tests/integration/`, `tests/e2e/`               |
| Slow-test marker          | Lives in `tests/e2e/`; excluded from `npm test`                 |
| Expected-failure marker   | `it.fails(...)`                                                 |
| Test environment          | jsdom + HTML fixtures + `chrome` mock in `tests/setup/`         |
| External services to mock | `chrome.storage`, `chrome.runtime`, timers (`vi.useFakeTimers`) |

Test levels for this project:

| Level       | What it checks                                                  |
| ----------- | --------------------------------------------------------------- |
| Unit        | `src/core/` and `src/shared/` logic, no DOM wiring              |
| Integration | Content script or popup on a fixture DOM with the `chrome` mock |
| End-to-end  | Real extension in Chromium on a local fixture page (slow)       |

## Popup UI standard

The popup is a fixed-size Chrome popup, not a page that reflows, so the full
responsive standard does not apply. Instead:

- **Width:** fixed at about 280px; content never scrolls horizontally.
- **Themes:** light and dark via `prefers-color-scheme`.
- **Controls:** native `<input type="checkbox">`, `<input type="number">`, and
  `<button>`, each with a visible `<label>`.
- **Keyboard:** every control reachable and usable with Tab, Space, Enter.
- **Feedback:** changes are saved on `change` (a checkbox toggle, a
  spinner click, Enter, or leaving the field); no separate "Save" button.
- **Verification:** checked by eye in light and dark mode on each phase with
  popup changes.

## Distribution

v1 is shared with office colleagues directly, not through the Web Store.
Office machines use regular (unmanaged) Chrome, so "Load unpacked" works.

- **Channels:** a shared directory, or a **dist zip** sent over WhatsApp.
- **Dist zip:** `npm run package` builds `dist/yt-skip-ad-<version>.zip` with
  only the extension files (`manifest.json`, `src/`, `popup/`, `icons/`,
  `README.md`) — no `tests/`, `node_modules/`, `specs/`, or `docs/`.
- **Install:** unzip to a permanent folder → `chrome://extensions` →
  Developer mode on → "Load unpacked" → pick the folder.
- **Update:** replace the folder contents with the new version (same folder
  path) → click the reload icon on the extension card.
- **Versioning:** bump `version` in `manifest.json` for every shared build so
  colleagues can tell which one they have.

## Known limitations

- **Updates:** unpacked extensions never auto-update; each colleague must
  replace the folder and reload by hand.
- **Folder must stay put:** deleting or moving the unpacked folder breaks the
  extension; moving it may also reset settings and the counter, because the
  extension ID comes from the folder path.
- **Detectable on YouTube:** the modules in `src/` are web-accessible to
  YouTube pages, so a page could tell the extension is installed by fetching
  one. Nothing sensitive is exposed.
- **One log per full page load:** YouTube's in-page navigation doesn't re-run
  content scripts, so the load log appears once; auto-skip itself follows
  navigation through `yt-navigate-finish`.
- **Trusted click depends on YouTube:** the trusted-click script only sees
  click listeners added directly to the Skip button, after it already has
  its class. If YouTube moves its handler to a parent element, adds the
  class later, or checks more than `isTrusted`, skipping stops working
  again. The script shares YouTube's JavaScript world, so YouTube can also
  detect or undo it.
- **Opacity-hidden buttons:** the visibility rule doesn't see `opacity: 0`.
  If YouTube hides the countdown button that way, the click comes early and
  may be ignored (manual check 10 watches for this).
- **Not covered:** players embedded on other sites (`all_frames` is off),
  `youtube-nocookie.com`; YouTube Music and `m.youtube.com` match the host
  permission but are untested.
- **Selectors break:** YouTube renames classes from time to time; fixes go in
  `src/core/selectors.js`.

- **Settings reset when the folder moves:** the extension ID comes from the
  folder path, and settings belong to the ID, until the stable ID is decided
  (Phase 4).
- **Settings follow Chrome Sync:** `chrome.storage.sync` copies the two
  settings to the colleague's other signed-in Chrome browsers. The
  extension itself still makes no network requests.
- **Delay timing:** the delay counts from the throttled check, so the click
  comes up to 100 ms after "N seconds after the Skip button appears". A
  button hidden and shown again within one 100 ms window is not seen as a
  new appearance, so the first wait carries on.
- **A skip can be lost between tabs:** the counter is read, increased, and
  written with no lock, so two YouTube tabs skipping at the same moment can
  count one skip instead of two.
- **Counter is per computer:** `skipCount` is in `chrome.storage.local`, so
  each computer counts its own skips; Chrome Sync doesn't merge them.
- **Counts clicks made:** a skip is counted when the extension clicks Skip;
  whether YouTube accepted the click can't be seen.
- **Open popup doesn't refresh:** if the settings change elsewhere (another
  computer through Chrome Sync) while the popup is open, it shows the old
  values until reopened. The skip counter does update live.

## Deferred decisions

- **CI:** lint, format check, type check, and tests on every push. The repo
  now has a remote, but it is a self-hosted git server, not GitHub, so
  GitHub Actions needs a compatible runner there; still to decide.
- **Stable extension ID:** whether to add a `key` to `manifest.json` so the
  ID (and stored settings) survive moving the folder.
- **Public Web Store release:** not planned for v1.
