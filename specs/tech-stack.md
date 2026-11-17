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

| Layer       | Choice                                                     |
| ----------- | ---------------------------------------------------------- |
| Language    | JavaScript (ES2020+), JSDoc types                          |
| Framework   | None — Chrome Extension Manifest V3                        |
| UI          | Popup: plain HTML + CSS                                    |
| Backend     | None — content script on YouTube pages                     |
| Data access | Thin adapter over `chrome.storage.sync`                    |
| Database    | `chrome.storage.sync` (`enabled`, `delaySec`, `skipCount`) |
| Lint/format | ESLint (flat config) + Prettier                            |
| Type checks | `tsc --noEmit` with `checkJs` over JSDoc types             |
| Tests       | Vitest + jsdom (fast); Playwright + Chromium (e2e)         |

## Storage schema

The living schema for `chrome.storage`. Keys and defaults are defined once,
in `src/shared/constants.js`; only `src/shared/storage.js` reads or writes
them. Changes are agreed first (`/feature-spec` Gate 0), and each row says
which phase built it.

| Key         | Area   | Type    | Default | Valid range    | Written by             | Read by        | Status               |
| ----------- | ------ | ------- | ------- | -------------- | ---------------------- | -------------- | -------------------- |
| `enabled`   | `sync` | boolean | `true`  | `true`/`false` | popup                  | content, popup | _(Phase 2, planned)_ |
| `delaySec`  | `sync` | integer | `0`     | 0–10           | popup                  | content, popup | _(Phase 2, planned)_ |
| `skipCount` | `sync` | integer | `0`     | ≥ 0            | content, popup (reset) | popup          | _(Phase 3, planned)_ |

Rules:

- A missing or invalid stored value is read as its default; it is never an
  error.
- `delaySec` is clamped to 0–10 when written and when read.
- Upgrades never wipe stored values; a renamed key needs a migration step in
  `storage.js`.
- _(to confirm in Phase 3)_ `skipCount` in `sync` vs `local`: `sync` write
  quotas (about 120 writes per minute) are far above real ad rates, but two
  YouTube tabs incrementing at once can lose a count.

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
  prefix; `main.js` imports it from `src/shared/constants.js` once that
  exists.
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

## Project conventions

Every phase follows this layout. Update this section when a convention
changes. Approved in Phase 0.

| Directory            | Holds                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `manifest.json`      | Extension manifest                                                   |
| `src/core/`          | Pure logic: selectors, ad detection, skip scheduling, settings rules |
| `src/shared/`        | Constants (storage keys, defaults) and the storage adapter           |
| `src/content/`       | Content script entry: observer and event wiring only                 |
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
- YouTube selectors are defined once, in `src/core/selectors.js`.
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
- **Feedback:** changes apply on input; no separate "Save" button.
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
  content scripts; Phase 1 handles navigation with `yt-navigate-finish`.

## Deferred decisions

- **CI:** GitHub Actions running lint, format check, type check, and tests —
  deferred until the repo has a remote.
- **Stable extension ID:** whether to add a `key` to `manifest.json` so the
  ID (and stored settings) survive moving the folder.
- **Public Web Store release:** not planned for v1.
