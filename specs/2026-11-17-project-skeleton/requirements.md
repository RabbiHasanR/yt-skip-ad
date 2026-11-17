# Phase 0 — Project Skeleton: Requirements

## Context

Phase 0 is the first phase in the [roadmap](../roadmap.md). Nothing is built
yet; the repo holds only specs and the [original plan](../../docs/PLAN.md).
This phase delivers no user-visible feature. It makes every later phase
possible: an extension a colleague can load with "Load unpacked", and the dev
tooling that the [TDD workflow](../tech-stack.md#development-workflow-tdd)
needs.

It serves the [mission](../mission.md) goals of a small, trustworthy extension
(minimal permissions, nothing leaves the device) that is easy to share with
colleagues. See [tech-stack.md](../tech-stack.md) for the principles and
[PLAN.md §3, §5, §9](../../docs/PLAN.md) for the original folder layout,
manifest, and step 1 of the implementation order.

## Scope

**In scope**

- `[manifest]` `manifest.json` (MV3) with only `storage` and YouTube host
  permissions, and placeholder icons (16/48/128 px).
- Dev tooling: `package.json`, Vitest + jsdom, ESLint (flat config), Prettier,
  `tsc --noEmit` with `checkJs`, the `chrome` API mock in `tests/setup/`, and
  one trivial passing test.
- `[content]` Content-script module loading: a classic loader that
  `import()`s the ES-module entry.
- `[content]` The entry logs once on YouTube pages.
- `[popup]` `popup/popup.html` with a placeholder message, following
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard)
  (fixed width, light/dark themes).

**Out of scope**

- Ad detection and clicking the Skip button (Phase 1).
- Settings, storage keys, and the skip counter (Phases 2–3).
- Playwright e2e tests and the `npm run package` dist zip (added in a later
  phase once there is a journey worth testing end to end).
- CI (deferred until decided; see
  [Deferred decisions](../tech-stack.md#deferred-decisions)).

## Features

### Manifest and icons

- `manifest_version: 3`, `version: 0.1.0`.
- `permissions: ["storage"]`, `host_permissions: ["*://*.youtube.com/*"]`;
  nothing else.
- Icons exist at 16, 48, and 128 px and are referenced from both `icons` and
  `action.default_icon`.

### Dev tooling

- `npm test` runs unit and integration tests once, under 10 s.
- `npm run test:watch`, `npm run coverage`, `npm run lint`,
  `npm run format:check`, `npm run format`, and `npm run typecheck` exist.
- `npm run test:all` exists and, until e2e lands, runs the same suite as
  `npm test`.
- The `chrome` mock provides what the content script and popup touch in this
  phase (`chrome.runtime.getURL`), and is extendable for `chrome.storage`
  later.

### Content-script loading

- `src/content/loader.js` is a classic script. It calls
  `import(chrome.runtime.getURL('src/content/main.js'))`.
- `src/content/main.js` is an ES module and the real entry point. In this
  phase it logs `[yt-skip-ad] content script loaded` once.
- YouTube is a single-page app: in-page navigation (`yt-navigate-finish`)
  does not reload the content script, so the log appears once per full page
  load.
- If the import fails, the loader logs one error with the prefix and does not
  throw on the page.

### Popup placeholder

- `popup/popup.html`, `popup/popup.css` show the extension name and a short
  "Coming soon" line.
- Fixed width of about 280px; light and dark via `prefers-color-scheme`.

## Storage and selectors

No storage keys and no selectors change. Manifest delta agreed at Gate 0:

| Entry                      | Value                                                     | Why                                          |
| -------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `permissions`              | `["storage"]`                                             | Settings and counter from Phase 2            |
| `host_permissions`         | `["*://*.youtube.com/*"]`                                 | YouTube only                                 |
| `content_scripts`          | `src/content/loader.js`, YouTube matches, `document_idle` | Classic loader for ES modules                |
| `web_accessible_resources` | `src/**/*.js`, matches `*://*.youtube.com/*` only         | `import()` needs the modules to be reachable |
| `action.default_popup`     | `popup/popup.html`                                        | Placeholder popup                            |

**Contested choice — `web_accessible_resources` breadth:** the `src/**/*.js`
glob was chosen over listing each file (a forgotten entry breaks loading only
in real Chrome) and over `use_dynamic_url` (newer feature, not needed). Trade
off accepted: a YouTube page could detect that the extension is installed by
fetching one of these files; nothing sensitive is exposed.

## Decisions

| Decision                      | Choice                                                              | Why                                                            |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| Scope                         | Manifest + icons, dev tooling, content log + popup stub             | User's choice; e2e and packaging wait for a real journey       |
| Slicing                       | Tooling first, then the loadable extension                          | User's choice; every commit after group 1 passes the gate      |
| Merge bar                     | Automated checks + manual load in Chrome                            | User's choice; loading in Chrome is the point of Phase 0       |
| Content-script module loading | Classic loader + `import()` of ES modules                           | User's choice; real modules, same files Vitest tests, no build |
| `web_accessible_resources`    | `src/**/*.js`, YouTube only                                         | Agreed at Gate 0 (see above)                                   |
| Entry module                  | `src/content/main.js`                                               | Clear name for the real entry behind the loader                |
| Log prefix                    | `[yt-skip-ad]`                                                      | Easy to filter in DevTools                                     |
| `chrome` mock                 | Hand-written in `tests/setup/chrome.js`                             | `sinon-chrome` is poorly maintained; we need only a few APIs   |
| Module type                   | `"type": "module"` in `package.json`, `jsconfig.json` for `checkJs` | ESM everywhere, JSDoc types without TypeScript files           |
| Version                       | `0.1.0`                                                             | `1.0.0` is reserved for the feature-complete v1                |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` before coding for: Chrome Extensions MV3
  (manifest, content scripts, `web_accessible_resources`,
  `chrome.runtime.getURL`), Vitest, jsdom, ESLint flat config, Prettier, and
  TypeScript `checkJs`.
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
