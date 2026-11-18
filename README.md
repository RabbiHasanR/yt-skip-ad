# YT Skip Ad

A Chrome extension that clicks YouTube's **Skip** button for you when an ad
becomes skippable. It runs only on YouTube, asks only for `storage` and
YouTube access, and sends nothing off your computer.

It is **not an ad blocker**: ads still start, and unskippable ads play to
the end. It only clicks "Skip" so you don't have to.

> **Status: 1.0.0.** Skippable ads are skipped when the Skip button appears,
> including as you move between videos. The popup lets you turn it off, set a
> delay, and see how many ads were skipped.

## Install and use

See the **[User Guide](USER-GUIDE.md)** for how to install, use, update, and
uninstall the extension. It is also inside the zip you receive.

## Privacy

- **No data is collected.** The extension has no account, no analytics, and
  makes no network requests of its own.
- **What it stores, and where:** your two settings (auto-skip on or off, and
  the delay) in Chrome's own extension storage. If you're signed in to
  Chrome with sync turned on, Chrome copies these two settings to your other
  computers, as it does with bookmarks. The skip counter stays on this
  computer only.
- **Why it needs its two permissions:**
  - **Storage:** to remember your settings and the skip counter.
  - **Read and change your data on youtube.com:** to see when an ad's Skip
    button appears on a YouTube page and click it. It does nothing on any
    other site.

## Troubleshooting

- **Ads aren't skipped any more.** Check that **Auto-skip ads** is ticked in
  the popup. If it is, YouTube has most likely changed its page; tell Rabbi,
  and install the fixed version when it arrives.
- **The extension disappeared, or its card shows an error.** The extension
  folder was moved, renamed, or deleted. Put it back, or click **Remove** on
  the card and **Load unpacked** again from the folder's new place; your
  settings and counter are kept.
- **Chrome warns about developer-mode extensions.** Chrome may show this
  notice for any extension installed with "Load unpacked". Keep the
  extension; don't choose to disable or remove it.

## Develop

Requires Node.js 24+ and, to build the zip, the `zip` command (Linux or
macOS). The extension itself has no build step; Chrome loads the files in
this repo directly. `npm` is only for tests, checks, and packaging.

```sh
npm ci
npx playwright install chromium   # once per machine, for end-to-end tests
npm test              # fast tests (unit + integration)
npm run test:e2e      # slow: real Chromium with the extension loaded, offline
npm run test:all      # both
npm run test:watch    # re-run on change
npm run lint          # ESLint
npm run typecheck     # tsc over JSDoc types
npm run format:check  # Prettier (npm run format to fix)
npm run coverage
npm run package       # dist/yt-skip-ad-<version>.zip, extension files only
```

After changing code, click the reload icon on the extension's card in
`chrome://extensions`, then reload the YouTube tab.

**Releasing:** bump `version` in `manifest.json` and run
`npm version <same version> --no-git-tag-version` (a test fails if they
differ), then `npm run package` and share the zip.

**Extension ID:** the `key` in `manifest.json` fixes the ID to
`efdhjhghkcidlflkhipiaijdemjjknbl` wherever the folder lives. Its private
key is kept outside the repo and is only needed to build a `.crx`; never
commit a `.pem` file.

### Layout

| Path            | What                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `manifest.json` | Extension manifest (MV3)                                              |
| `src/core/`     | Rules: selectors, ad detection, skipper, settings, skip count, timing |
| `src/shared/`   | Constants, settings defaults, and the storage adapter                 |
| `src/content/`  | `loader.js` imports `main.js`; `trusted-click.js`                     |
| `popup/`        | Toolbar popup: auto-skip toggle, delay, skip counter                  |
| `icons/`        | 16/48/128 px icons                                                    |
| `USER-GUIDE.md` | Install, use, update, uninstall, for colleagues (also in the zip)     |
| `scripts/`      | Dev tooling: `package.js` builds the dist zip                         |
| `tests/`        | `unit/`, `integration/`, `e2e/`, `fixtures/`, `setup/`                |
| `specs/`        | Mission, roadmap, tech stack, and per-phase specs                     |

**When skipping stops working**, YouTube has most likely renamed a class.
The selectors live in one place, `src/core/selectors.js`.

Work follows test-driven development; see
[specs/tech-stack.md](specs/tech-stack.md#development-workflow-tdd).
