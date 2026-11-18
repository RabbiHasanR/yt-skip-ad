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
