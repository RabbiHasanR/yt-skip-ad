# Phase 4 — MVP: Plan

Branch: `phase-4-mvp`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time.

Per-behaviour gate: `npm test`, `npm run lint`, `npm run typecheck`, and
`npm run format:check` are green, then a conventional commit with no
Co-Authored-By or AI attribution lines.

## 1. Groundwork

- Fetch current docs with `ctx7`: the manifest `key` field and how Chrome
  derives an extension ID from it, Playwright `launchPersistentContext` with
  `--load-extension`, Node `child_process.execFileSync` and `fs.mkdtemp`,
  Vitest `it.fails`.
- `.gitignore`: add `*.pem`.
- `eslint.config.js`: lint `scripts/**/*.js` with Node globals.
- `jsconfig.json`: include `scripts/` in the type check.
- No `src/shared/constants.js`, `chrome` mock, or player fixture change.

## 2. Stable extension ID (slice 1)

- **Behaviours:** B1–B5.
- **Acceptance:** `tests/integration/manifest.test.js` → "gives the
  extension the same pinned ID from its key, whatever its folder".
- **Storage/selectors:** `manifest.json` gains `"key"`.

Tasks, in build order:

- **Key:** generate a 2048-bit RSA key pair with `openssl`; store the
  `.pem` outside the repo (e.g. `~/.keys/yt-skip-ad.pem`); put the base64
  DER public key in `manifest.json` → `key`.
- **Test helper:** `tests/fixtures/extension-id.js` exports
  `extensionIdFromKey(base64Key)` (SHA-256 of the decoded bytes, first 32
  hex digits mapped 0–f to a–p) and `EXPECTED_EXTENSION_ID`. Tests in
  `tests/integration/manifest.test.js`: the key decodes and gives the pinned
  ID; the manifest still asks only for `storage` and YouTube; no `.pem` file
  is tracked by git.
- **e2e wiring:** `tests/e2e/fixtures.js` uses `extensionIdFromKey` on the
  manifest `key` and drops `unpackedExtensionId(dir)`. The existing e2e
  tests (`auto-skip`, `settings`, `extension-loads`) keep passing, which
  proves Chromium agrees with the derived ID.

## 3. Dist zip (slice 2)

- **Behaviours:** B6–B10.
- **Acceptance:** `tests/integration/package.test.js` → "builds
  dist/yt-skip-ad-<version>.zip containing only the extension files".
- **Storage/selectors:** none.

Tasks, in build order:

- **Tooling:** `scripts/package.js` exports `PACKAGE_FILES`
  (`manifest.json`, `src/`, `popup/`, `icons/`, `README.md`) and
  `packageExtension({ rootDir, outDir })`, returning the zip path; run as a
  script, it packages the repo into `dist/`. It reads the version from
  `manifest.json`, removes an existing zip of that version first, and calls
  `zip` with `execFileSync` (no shell). A missing or failing `zip` throws an
  error naming the cause; the CLI prints it with `[yt-skip-ad]` and exits 1.
  `package.json` gains `"package": "node scripts/package.js"`.
- Tests in `tests/integration/package.test.js`, writing to a temp folder
  (never the real `dist/`), listing entries with `unzip -Z1`: only the
  allowed files; no `tests/`, `node_modules/`, `specs/`, `docs/`, dotfiles,
  or `*.pem`; the name carries the manifest version; a second run replaces
  the zip; a missing `zip` gives the clear error.
- **End to end:** `tests/e2e/install-from-zip.spec.js` → "the extension
  unzipped from the dist zip loads with the pinned ID and skips an ad":
  package into a temp folder, unzip to another temp folder, launch Chromium
  with that folder, open the popup at `EXPECTED_EXTENSION_ID`, and skip the
  fixture ad. This is the phase's one end-to-end test.

## 4. Ready for colleagues (slice 3)

- **Behaviours:** B11–B14.
- **Acceptance:** `tests/integration/manifest.test.js` → "manifest.json and
  package.json have the same version".
- **Storage/selectors:** `manifest.json` → `version` `1.0.0`.

Tasks, in build order:

- **Version:** the version test, then `manifest.json` and `package.json` to
  `1.0.0` (with `package-lock.json` following `npm install`).
- **Docs:** `README.md` per [requirements.md → README for
  colleagues](requirements.md#readme-for-colleagues): install (folder and
  zip), update, upgrading from 0.x, uninstall, privacy, not an ad blocker,
  troubleshooting, status `1.0.0`, and `npm run package` under Develop. The
  README is checked by the clean-profile install, not by tests.

## 5. Verify and document

- Run [validation.md](validation.md), including the manual pass on real
  YouTube and the clean-profile install from the zip.
- Update `specs/tech-stack.md`: **Storage schema** unchanged (no rows to
  move); record decisions under **Decided in Phase 4** (the `key`, where
  the private key lives, the ID helper and pinned ID, `scripts/package.js`
  and its file list, icons final, `DEBUG` deferred, version `1.0.0`); add
  `scripts/` to **Project conventions**; in **Distribution**, note the zip
  needs the system `zip`; remove **Stable extension ID** from **Deferred
  decisions**; in **Known limitations**, replace "settings reset when the
  folder moves" with "upgrading from 0.x resets settings and counter once"
  and add "two copies of the folder share one ID".
- `specs/roadmap.md`: mark Phase 4 `✅ Complete`, link this spec, and add
  the `DEBUG` flag to **Later**.
- `CHANGELOG.md`: add a `1.0.0` entry, including the one-time reset for 0.x
  users.
