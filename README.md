# YT Skip Ad

A Chrome extension that clicks YouTube's **Skip** button for you when an ad
becomes skippable. It runs only on YouTube, asks only for `storage` and
YouTube access, and sends nothing off your device.

> **Status: 0.1.0, project skeleton.** The extension loads and its popup
> opens, but it doesn't skip ads yet. See the [roadmap](specs/roadmap.md).

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
npm test              # fast tests (unit + integration)
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
| `src/content/`  | `loader.js` (classic script) imports `main.js` (ES module) |
| `popup/`        | Toolbar popup                                              |
| `icons/`        | 16/48/128 px icons                                         |
| `tests/`        | `unit/`, `integration/`, `setup/` (the `chrome` mock)      |
| `specs/`        | Mission, roadmap, tech stack, and per-phase specs          |

Work follows test-driven development; see
[specs/tech-stack.md](specs/tech-stack.md#development-workflow-tdd).
