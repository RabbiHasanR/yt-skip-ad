# Contributing to Skip Ad for YouTube

Thanks for helping! This guide says how changes get in, and the few rules
that never bend.

## The promise that never changes

The extension **collects no data and makes no network requests**. A change
that needs either can't be merged, however useful. Also never merged:

- a new permission in `manifest.json`, unless agreed in an issue first;
- analytics, remote config, or code loaded from anywhere but the extension;
- a build step for the extension itself: Chrome runs the files in this repo
  as they are.

## How a change gets in

Only the maintainer can merge, and `main` takes changes only through pull
requests. Everyone else works in a
fork and opens a pull request.

1. **Open an issue first** for anything bigger than a typo, so we agree on
   the idea before you spend time on it. Use the
   [issue forms](https://github.com/RabbiHasanR/yt-skip-ad/issues/new/choose).
   For "ads aren't skipped any more", the report is often enough.
2. **Fork** the repo and create a branch from `main`, e.g.
   `fix/skip-button-selector`.
3. **Set up:** Node.js 24+, then:

   ```sh
   npm ci
   npx playwright install chromium   # once, for the end-to-end tests
   ```

4. **Write a failing test first**, then the code that makes it pass. Every
   behaviour in this project is test-driven; see
   [tech-stack.md → Development workflow (TDD)](specs/tech-stack.md#development-workflow-tdd).
5. **Run every check** before pushing:

   ```sh
   npm run test:all && npm run lint && npm run typecheck && npm run format:check
   ```

6. **Try it in real Chrome:** load the folder with "Load unpacked" in
   `chrome://extensions` and check your change on youtube.com.
7. **Open a pull request** to `main` and fill in its checklist.
8. **CI must pass.** GitHub Actions runs the same checks (`checks`) and the
   end-to-end tests (`e2e`) on your pull request; it can be merged only
   when both are green. A change to docs only (Markdown, `docs/`, `specs/`)
   runs just the format check. A first-time contributor's run starts once
   the maintainer approves it.

## Where things live

- `src/core/`: the rules, as plain functions. Logic goes here.
- `src/core/selectors.js`: **every YouTube selector**. When YouTube renames
  a class and skipping stops, the fix is usually here.
- `src/shared/constants.js`: storage keys, defaults, and limits. Only
  `src/shared/storage.js` touches `chrome.storage`.
- `src/content/`, `popup/`, `src/background/`: only wire the page, the
  popup, and `chrome.*` to the rules.
- `tests/`: `unit/`, `integration/`, `e2e/`, with fixtures in
  `tests/fixtures/`.

## Style

- Vanilla JavaScript with JSDoc types; ESLint and Prettier decide the rest
  (`npm run format` fixes formatting).
- Small functions with one job; no copied logic.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `fix(content): click the new Skip button`, `docs(readme): …`,
  `test(popup): …`.

## License

By contributing, you agree that your contribution is licensed under the
repo's [MIT License](LICENSE).
