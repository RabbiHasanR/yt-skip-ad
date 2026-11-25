# Skip Ad for YouTube — Tech Stack

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
  (colleagues' requirement). Since Phase 5 this is the public release's main
  promise, so it also rules out an uninstall URL, "rate us" prompts, remote
  config, and Chrome Sync storage; the extension pages' CSP blocks
  connections (`connect-src 'none'`).
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

| Layer       | Choice                                                                       |
| ----------- | ---------------------------------------------------------------------------- |
| Language    | JavaScript (ES2020+), JSDoc types                                            |
| Framework   | None — Chrome Extension Manifest V3                                          |
| UI          | Popup: plain HTML + CSS                                                      |
| Backend     | None — content script on YouTube pages                                       |
| Data access | Thin adapter over `chrome.storage.local`                                     |
| Database    | `chrome.storage.local`: `enabled`, `delaySec`, `skipCount`, `ratePromptDone` |
| Lint/format | ESLint (flat config) + Prettier                                              |
| Type checks | `tsc --noEmit` with `checkJs` over JSDoc types                               |
| Tests       | Vitest + jsdom (fast); Playwright + Chromium (e2e)                           |
| Packaging   | `npm run package`: system `zip` over the source files, no build              |

## Storage schema

The living schema for `chrome.storage`. Keys and defaults are defined once,
in `src/shared/constants.js`; only `src/shared/storage.js` reads or writes
them. Changes are agreed first (`/feature-spec` Gate 0), and each row says
which phase built it.

| Key              | Area    | Type    | Default | Valid range           | Written by             | Read by        | Status                                                |
| ---------------- | ------- | ------- | ------- | --------------------- | ---------------------- | -------------- | ----------------------------------------------------- |
| `enabled`        | `local` | boolean | `true`  | `true`/`false`        | popup                  | content, popup | _(Phase 5, built)_                                    |
| `delaySec`       | `local` | integer | `0`     | 0–10                  | popup                  | content, popup | _(Phase 5, built)_                                    |
| `skipCount`      | `local` | integer | `0`     | ≥ 0                   | content, popup (reset) | popup          | _(Phase 3, built)_                                    |
| `ratePromptDone` | `local` | boolean | `false` | only `true` is "done" | popup                  | popup, worker  | _(Phase 6, built; Phase 7, planned: worker reads it)_ |

Rules:

- A missing or invalid stored value is read as its default; it is never an
  error. Defaults are not written on install.
- _(Phase 2, built)_ Values are cleaned up by `normalizeSettings` in
  `src/core/settings.js`, when read and before written: `enabled` that is
  not a boolean reads as `true`; `delaySec` that is a finite number is
  rounded to a whole number, then clamped to 0–10; any other `delaySec`
  reads as `0`.
- Upgrades never wipe stored values; a renamed key needs a migration step in
  `storage.js`. One exception, in Phase 4: 1.0.0 added the manifest `key`,
  so a 0.x install gets a new extension ID once and starts again from the
  defaults. Stored values belong to the extension ID.
- _(Phase 5, built)_ `enabled` and `delaySec` moved from `sync` (Phase 2) to
  `local`, so Chrome Sync never copies them. `getSettings()` first moves any
  setting still in `sync` (from 1.0.0) to `local`, keeping a value `local`
  already has, then removes it from `sync`. When `sync` holds no setting,
  nothing is written. `watchSettings()` follows only `local` changes that
  include a setting key, since `skipCount` shares the area.
- _(Phase 3, built)_ `skipCount` lives in `local`, not `sync`: each device
  keeps its own count, so synced browsers can't overwrite each other's
  counts, and no sync write quota is spent per skip. It is cleaned up by
  `normalizeSkipCount` in `src/core/skip-count.js` (a finite number ≥ 0 is
  rounded down; anything else reads as `0`). The increment is read, add 1,
  write, with no lock, so two tabs skipping at the same moment can lose one
  count.
- _(Phase 6, built)_ `ratePromptDone` lives in `local`: `true` once the
  user rated or dismissed the rating prompt; anything else reads as `false`.
  The popup shows the prompt when `skipCount` ≥ `RATE_PROMPT_THRESHOLD` (50)
  and it is not done. Nothing else reads it.
- _(Phase 7, planned)_ `ratePromptDone` keeps its meaning: "Rate it ★" or
  "×" ends every ask for good. The service worker also reads it, and opens
  the popup at 50, then every 100 more, while it is not `true`. No new key
  and no migration. See
  [the Phase 7 spec](2026-11-24-auto-rate-popup/requirements.md#storage-and-selectors).

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

## Decided in Phase 4

See [the Phase 4 spec](2026-11-18-mvp/requirements.md#decisions) and its
[tests.md](2026-11-18-mvp/tests.md) Gate 2 notes.

- **Stable extension ID:** `manifest.json` → `key` holds the base64 DER
  public key of a 2048-bit RSA key generated with `openssl`, so the ID is
  `efdhjhghkcidlflkhipiaijdemjjknbl` wherever the folder lives. Chromium
  accepts a locally generated key (proven by the e2e tests); the Web Store
  dashboard isn't needed.
- **Private key:** kept outside the repo at `~/.keys/yt-skip-ad.pem` (mode
  600), needed only to build a `.crx`; `*.pem` is in `.gitignore`, and a
  test fails if one is tracked by git.
- **ID in tests:** `tests/fixtures/extension-id.js` →
  `extensionIdFromKey(key)` (SHA-256 of the key bytes, first 32 hex digits
  mapped 0–f to a–p) and the pinned `EXPECTED_EXTENSION_ID`. The manifest
  test pins it; the e2e fixtures open the popup at the ID derived from the
  loaded folder's manifest, replacing the old folder-path rule.
- **Dist zip:** `scripts/package.js` exports `PACKAGE_FILES`
  (`manifest.json`, `src`, `popup`, `icons`, `README.md`, `USER-GUIDE.md`)
  and `packageExtension({ rootDir, outDir })`. It runs `zip -r -X -q` with
  `execFileSync` (no shell), excludes `*/.*` and `*.pem` at any depth, and
  deletes an existing zip of the same version first. `npm run package`
  writes `dist/yt-skip-ad-<version>.zip`; `node scripts/package.js <outDir>`
  writes elsewhere (tests use temp folders). A missing `zip` prints
  `[yt-skip-ad] can't build the dist zip: the zip command is not installed`
  and exits 1.
- **`Error` cause:** `jsconfig.json` → `lib` gains `ES2022.Error`, for
  `new Error(message, { cause })`, which ESLint's `preserve-caught-error`
  requires.
- **Package tests:** `tests/integration/package.test.js` runs in Vitest's
  Node environment (`// @vitest-environment node`) against small temp
  projects with decoy files, and reads zips with `unzip -Z1`. Coverage
  can't see the CLI path, which runs in a child process.
- **e2e fixtures:** an `extensionDir` fixture (the repo by default) feeds
  `context` and `extensionId`; `tests/e2e/install-from-zip.spec.js`
  overrides it with a folder unzipped from a fresh zip. The shared steps
  `openYouTubeFixture`, `countTrustedSkipClicks` and `showSkippableAd` live
  in `tests/e2e/fixtures.js`.
- **Versions:** a test fails unless `manifest.json`, `package.json` and
  `package-lock.json` agree. To release: bump `manifest.json`, run
  `npm version <same> --no-git-tag-version`, then `npm run package`.
- **Icons:** the existing 16/48/128 px icons are final.
- **`DEBUG` flag:** not built; moved to the roadmap's **Later** list.
- **Version:** `1.0.0`.

## Decided in Phase 5

See [the Phase 5 spec](2026-11-19-web-store/requirements.md#decisions) and
its [tests.md](2026-11-19-web-store/tests.md).

- **Local-only settings:** see [Storage schema](#storage-schema). The
  `chrome` mock's `get` also takes a list of keys (returns only stored keys),
  and `seedStorage()` defaults to `local`.
- **Network lock:** `content_security_policy.extension_pages` is
  `default-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`.
  A manifest test pins it; `tests/e2e/network-lock.spec.js` proves Chromium
  refuses a popup `fetch` under `connect-src` (listening for
  `securitypolicyviolation`, since the e2e routing aborts requests anyway).
  Content scripts are outside this policy; the ESLint ban covers them.
- **`use_dynamic_url`:** not used. With it, every e2e test fails: the
  loader imports `runtime.getURL()`'s static URL, which it then blocks.
- **Homepage:** `homepage_url` is the GitHub repo; the popup's Privacy and
  Source links are built on it, and a test keeps them in line.
- **Store zip:** `packageExtension({ rootDir, outDir, store })`; `store: true`
  writes `yt-skip-ad-<version>-store.zip`, the same files with `key` removed
  from `manifest.json` (rewritten into the zip from a temp folder).
  `npm run package:store` is `node scripts/package.js --store`.
- **Popup footer:** "🔒 No data collected · Privacy · Source", links in a new
  tab with `rel="noopener"`, muted 12px text, the same focus ring.
- **Description:** a manifest test keeps it within the store's 132
  characters.
- **Docs:** `PRIVACY.md` (policy, "check it yourself", pledge),
  `docs/store/listing.md` (dashboard text and privacy-practices answers),
  store images rendered from `docs/store/src/*.html` with
  `npx playwright screenshot`.
- **Name:** "Skip Ad for YouTube" (was "YT Skip Ad") in `manifest.json`, the
  popup, and the docs; the "… for YouTube" pattern names the brand without
  implying it is Google's. Internal names stay: `yt-skip-ad` zips and npm
  package, the `[yt-skip-ad]` log prefix.
- **Version:** `1.1.0`.

## Decided in Phase 6

See [the Phase 6 spec](2026-11-23-store-rating/requirements.md#decisions)
and its [tests.md](2026-11-23-store-rating/tests.md).

- **Rating prompt:** a card below the skip counter, shown by
  `shouldShowRatePrompt` (`src/core/rate-prompt.js`) when `skipCount` ≥
  `RATE_PROMPT_THRESHOLD` (50) and `ratePromptDone` is not `true`. "Rate it
  ★" or "×" marks it done for good; there are no reminders. It lives only in
  the popup, never on the YouTube page.
- **One source for the store link:** `STORE_REVIEWS_URL` and the threshold
  live in `src/shared/constants.js`; `popup.js` fills every
  `data-store-reviews` link and the threshold text, so the HTML holds
  neither.
- **Footer:** two lines, "🔒 No data collected", then "Privacy · Source ★ ·
  Rate". The ★ is `aria-hidden`; Source's tooltip invites a GitHub star.
  GitHub's star button (an iframe with a live count) is not used: the
  network lock would block it.
- **Popup closing on Rate:** the docs don't say whether a `storage.set`
  started in the click handler finishes once the popup closes; manual check
  4 showed it does, in real Chrome (2026-11-24).
- **Version:** `1.2.0`.

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
| `scripts/`           | Dev tooling run with Node (`package.js`); never in the dist zip      |
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
- `scripts/` is Node dev tooling: linted with Node globals, type-checked,
  and tested in `tests/integration/`; extension code never imports it.
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
- `npm run package` builds the dist zip; each shared build is installed once
  from that zip before it goes out.
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
- **Links:** _(Phase 5–6)_ open in a new tab with `rel="noopener"`, muted
  12px footer text, the same focus ring; decorative symbols are
  `aria-hidden`.
- **Feedback:** changes are saved on `change` (a checkbox toggle, a
  spinner click, Enter, or leaving the field); no separate "Save" button.
- **Verification:** checked by eye in light and dark mode on each phase with
  popup changes.

## Distribution

From 1.1.0 the main channel is the **Chrome Web Store** (public, free): upload
`dist/yt-skip-ad-<version>-store.zip` from `npm run package:store`, with the
listing text in [docs/store/listing.md](../docs/store/listing.md). The store
sets the extension's ID and updates installs itself.

Colleagues can still install the dist zip directly. Office machines use
regular (unmanaged) Chrome, so "Load unpacked" works.

- **Channels:** a shared directory, or a **dist zip** sent over WhatsApp.
- **Dist zip:** `npm run package` builds `dist/yt-skip-ad-<version>.zip` with
  only the extension files (`manifest.json`, `src/`, `popup/`, `icons/`,
  `README.md`, `USER-GUIDE.md`) — no `tests/`, `node_modules/`, `specs/`, `docs/`, dotfiles,
  or keys. It needs the system `zip` (Linux or macOS). The zip has no
  top-level folder, so it is unzipped into a folder made first.
- **Install:** unzip to a permanent folder → `chrome://extensions` →
  Developer mode on → "Load unpacked" → pick the folder.
- **Update:** replace the folder contents with the new version (same folder
  path) → click the reload icon on the extension card. Settings and the
  counter are kept; from 1.0.0 the ID doesn't depend on the path.
- **Versioning:** bump `version` in `manifest.json` for every shared build so
  colleagues can tell which one they have.

## Known limitations

- **Updates:** unpacked extensions never auto-update; each colleague must
  replace the folder and reload by hand.
- **Folder must stay put:** deleting or moving the unpacked folder breaks the
  extension until it is loaded again from the new place. Settings and the
  counter are kept, because the manifest `key` fixes the ID (since 1.0.0).
- **Upgrading from 0.x resets once:** 0.x IDs came from the folder path, so
  the first 1.0.0 install starts from the default settings and a counter of 0. The README tells 0.x users to remove the old card first.
- **One ID for every copy:** two copies of the folder share one ID, so
  Chrome can load only one of them at a time.
- **Zip has no top-level folder:** unzipping without a destination scatters
  the files; the README has colleagues make the folder first.
- **Building the zip needs `zip`:** `npm run package` works on Linux and
  macOS, not on Windows without a `zip` command.
- **Detectable on YouTube:** the modules in `src/` are web-accessible to
  YouTube pages, so a page could tell the extension is installed by fetching
  one. Nothing sensitive is exposed. `use_dynamic_url` would hide them but
  breaks the loader (Phase 5).
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

- **Settings are per computer:** since 1.1.0 they are in
  `chrome.storage.local`, so each computer keeps its own. An older 1.0.0
  install on another synced computer loses its synced settings (back to the
  defaults) once a 1.1.0 install moves them out of `sync`.
- **Store and zip installs are separate:** they have different IDs, so
  settings and the counter don't carry over between them.
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
- **Rating prompt can come late:** it is driven by `skipCount`, so a user
  who resets the counter before ever seeing the prompt sees it only when the
  counter reaches 50 again.
- **Open popup doesn't refresh:** if the settings change elsewhere (another
  popup window) while the popup is open, it shows the old values until
  reopened. The skip counter does update live.

## Deferred decisions

- **CI:** lint, format check, type check, and tests on every push. The repo
  now has a remote, but it is a self-hosted git server, not GitHub, so
  GitHub Actions needs a compatible runner there; still to decide.
- **One ID for store and zip builds:** after the first upload, the store's
  public key (dashboard → Package → View public key) could replace the local
  `key`, so unpacked builds share the store ID. Not needed yet.
- **Sync migration removal:** `moveSettingsFromSync()` can go once no 1.0.0
  installs are left.
