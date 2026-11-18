# Phase 4 — MVP: Requirements

## Context

Phase 4 is the last v1 phase in the [roadmap](../roadmap.md). Phase 0
delivered a loadable MV3 extension, the dev tooling, and the `chrome` mock.
Phase 1 delivered auto-skip: the content script follows YouTube's player and
clicks a visible **Skip button** once per appearance, made trusted by
`src/content/trusted-click.js`. Phase 2 delivered the **settings** (on/off
and a 0–10 s **delay** in `chrome.storage.sync`), and Phase 3 the **skip
counter** (`skipCount` in `chrome.storage.local`) with a reset in the popup.
Every v1 feature now works, as version 0.4.0.

After this phase, v1 is ready for colleagues: the extension keeps one ID
wherever its folder lives, `npm run package` builds the dist zip shared over
WhatsApp, the README alone gets a colleague from zip to working extension
and explains what is stored and that nothing leaves the device, and the
version is `1.0.0`.

It serves the [mission](../mission.md)'s last unmet promise, "a colleague
installs the extension by following the README alone", and the colleagues'
goal "an install that is easy to follow … with no data leaving their
machine". See [tech-stack.md](../tech-stack.md) for the principles,
[Distribution](../tech-stack.md#distribution), and the
[Deferred decisions](../tech-stack.md#deferred-decisions) this phase
settles, and [PLAN.md §11 and §12](../../docs/PLAN.md) for the original
maintenance notes and publishing checklist.

## Scope

**In scope**

- `[manifest]` **Stable extension ID:** a `key` (public key) in
  `manifest.json`, so the ID, and with it the settings and skip counter,
  no longer depend on the folder path. Settles the deferred decision.
- `[tooling]` **Dist zip:** `npm run package` builds
  `dist/yt-skip-ad-<version>.zip` with only the extension files, as in
  [tech-stack.md → Distribution](../tech-stack.md#distribution).
- `[docs]` **README for colleagues:** install from the shared folder or the
  WhatsApp zip, update, uninstall, upgrading from 0.x, and a privacy note.
- `[manifest]` **Version `1.0.0`** in `manifest.json` and `package.json`.
- **Release check:** the full automated suite, the manual pass on real
  YouTube, and an install from the zip on a clean Chrome profile following
  only the README.

**Out of scope**

- `DEBUG` flag for verbose logging (user's choice; moved to the roadmap's
  **Later** list).
- New icons: the current `icons/` (a red rounded square with a skip glyph
  at 16/48/128 px) are declared final.
- Any popup change; any change to skipping, the delay, or the counter.
- CI (still deferred: the remote is a self-hosted git server, not GitHub).
- A `.crx` build or Chrome Web Store release.
- Building the zip on Windows (the package script uses the system `zip`).

## Features

### Stable extension ID

- `manifest.json` gains `"key"`: the base64 DER (SubjectPublicKeyInfo) of a
  2048-bit RSA public key generated with `openssl`. Chrome derives the ID
  from it: SHA-256 of the key bytes, first 32 hex digits, each mapped 0–f
  to a–p.
- The private key (`.pem`) is kept outside the repo (e.g.
  `~/.keys/yt-skip-ad.pem`) and `*.pem` is added to `.gitignore`. Loading
  unpacked never needs it; it is kept only so a future `.crx` could keep the
  same ID. The public key is not a secret.
- The expected ID is pinned in one test constant; a changed or broken key
  fails `npm test`.
- `tests/e2e/fixtures.js` derives the ID from the manifest `key` instead of
  the folder path, through a shared helper in
  `tests/fixtures/extension-id.js` that the manifest test also uses.
- Edge cases:
  - Moving the folder, or loading it from another path: same ID, settings
    and counter kept.
  - Upgrading a 0.x install (path-based ID): the ID changes once, so the
    settings and counter start again from the defaults (on, delay 0,
    counter 0). The README tells 0.x users to remove the old card, then
    "Load unpacked" again.
  - The same folder loaded twice from two paths: Chrome sees one ID; only
    one copy can be loaded (documented, not handled).
- No new permission and no new install warning.

### Dist zip

- `npm run package` runs `scripts/package.js` (Node, ES module), which:
  - reads `version` from `manifest.json`;
  - writes `dist/yt-skip-ad-<version>.zip`, creating `dist/` if missing and
    replacing an existing zip of the same version (never adding to it);
  - includes only `manifest.json`, `src/`, `popup/`, `icons/`, and
    `README.md`, with paths relative to the repo root, so unzipping gives a
    folder Chrome can load directly;
  - calls the system `zip` with `execFileSync` (no shell, no new
    dependency);
  - prints the zip's path on success; if `zip` is missing or fails, prints
    a clear `[yt-skip-ad]`-prefixed error and exits non-zero.
- The file list is defined once, in `scripts/package.js`, and exported so
  the test checks the same list.
- Never in the zip: `tests/`, `node_modules/`, `specs/`, `docs/`, `dist/`,
  `coverage/`, dotfiles, `*.pem`, `package*.json`.

### README for colleagues

- **Install**, two ways: from the shared folder, or from the WhatsApp zip
  (unzip to a permanent folder → `chrome://extensions` → Developer mode →
  Load unpacked).
- **Update:** replace the folder's contents (same path), click reload on the
  card. **Upgrading from 0.x:** remove the old card, then Load unpacked;
  settings and counter reset once.
- **Uninstall:** Remove on the card, then delete the folder.
- **Privacy:** no data collected; no network requests; settings kept by
  Chrome (and copied by Chrome Sync to the colleague's other signed-in
  browsers); the skip counter kept on this computer only; permissions are
  `storage` and YouTube, and why.
- What it is not: not an ad blocker; unskippable ads still play.
- **Troubleshooting:** skipping stopped (YouTube renamed a class), the
  extension disappeared (folder moved or deleted), and the Developer-mode
  banner Chrome shows at startup.
- Status line updated to `1.0.0`; the developer sections stay, plus
  `npm run package`.

### Version 1.0.0

- `manifest.json` and `package.json` both say `1.0.0`; a test fails if they
  differ.

## Storage and selectors

No storage key, default, selector, DOM signal, permission, content-script,
or `web_accessible_resources` change.

Manifest changes, agreed at Gate 0:

| Change                         | Why                                                                  |
| ------------------------------ | -------------------------------------------------------------------- |
| `"key": "<base64 public key>"` | Chrome derives the ID from it, so it is the same in any folder       |
| `"version": "1.0.0"`           | v1 is ready for colleagues; `package.json` matches, the zip names it |

**Contested choices:**

- **A minimal `npm run package`** over a clean install from a copied folder
  or a hand-typed `zip` command: the README's WhatsApp path gets a zip that
  anyone rebuilds the same way, and a test guards the file list. It shells
  out to the system `zip` (no new dependency); the cost is Linux/macOS only,
  fine while Rabbi is the only builder.
- **Private key kept outside the repo, `*.pem` ignored,** over discarding
  it: loading unpacked never needs it, but a future `.crx` with the same ID
  would.
- **ID derived from the key and pinned in `npm test`,** over pinning only
  in e2e: an accidental key change fails the fast suite, and e2e still
  proves Chromium agrees.

**Upgrade impact:** a colleague on 0.x has a path-based ID. Loading 1.0.0
gives the key-based ID, so the settings and skip counter start again from
the defaults once; from then on they survive moving the folder. Today this
most likely affects only Rabbi; colleagues install 1.0.0 fresh.

## Decisions

| Decision          | Choice                                                                         | Why                                                                       |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Scope             | Stable ID, dist zip, README with privacy note, `1.0.0`, release check          | User's choice; the zip came back in at Gate 0 for the clean-install check |
| `DEBUG` flag      | Out of scope; moved to roadmap **Later**                                       | User's choice                                                             |
| Icons             | Current `icons/` declared final                                                | Already a finished design at 16/48/128 px                                 |
| Slicing           | Code first, docs last: stable ID → package script → README and `1.0.0`         | User's choice; the README describes what was built                        |
| Merge bar         | Automated checks, manual pass on real YouTube, clean-profile install from zip  | User's choice; the roadmap's release check                                |
| Stable ID         | `key` in `manifest.json` now                                                   | User's choice; best done before colleagues install                        |
| Private key       | Outside the repo; `*.pem` in `.gitignore`                                      | Agreed at Gate 0                                                          |
| ID in tests       | Derived from `key` by `tests/fixtures/extension-id.js`; pinned in a test       | Agreed at Gate 0; fast suite catches a key change                         |
| Package script    | `scripts/package.js`, system `zip` via `execFileSync`                          | Agreed at Gate 0; no new dependency, no shell                             |
| Zip file list     | Exported constant in `scripts/package.js`, checked by the test                 | Defined once                                                              |
| `scripts/` folder | New top-level folder for dev tooling; ESLint (Node globals) and `tsc` cover it | Not extension code, so not in `src/`; never in the zip                    |
| Part tags         | `[tooling]` and `[docs]` added for this phase                                  | The phase touches neither core, content, nor popup                        |
| End-to-end test   | `tests/e2e/install-from-zip.spec.js`: unzip to a temp folder, load, check ID   | Proves the zip, the key, and the README's install path together           |
| Version check     | A test that `manifest.json` and `package.json` versions agree                  | The zip name and the card must match                                      |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` before coding for: the Chrome Extensions
  manifest `key` field and how the extension ID is derived, Playwright
  `launchPersistentContext` with `--load-extension`, Node
  `child_process.execFileSync`, and Vitest (`it.fails`, temp directories).
- Every behaviour is built test-first, as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd).
- Logic lives in `src/core/`; `src/content/` and `popup/` only wire the DOM
  and `chrome.*`. This phase adds no extension logic; the package script is
  dev tooling in `scripts/`.
- Only `src/shared/storage.js` touches `chrome.storage`; keys and defaults
  live only in `src/shared/constants.js`; selectors only in
  `src/core/selectors.js`.
- No new permission without the user's agreement.
- No network requests, no data leaving the device.
- No build step for the extension itself: the zip is a copy of the source
  files, never a transformed build.
- The private key is never committed and never in the zip.
