# Phase 0 — Project Skeleton: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-0-project-skeleton

| #   | Behaviour | Level | File                      | Test name                                      | Status |
| --- | --------- | ----- | ------------------------- | ---------------------------------------------- | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js | runs in a jsdom environment with a document    | ✅     |
| T2  | setup     | unit  | tests/unit/sanity.test.js | chrome.runtime.getURL returns an extension URL | ✅     |
| T3  | setup     | unit  | tests/unit/sanity.test.js | chrome mock calls are reset between tests      | ✅     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). Lint, typecheck and format:check are proven by running them green on
the new configs, not by tests. T3 uses two tests in one `describe`, relying on
Vitest running a file's tests in order; it is the only order-dependent test,
by design.

## 2. Loadable extension

Behaviours: B1–B8 · Branch: phase-0-project-skeleton

| #   | Behaviour | Level       | File                                        | Test name                                                     | Status |
| --- | --------- | ----------- | ------------------------------------------- | ------------------------------------------------------------- | ------ |
| T1  | B3        | acceptance  | tests/integration/content-loader.test.js    | loader imports the content entry, which logs once             | ✅     |
| T2  | B1        | integration | tests/integration/manifest.test.js          | asks only for storage and YouTube host access                 | ✅     |
| T3  | B2        | integration | tests/integration/manifest.test.js          | every file the manifest references exists                     | ✅     |
| T4  | B2        | integration | tests/integration/manifest.test.js          | icons are PNGs of their declared size                         | ✅     |
| T5  | B6        | integration | tests/integration/manifest.test.js          | content script and web-accessible modules are YouTube-only    | ✅     |
| T6  | B5        | integration | tests/integration/content-loader.test.js    | logs one prefixed error when the entry fails to load          | ✅     |
| T7  | B7        | integration | tests/integration/popup-placeholder.test.js | popup shows the extension name and a placeholder line         | ✅     |
| T8  | B4        | —           | —                                           | —                                                             | ➖     |
| T9  | B8        | lint        | eslint.config.js                            | `no-restricted-globals` bans network APIs in `src/`, `popup/` | ✅     |

- T8 (B4, no re-log on in-page navigation): no code in this phase listens to
  `yt-navigate-finish`, so a test could never be red. Covered by manual check
  3; Phase 1 tests navigation for real.
- T9 (B8, nothing leaves the device): enforced by a lint rule rather than a
  test, so it guards every future file, not just today's.
- Light/dark popup styling is checked by eye (manual check 5), not tested.
