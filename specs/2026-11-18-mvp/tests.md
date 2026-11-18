# Phase 4 — MVP: Tests

## 1. Groundwork

Behaviours: none · Branch: phase-4-mvp

No test rows: config only. Each change is proven by a later group.

| Change                                                  | Proven by                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `.gitignore`: `*.pem`                                   | Group 2 test "no `.pem` file is tracked by git" (B5)         |
| `eslint.config.js`: `scripts/**/*.js`, Node globals     | `npm run lint` over `scripts/package.js` (group 3)           |
| `jsconfig.json`: include `scripts/**/*.js`              | `npm run typecheck` over `scripts/package.js` (group 3)      |
| `vitest.config.js`: coverage includes `scripts/**/*.js` | `npm run coverage` (validation.md: ~70% guide on `scripts/`) |

Docs fetched with `ctx7`:

- Chrome manifest `key`: the docs show only a key copied from the Web Store
  dashboard, not one generated with `openssl`. The group 3 e2e test (the
  unzipped extension loads with the pinned ID in Chromium) proves a local key
  works.
- Node 24 `execFileSync`: a missing program throws with `err.code`
  (`ENOENT`); a non-zero exit throws with `status` and `stderr`. That is how
  B10's missing-`zip` error is told apart.
- Vitest 5: a `// @vitest-environment node` comment switches one file to
  Node; `package.test.js` needs it, since the default environment is jsdom.

## 2. Stable extension ID

Behaviours: B1–B5 · Branch: phase-4-mvp

| #   | Behaviour | Level       | File                                          | Test name                                                                | Status |
| --- | --------- | ----------- | --------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| T1  | B1        | acceptance  | tests/integration/manifest.test.js            | gives the extension the same pinned ID from its key, whatever its folder | ✅     |
| T2  | B5        | integration | tests/integration/manifest.test.js            | its key is a 2048-bit RSA public key, never the private key              | ✅     |
| T3  | B5        | integration | tests/integration/manifest.test.js            | no private key file is tracked by git                                    | ✅     |
| T4  | B1        | e2e         | tests/e2e/settings.spec.js (existing)         | the popup opens at the ID derived from the key                           | ✅     |
| —   | B4        | integration | tests/integration/manifest.test.js (existing) | asks only for storage and YouTube host access (unchanged, stays green)   | ✅     |
| —   | B2, B3    | manual      | validation.md manual checks 3 and 2           | Chrome's storage per extension ID can't be faked in a test               | ➖     |

The private key lives at `~/.keys/yt-skip-ad.pem` (folder 700, file 600),
never in the repo.

## 3. Dist zip

Behaviours: B6–B10 · Branch: phase-4-mvp

| #   | Behaviour | Level       | File                               | Test name                                                                         | Status |
| --- | --------- | ----------- | ---------------------------------- | --------------------------------------------------------------------------------- | ------ |
| T1  | B6, B7    | acceptance  | tests/integration/package.test.js  | builds dist/yt-skip-ad-<version>.zip containing only the extension files          | ✅     |
| T2  | B6        | integration | tests/integration/package.test.js  | names the zip with the version in manifest.json                                   | ✅     |
| T3  | B7, B5    | integration | tests/integration/package.test.js  | leaves out dotfiles and private keys, even inside included folders                | ✅     |
| T4  | B9        | integration | tests/integration/package.test.js  | a second run replaces the zip, so deleted files don't linger in it                | ✅     |
| T5  | B10       | integration | tests/integration/package.test.js  | without zip installed, stops with a clear [yt-skip-ad] message and no zip         | ✅     |
| T6  | B8        | e2e         | tests/e2e/install-from-zip.spec.js | the extension unzipped from the dist zip loads with the pinned ID and skips an ad | ✅     |

Tests write to temp folders, never the real `dist/`; `node scripts/package.js
[outDir]` takes the output folder for that. T5 runs the real script with an
empty `PATH`, so `zip` is genuinely missing (no mocks). T6 overrides the e2e
`extensionDir` fixture with a folder unzipped from a fresh zip.

Notes:

- T1 passed as soon as T2 was green (the repo has no dotfiles or keys
  inside `src/`, `popup/`, or `icons/`), so its `it.fails` mark came off
  then; T3 proves the exclusions with decoys.
- T6 is a guard: it was seen red by temporarily leaving `src` out of
  `PACKAGE_FILES` (Chromium refused to load the folder), then green.
- `jsconfig.json` gained `"ES2022.Error"` in `lib`, for `new Error(message,
{ cause })` (required by ESLint's `preserve-caught-error`).
- Coverage of `scripts/package.js` is ~58%: the missing-`zip` path and the
  CLI run in T5's child process, which v8 coverage doesn't see. The one
  path with no test is an installed `zip` failing for another reason; it
  rethrows `zip`'s own error, printed with the prefix.

## 4. Ready for colleagues

Behaviours: B11–B14 · Branch: phase-4-mvp

| #   | Behaviour | Level      | File                                | Test name                                                                | Status |
| --- | --------- | ---------- | ----------------------------------- | ------------------------------------------------------------------------ | ------ |
| T1  | B14       | acceptance | tests/integration/manifest.test.js  | manifest.json, package.json and package-lock.json have the same version  | ✅     |
| —   | B11–B13   | manual     | validation.md manual checks 4, 6, 7 | README wording is checked by following it on a clean profile, not tested | ➖     |

T1 is a guard: seen red by bumping only `manifest.json`, then green once all
three agree at `1.0.0`. No test pins `1.0.0` itself (manual check 1 does).

README reviewed by Rabbi before commit. It tells colleagues to create the
folder first and check `manifest.json` sits directly inside it, because the
zip has no top-level folder.

User guide (added after group 4, user's request): T1 and T3 of group 3 now
expect `USER-GUIDE.md` in the zip; seen red with the file present but not in
`PACKAGE_FILES`, then green once added.
