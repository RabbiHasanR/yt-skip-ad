# Phase 5 — Web Store: Requirements

## Context

Phase 5 follows the [roadmap](../roadmap.md)'s Phase 4 (MVP, 1.0.0), which
made the extension ready for office colleagues through a dist zip and "Load
unpacked". This phase prepares a **public Chrome Web Store release**, which
the roadmap listed under **Later** and the [mission](../mission.md) kept out
of v1 scope; Rabbi has now put it in scope.

The release is marketed on one promise: **the extension collects no data**.
Every item in this phase makes that promise either truer (nothing leaves the
device, not even through Chrome Sync), enforced (the browser blocks network
access from the extension's pages), or checkable by the user (open source,
a plain privacy policy, a "check it yourself" guide, the store's own privacy
label). See [tech-stack.md](../tech-stack.md) for the principles and storage
schema.

## Scope

**In scope**

- `[core]` **Local-only settings:** `enabled` and `delaySec` move from
  `chrome.storage.sync` to `chrome.storage.local`, with a one-time move of
  values a 1.0.0 install stored in `sync`.
- `[manifest]` **Network lock:** a `content_security_policy` for extension
  pages that blocks every network connection (`connect-src 'none'`) and
  loading anything not bundled.
- `[manifest]` **Homepage:** `homepage_url` points at the public source
  repo.
- `[scripts]` **Store zip:** `npm run package:store` builds the zip to upload
  to the Web Store: the same files as the dist zip, with `key` removed from
  `manifest.json`.
- `[popup]` **Privacy line:** "No data collected" with links to the privacy
  policy and the source code, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- **Docs:** `PRIVACY.md` (privacy policy, "check it yourself" steps, never-sell
  pledge), a public `README.md`, store listing text and privacy-practices
  answers in `docs/store/listing.md`, and store images in `docs/store/`.

**Out of scope**

- `use_dynamic_url` on `web_accessible_resources`: tried, and it breaks the
  content-script loader (see Decisions). The "detectable on YouTube" known
  limitation stays.
- A new icon: the current one is still red with a play-style glyph; a
  trademark-safe icon is a separate change.
- Publishing itself (developer account, upload, review), which happens in
  the dashboard, and making the GitHub repo public.
- Translations (`_locales/`), a toolbar badge, an uninstall survey, ratings
  prompts, or any other feature that would touch the network.

## Features

### Local-only settings

- `getSettings`, `setSettings` and `watchSettings` use `chrome.storage.local`.
- **One-time move:** before reading the settings, `storage.js` reads
  `enabled` and `delaySec` from `sync`. If any is there, it copies them to
  `local` (only keys `local` doesn't have yet, so a newer local value wins)
  and removes them from `sync`. Removing them also removes Chrome Sync's
  copy. When `sync` holds nothing, nothing is written.
- `watchSettings` follows only `local` changes that include a setting key,
  so a counted skip (`skipCount`, also in `local`) is still not a settings
  change.
- The skip counter is unchanged: `skipCount` in `local`.

### Network lock

- `content_security_policy.extension_pages`:
  `default-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`.
- It covers the popup (and any future extension page). Content scripts follow
  the page's rules, not this policy; they stay covered by the ESLint network
  ban, which already exists since Phase 0.

### Store zip

- `packageExtension({ rootDir, outDir, store })`: with `store: true`, it
  writes `yt-skip-ad-<version>-store.zip`, whose `manifest.json` is the
  repo's minus `key`. Everything else matches the dist zip.
- `npm run package:store` runs `node scripts/package.js --store`.
- The dist zip for colleagues is unchanged and keeps the `key`.

### Privacy line

- Below the skip counter, a footer: "🔒 No data collected ·
  [Privacy](PRIVACY.md) · [Source](repo)", the links opening in a new tab
  (`target="_blank"`, `rel="noopener"`).
- Link targets are built on `manifest.json` → `homepage_url`, so the repo URL
  lives in one place in the manifest and a test keeps the popup in line with
  it.
- Readable in light and dark mode at the fixed width; links are reachable
  with Tab and have the visible focus ring.

## Storage and selectors

No selector, DOM signal, or permission change. `storage` already covers the
`local` area.

| Key        | Area    | Type    | Default | Valid range    | Written by | Why                                               |
| ---------- | ------- | ------- | ------- | -------------- | ---------- | ------------------------------------------------- |
| `enabled`  | `local` | boolean | `true`  | `true`/`false` | popup      | Was `sync`; local means nothing leaves the device |
| `delaySec` | `local` | integer | `0`     | 0–10           | popup      | Was `sync`; same reason                           |

Manifest changes: `content_security_policy` (network lock), `homepage_url`
(the source). The store zip drops `key`.

**Contested choices:**

- **`local` over `sync`:** "nothing leaves your computer" with no footnote.
  Cost: the two settings no longer follow the user to another computer.
- **Move, not just copy:** removing the keys from `sync` also deletes
  Google's synced copy, which matches the promise. Cost: an older 1.0.0
  install on another synced computer loses its settings and falls back to
  the defaults (on, no delay) until it is upgraded.
- **Move on read, no service worker:** `getSettings` runs the move first.
  It costs one extra `sync.get` per read, which returns nothing after the
  first move; a service worker for `runtime.onInstalled` would be a new
  moving part for one migration.

**Upgrade impact:** a 1.0.0 user's two settings are moved to `local` the
first time the popup opens or a YouTube page loads; the skip counter and the
extension ID are kept.

## Decisions

| Decision           | Choice                                                               | Why                                                                                   |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Scope              | Everything in the Web Store plan Rabbi approved                      | Rabbi: "do everything you recommend"                                                  |
| Settings area      | `local`, with a one-time move from `sync`                            | The no-data promise holds without a footnote; upgrades never wipe values              |
| CSP                | `default-src 'self'; connect-src 'none'; object-src 'none'; …`       | The browser, not just our code, blocks network access from extension pages            |
| `use_dynamic_url`  | Not used                                                             | Tried: `runtime.getURL()` returns the static URL, which is then blocked; loader fails |
| Network guard      | Keep the existing ESLint ban; add a manifest test for the CSP        | The source-level ban already exists (Phase 0); a duplicate scan would repeat it       |
| Store zip          | `--store` flag on the existing script, `-store.zip` suffix, no `key` | The store sets its own key; one script, no duplicated zip logic                       |
| Store zip contents | Same files as the dist zip                                           | Anyone can compare the store build with the public repo at that tag                   |
| Privacy links      | GitHub `PRIVACY.md` and repo, from `homepage_url`                    | One copy of the policy; the store dashboard needs a web URL anyway                    |
| Listing text       | `docs/store/listing.md`, versioned with the code                     | Listing and code change together; reviewers see what was claimed                      |
| Name               | "Skip Ad for YouTube" (was "YT Skip Ad")                             | Rabbi's choice; "… for YouTube" names the brand without implying it is Google's       |
| Version            | `1.1.0`                                                              | User-visible change (storage area, popup line), no breaking change                    |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Docs fetched with `ctx7`: manifest `content_security_policy`,
  `web_accessible_resources` → `use_dynamic_url`, manifest `key` and the Web
  Store upload.
- Every behaviour is built test-first, as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd).
- Only `src/shared/storage.js` touches `chrome.storage`; keys and defaults
  live only in `src/shared/constants.js`.
- No new permission. No network requests, no data leaving the device.
- No build step for the extension itself.
