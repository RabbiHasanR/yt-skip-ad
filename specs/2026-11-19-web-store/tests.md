# Phase 5 — Web Store: Tests

## 1. Groundwork

Behaviours: none · Branch: phase-5-web-store

No test rows. Docs fetched with `ctx7`:

- Manifest `content_security_policy`: `extension_pages` covers the popup and
  any extension page; it can be tightened, never relaxed below the minimum.
- `web_accessible_resources` → `use_dynamic_url`: resources only through a
  per-session dynamic ID. The docs don't say what `runtime.getURL()`
  returns; the e2e trial showed it is the static URL, so every e2e test
  failed (the loader's `import()` was blocked). Dropped.
- Manifest `key`: the store assigns its own; its public key is shown in the
  dashboard's Package tab. The store zip leaves `key` out.
- Manifest `description`: at most 132 characters.

## 2. Local-only settings

Behaviours: B1–B5 · Branch: phase-5-web-store

| #   | Behaviour | Level       | File                                       | Test name                                                                 | Status |
| --- | --------- | ----------- | ------------------------------------------ | ------------------------------------------------------------------------- | ------ |
| T1  | B1        | acceptance  | tests/unit/storage.test.js                 | keeps the settings in local storage, never in sync                        | ✅     |
| T2  | B2        | unit        | tests/unit/storage.test.js                 | moves the settings a 1.0.0 install kept in sync to local storage, once    | ✅     |
| T3  | B3        | unit        | tests/unit/storage.test.js                 | never lets an old sync value overwrite a setting already in local storage | ✅     |
| T4  | B4        | unit        | tests/unit/storage.test.js                 | writes nothing to storage when a fresh install reads its settings         | ✅     |
| T5  | B5        | unit        | tests/unit/storage.test.js (existing)      | does not tell settings listeners about a skip counter change              | ✅     |
| —   | B5        | integration | tests/integration/content-settings.test.js | existing live-settings tests, now writing to `local`                      | ✅     |
| —   | —         | unit        | tests/unit/sanity.test.js                  | the storage mock returns only the stored keys when asked for a list       | ✅     |

Notes: T4 passed before the change; it guards the move against writing on a
fresh install. T5 was green before; with the counter and settings now in one
area, it was shown to fail when the new key filter is removed.

## 3. Network lock and homepage

Behaviours: B6, B7 · Branch: phase-5-web-store

| #   | Behaviour | Level       | File                                          | Test name                                                  | Status |
| --- | --------- | ----------- | --------------------------------------------- | ---------------------------------------------------------- | ------ |
| T6  | B6        | acceptance  | tests/integration/manifest.test.js            | blocks network connections from the extension's pages      | ✅     |
| T7  | B6        | e2e         | tests/e2e/network-lock.spec.js                | Chrome blocks a network request from the extension's popup | ✅     |
| T8  | B7        | integration | tests/integration/manifest.test.js            | names its public source code as its homepage               | ✅     |
| T9  | —         | integration | tests/integration/manifest.test.js            | has a description that fits the Chrome Web Store summary   | ✅     |
| —   | B7        | integration | tests/integration/manifest.test.js (existing) | asks only for storage and YouTube host access              | ✅     |

Notes: T7 was seen failing with the CSP removed from `manifest.json`. T9
passed when added; it guards the store's limit.

## 4. Store zip

Behaviours: B8, B9 · Branch: phase-5-web-store

| #   | Behaviour | Level       | File                              | Test name                                                           | Status |
| --- | --------- | ----------- | --------------------------------- | ------------------------------------------------------------------- | ------ |
| T10 | B8        | acceptance  | tests/integration/package.test.js | builds the store zip with the same files and a manifest without key | ✅     |
| T11 | B9        | integration | tests/integration/package.test.js | keeps the key in the dist zip for colleagues                        | ✅     |
| T12 | B8        | integration | tests/integration/package.test.js | npm run package:store writes the store zip from the command line    | ✅     |

Notes: T11 passed before the change; it guards the colleague zip.

## 5. Privacy line

Behaviours: B10, B11 · Branch: phase-5-web-store

| #   | Behaviour | Level       | File                                    | Test name                                                                     | Status |
| --- | --------- | ----------- | --------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| T13 | B10       | acceptance  | tests/integration/popup-privacy.test.js | says no data is collected and links to the privacy policy and the source      | ✅     |
| T14 | B10       | integration | tests/integration/popup-privacy.test.js | opens the %s link in a new tab, without giving it the popup (Privacy, Source) | ✅     |
| —   | B11       | manual      | validation.md manual check 6            | width, themes and focus are checked by eye (screenshots taken in Chromium)    | ➖     |

## B12

Covered by the existing ESLint network ban on `src/` and `popup/`, T6–T7,
and manual check 8.
