# YT Skip Ad

A Chrome extension that clicks YouTube's **Skip** button for you when an ad
becomes skippable. It runs only on YouTube, asks only for `storage` and
YouTube access, and sends nothing off your computer.

It is **not an ad blocker**: ads still start, and unskippable ads play to
the end. It only clicks "Skip" so you don't have to.

> **Status: 1.0.0.** Skippable ads are skipped when the Skip button appears,
> including as you move between videos. The popup lets you turn it off, set a
> delay, and see how many ads were skipped.

## Install

You need desktop Chrome. You get the extension in one of two ways:

- **From WhatsApp:** a file named `yt-skip-ad-<version>.zip`.
- **From the shared folder:** the same zip, or a folder already unzipped.

Then:

1. **Make a permanent home for it.** Create a folder that you won't move or
   delete, for example `Documents/yt-skip-ad`. Chrome runs the extension
   from this folder every time it starts.
2. **Put the files there.** Unzip the zip into that folder (or copy the
   unzipped files into it). Check that `manifest.json` sits directly inside
   it, next to the `src`, `popup` and `icons` folders.
3. Open `chrome://extensions` in Chrome's address bar.
4. Turn on **Developer mode** (switch at the top right).
5. Click **Load unpacked** and choose the folder from step 1, the one that
   contains `manifest.json`.
6. **YT Skip Ad 1.0.0** appears in the list. Click the puzzle-piece icon in
   Chrome's toolbar and pin it, so its icon is always visible.

Open any YouTube video: when an ad shows its Skip button, the extension
clicks it.

## Use

Click the extension's toolbar icon to open the popup:

- **Auto-skip ads:** untick to stop skipping, tick to start again. If an ad
  is showing its Skip button when you tick it, that ad is skipped.
- **Delay (seconds):** how long to wait after the Skip button appears before
  clicking it, from 0 (at once) to 10. Use the arrows, or type a number and
  press Enter.
- **Ads skipped:** how many ads the extension has skipped on this computer.
  It goes up while the popup is open. **Reset counter** sets it back to 0
  at once, with no confirmation.

Changes apply straight away to open YouTube tabs; there's nothing to reload.

## Update

1. Delete the old files inside your extension folder, and put the new
   version's files in the **same folder** (same steps as installing).
2. Open `chrome://extensions` and click the round **reload** arrow on the
   YT Skip Ad card. The card shows the new version number.

Your settings and skip counter are kept.

**Upgrading from a 0.x version** (before 1.0.0): click **Remove** on the old
YT Skip Ad card first, then follow [Install](#install). This one time, your
settings and skip counter start again from the defaults (on, no delay,
counter 0). From 1.0.0 on, updates keep them.

## Uninstall

1. Open `chrome://extensions` and click **Remove** on the YT Skip Ad card.
2. Delete the extension folder.

Removing the extension also deletes its settings and skip counter.

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
| `scripts/`      | Dev tooling: `package.js` builds the dist zip                         |
| `tests/`        | `unit/`, `integration/`, `e2e/`, `fixtures/`, `setup/`                |
| `specs/`        | Mission, roadmap, tech stack, and per-phase specs                     |

**When skipping stops working**, YouTube has most likely renamed a class.
The selectors live in one place, `src/core/selectors.js`.

Work follows test-driven development; see
[specs/tech-stack.md](specs/tech-stack.md#development-workflow-tdd).
