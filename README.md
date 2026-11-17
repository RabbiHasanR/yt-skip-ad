# YT Skip Ad

A Chrome extension that clicks YouTube's **Skip** button for you when an ad
becomes skippable. It runs only on YouTube, asks only for `storage` and
YouTube access, and sends nothing off your device.

> **Status: 0.2.0, auto-skip.** Skippable ads are skipped as soon as the Skip
> button appears, including after you move between videos without reloading.
> There are no settings yet: auto-skip is always on, with no delay, and the
> popup is still a placeholder. Unskippable ads play normally. See the
> [roadmap](specs/roadmap.md).

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

| Path            | What                                                       |
| --------------- | ---------------------------------------------------------- |
| `manifest.json` | Extension manifest (MV3)                                   |
| `src/core/`     | Rules: YouTube selectors, ad detection, skipper, throttle  |
| `src/shared/`   | Shared constants                                           |
| `src/content/`  | `loader.js` (classic script) imports `main.js` (ES module) |
| `popup/`        | Toolbar popup                                              |
| `icons/`        | 16/48/128 px icons                                         |
| `tests/`        | `unit/`, `integration/`, `e2e/`, `fixtures/`, `setup/`     |
| `specs/`        | Mission, roadmap, tech stack, and per-phase specs          |

**When skipping stops working**, YouTube has most likely renamed a class.
The selectors live in one place, `src/core/selectors.js`.

Work follows test-driven development; see
[specs/tech-stack.md](specs/tech-stack.md#development-workflow-tdd).
