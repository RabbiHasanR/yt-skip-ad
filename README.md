# YT Skip Ad

A Chrome extension that clicks YouTube's **Skip** button for you when an ad
becomes skippable. It runs only on YouTube, asks only for `storage` and
YouTube access, and sends nothing off your device.

> **Status: 0.3.0, settings.** Skippable ads are skipped when the Skip
> button appears, including after you move between videos without reloading.
> Unskippable ads play normally. The skip counter comes next; see the
> [roadmap](specs/roadmap.md).

## Use

Click the extension's toolbar icon to open the popup:

- **Auto-skip ads:** untick to stop skipping, tick to start again. If an ad
  is showing its Skip button when you tick it, that ad is skipped.
- **Delay (seconds):** how long to wait after the Skip button appears before
  clicking it, from 0 (at once) to 10. Use the arrows, or type a number and
  press Enter.

Changes apply straight away to open YouTube tabs, with no reload. Settings
are kept by Chrome and follow you to other computers where you're signed in
to Chrome. Moving the extension's folder resets them.

## Install (colleagues)

1. Unzip or copy the folder somewhere permanent. Don't move or delete it
   later: Chrome loads the extension from that folder.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the folder.

**Update:** replace the folder's contents with the new version (same path),
then click the reload icon on the extension's card.

## Develop

Requires Node.js 24+. The extension itself has no build step; Chrome loads
the files in this repo directly. `npm` is only for tests and checks.

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
```

After changing code, click the reload icon on the extension's card in
`chrome://extensions`, then reload the YouTube tab.

### Layout

| Path            | What                                                      |
| --------------- | --------------------------------------------------------- |
| `manifest.json` | Extension manifest (MV3)                                  |
| `src/core/`     | Rules: selectors, ad detection, skipper, settings, timing |
| `src/shared/`   | Constants, settings defaults, and the storage adapter     |
| `src/content/`  | `loader.js` imports `main.js`; `trusted-click.js`         |
| `popup/`        | Toolbar popup: auto-skip toggle and delay                 |
| `icons/`        | 16/48/128 px icons                                        |
| `tests/`        | `unit/`, `integration/`, `e2e/`, `fixtures/`, `setup/`    |
| `specs/`        | Mission, roadmap, tech stack, and per-phase specs         |

**When skipping stops working**, YouTube has most likely renamed a class.
The selectors live in one place, `src/core/selectors.js`.

Work follows test-driven development; see
[specs/tech-stack.md](specs/tech-stack.md#development-workflow-tdd).
