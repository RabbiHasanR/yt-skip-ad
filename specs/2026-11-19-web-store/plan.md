# Phase 5 — Web Store: Plan

Branch: `phase-5-web-store`.

Each group is built with outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, seen failing, then red → green → refactor one test at
a time. Per-behaviour gate: `npm test`, `npm run lint`, `npm run typecheck`,
and `npm run format:check` are green.

## 1. Groundwork

- Docs fetched with `ctx7`: manifest `content_security_policy`,
  `web_accessible_resources` → `use_dynamic_url`, manifest `key` and the Web
  Store upload.
- Trial in real Chromium (e2e suite): the CSP keeps every e2e test green;
  `use_dynamic_url: true` makes every e2e test fail (the loader's `import()`
  of `runtime.getURL()` is blocked), so it is dropped.

## 2. Local-only settings (slice 1)

- **Behaviours:** B1–B5.
- **Acceptance:** `tests/unit/storage.test.js` → "keeps the settings in
  local storage, never in sync".
- **Storage:** `enabled`, `delaySec` move to `local`.

Tasks: `src/shared/storage.js` (`getSettings`, `setSettings`,
`watchSettings`, private `moveSettingsFromSync`), `src/shared/constants.js`
comments; existing tests that write the settings to `sync` move to `local`
(`tests/unit/storage.test.js`, `tests/integration/content-settings.test.js`,
`tests/integration/popup-settings.test.js`,
`tests/integration/popup-skip-counter.test.js`, `tests/e2e/settings.spec.js`);
`seedStorage` defaults to `local`.

## 3. Network lock and homepage (slice 2)

- **Behaviours:** B6, B7.
- **Acceptance:** `tests/integration/manifest.test.js` → "blocks network
  connections from the extension's pages".
- **Manifest:** `content_security_policy`, `homepage_url`.

## 4. Store zip (slice 3)

- **Behaviours:** B8, B9.
- **Acceptance:** `tests/integration/package.test.js` → "builds the store
  zip with the same files and a manifest without key".

Tasks: `scripts/package.js` → `packageExtension({ rootDir, outDir, store })`
and a `--store` CLI flag; `package.json` → `"package:store"`.

## 5. Privacy line (slice 4)

- **Behaviours:** B10, B11.
- **Acceptance:** `tests/integration/popup-privacy.test.js` → "says no data
  is collected and links to the privacy policy and the source".

Tasks: `popup/popup.html` footer, `popup/popup.css`.

## 6. Verify and document

- Run `validation.md`.
- `PRIVACY.md`, public `README.md`, `USER-GUIDE.md` (store install),
  `docs/store/listing.md`, store images in `docs/store/`.
- `specs/tech-stack.md`: storage schema rows to `local`, **Decided in Phase
  5**, Principles (no uninstall URL or other network touch), Distribution,
  Known limitations; `specs/mission.md` (public users, store in scope);
  `specs/roadmap.md` (Phase 5); `CHANGELOG.md`; version `1.1.0`.
