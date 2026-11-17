# Phase 0 — Project Skeleton: Validation

From a clean checkout: run `npm ci`, then load the folder with "Load
unpacked" in `chrome://extensions`. No colleague has the extension yet, so
there are no existing settings or counter to preserve.

## Behaviours

### Manifest and icons

- B1 — The extension asks only for storage and access to YouTube; Chrome
  shows no other permissions. [manifest]
- B2 — The extension loads in `chrome://extensions` with no errors or
  warnings, and shows its icon in the toolbar. [manifest]

### Content-script loading

- B3 — On a YouTube page, the console shows
  `[yt-skip-ad] content script loaded` exactly once. [content]
- B4 — Moving between videos inside YouTube (no full reload) does not log
  again. [content]
- B5 — If the content entry can't be loaded, one `[yt-skip-ad]` error is
  logged and the page keeps working. [content]
- B6 — On sites other than YouTube, the extension loads nothing. [manifest]
  [content]

### Popup

- B7 — Clicking the toolbar icon opens a popup showing the extension name and
  a placeholder line, readable in both light and dark mode. [popup]

### Privacy

- B8 — Nothing is sent off the device; the extension makes no network
  requests. [content] [popup]

## Automated checks

| Check      | Command                | Pass criteria                                 |
| ---------- | ---------------------- | --------------------------------------------- |
| Fast tests | `npm test`             | All pass, under 10 s                          |
| All tests  | `npm run test:all`     | All pass (same suite as `npm test` until e2e) |
| Lint       | `npm run lint`         | No errors or warnings                         |
| Type check | `npm run typecheck`    | No errors                                     |
| Format     | `npm run format:check` | No files need formatting                      |
| Coverage   | `npm run coverage`     | ~70% guide on `src/`; gaps explained          |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.

## Manual checks

1. Load unpacked in `chrome://extensions`: no errors, and the permissions
   shown are only storage and YouTube (B1, B2).
2. Open a video on youtube.com, then open DevTools: the log appears once (B3).
3. Click through 5+ videos and the home page: no extra logs, no errors (B4).
4. Open a non-YouTube site: no `[yt-skip-ad]` output (B6).
5. Open the popup in light and dark mode: fixed width of about 280px, no
   horizontal scroll, text readable (B7).
6. DevTools Network tab, filtered to the extension: no requests (B8).
7. Chrome Task Manager: the extension's CPU stays near 0% on an idle YouTube
   tab.

## Done means

All checks above pass; `specs/tech-stack.md`, `README.md`,
`specs/roadmap.md`, and `CHANGELOG.md` are updated; no `node_modules/`,
`dist/`, or secrets are committed.
