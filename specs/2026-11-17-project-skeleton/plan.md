# Phase 0 — Project Skeleton: Plan

Branch: `phase-0-project-skeleton`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time.

Per-behaviour gate: `npm test`, `npm run lint`, `npm run typecheck`, and
`npm run format:check` are green, then a conventional commit with no
Co-Authored-By or AI attribution lines. The gate starts once group 1 has
created `package.json`.

## 1. Groundwork

- Fetch current docs with `ctx7`: Vitest (config, jsdom environment,
  `it.fails`), ESLint flat config, Prettier, TypeScript `checkJs` /
  `jsconfig.json`, Chrome MV3 manifest, content scripts,
  `web_accessible_resources`, `chrome.runtime.getURL`.
- `package.json` (`"type": "module"`, `private: true`) with scripts: `test`,
  `test:watch`, `test:all`, `coverage`, `lint`, `format`, `format:check`,
  `typecheck`.
- `vitest.config.js`: jsdom environment, `tests/setup/chrome.js` as setup
  file, includes `tests/unit/` and `tests/integration/`, excludes
  `tests/e2e/`.
- `eslint.config.js` (flat config, browser + webextension globals),
  `.prettierrc`, `.prettierignore`, `jsconfig.json` (`checkJs`, `noEmit`).
- `tests/setup/chrome.js`: `globalThis.chrome` mock with
  `runtime.getURL(path)` returning `chrome-extension://test-id/<path>`; reset
  before each test.
- `.gitignore`: `node_modules/`, `coverage/`, `dist/`.
- One trivial passing test, `tests/unit/sanity.test.js`, proving the setup
  runs and `chrome` is mocked.

## 2. Loadable extension (slice 1)

- **Behaviours:** B1–B7.
- **Acceptance:** `tests/integration/content-loader.test.js` →
  "loader imports the content entry, which logs once".
- **Storage/selectors:** none. Manifest entries as agreed at Gate 0 (see
  [requirements.md → Storage and selectors](requirements.md#storage-and-selectors)).

Tasks, in build order:

- **Manifest:** `manifest.json`; test in
  `tests/integration/manifest.test.js` (reads the JSON; checks permissions,
  host permissions, content script, `web_accessible_resources`, and that
  every referenced file exists).
- **Icons:** `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`
  (placeholders); covered by the manifest file-exists test.
- **Content:** `src/content/main.js` (logs once) and
  `src/content/loader.js` (classic script, `import()`s `main.js` via
  `chrome.runtime.getURL`, logs one prefixed error on failure); tests in
  `tests/integration/content-loader.test.js`.
- **Popup:** `popup/popup.html`, `popup/popup.css`; test in
  `tests/integration/popup-placeholder.test.js` (loads the HTML into jsdom,
  checks the name and placeholder text).
- No e2e test this phase; Playwright is out of scope.

## 3. Verify and document

- Run [validation.md](validation.md).
- Update `specs/tech-stack.md`: record decisions under **Decided in Phase 0**
  (module loading, `web_accessible_resources` breadth, `chrome` mock, module
  type); remove **Content-script module loading** from **Deferred
  decisions**; mark **Project conventions** as approved; add a **Known
  limitation** that YouTube pages can detect the extension via its
  web-accessible files.
- Add `README.md` (what it is, install with "Load unpacked", dev scripts).
- `manifest.json` version stays `0.1.0`.
- `specs/roadmap.md`: mark Phase 0 `✅ Complete` and link this spec.
- Add `CHANGELOG.md` with a `0.1.0` entry.
