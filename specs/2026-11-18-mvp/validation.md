# Phase 4 — MVP: Validation

From a clean checkout: run `npm ci` and `npx playwright install chromium`,
then load the folder with "Load unpacked" in `chrome://extensions`. A
colleague installing 1.0.0 fresh starts with the defaults. One who had 0.x
gets a new extension ID once, so their settings and skip counter start
again from the defaults (on, delay 0, counter 0); from 1.0.0 on, they
survive moving the folder.

## Behaviours

### Stable extension ID

- B1 — The extension has the same ID whatever folder it is loaded from.
  [manifest]
- B2 — After moving the folder and loading it again, the settings and the
  skip counter are kept. [manifest]
- B3 — Upgrading from 0.x (remove the old card, Load unpacked) shows no
  errors and starts from the default settings and a counter of 0, as the
  README says. [manifest] [docs]
- B4 — Permissions are still only storage and YouTube; installing shows no
  new warning. [manifest]
- B5 — The private key is never in the repo or the zip. [manifest]
  [tooling]

### Dist zip

- B6 — `npm run package` builds `dist/yt-skip-ad-<version>.zip`, named
  with the version in `manifest.json`. [tooling]
- B7 — The zip contains only `manifest.json`, `src/`, `popup/`, `icons/`,
  and `README.md`; no tests, specs, docs, `node_modules`, dotfiles, or keys.
  [tooling]
- B8 — Unzipped into a new folder, it loads in Chrome with no errors, with
  the same ID, and skips an ad. [tooling] [manifest]
- B9 — Running `npm run package` again replaces the zip of that version; it
  never keeps stale files inside it. [tooling]
- B10 — If `zip` isn't installed, `npm run package` stops with a clear
  `[yt-skip-ad]` message and no zip. [tooling]

### Ready for colleagues

- B11 — A colleague installs the extension from the WhatsApp zip or the
  shared folder by following only the README. [docs]
- B12 — The README explains how to update, how to uninstall, and what
  upgrading from 0.x does. [docs]
- B13 — The README's privacy note says no data is collected, nothing is
  sent off the device, where settings and the counter are kept, and why
  the two permissions are needed. [docs]
- B14 — `chrome://extensions` shows version 1.0.0, and `manifest.json` and
  `package.json` agree. [manifest]

### Regression and privacy

- B15 — Auto-skip, the delay, the toggle, and the skip counter work as in
  0.4.0: no click when auto-skip is off or turned off during the delay;
  invalid stored values fall back to the defaults. [core] [content] [popup]
- B16 — No errors on pages without a player (home page, Shorts, search).
  [content]
- B17 — The extension makes no network requests; nothing is sent off the
  device. [content] [popup]

## Automated checks

| Check      | Command                | Pass criteria                                                                                       |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| Fast tests | `npm test`             | All pass, under 10 s                                                                                |
| All tests  | `npm run test:all`     | Fast tests and every e2e test (`auto-skip`, `settings`, `extension-loads`, `install-from-zip`) pass |
| Lint       | `npm run lint`         | No errors or warnings (includes the network ban on `src/` and `popup/`, and `scripts/`)             |
| Type check | `npm run typecheck`    | No errors, including `scripts/`                                                                     |
| Format     | `npm run format:check` | No files need formatting                                                                            |
| Coverage   | `npm run coverage`     | ~70% guide on `src/`, `popup/`, and `scripts/`; gaps explained                                      |
| Dist zip   | `npm run package`      | `dist/yt-skip-ad-1.0.0.zip` exists; `unzip -Z1` lists only the extension files                      |
| No keys    | `git ls-files '*.pem'` | Prints nothing                                                                                      |

## TDD record

Every group's `tests.md` section is complete: each selected test is ✅, each
unticked test has a reason, and no `it.fails` or `it.todo` mark is left.

## Manual checks

On real youtube.com, with DevTools open on the content-script context. Turn
other ad-related extensions (ad blockers) off first.

1. Load unpacked in `chrome://extensions`: no errors; version 1.0.0;
   permissions still only storage and YouTube (B4, B14).
2. Upgrade over 0.4.0 as the README says (remove the old card, Load
   unpacked): no errors; the popup shows the defaults and "Ads skipped: 0"
   (B3).
3. Note the ID on the card. Change the delay, skip an ad, then remove the
   card, move the folder, and Load unpacked from the new path: same ID,
   same delay, same count (B1, B2).
4. **Clean install:** on a new Chrome profile, take
   `dist/yt-skip-ad-1.0.0.zip` and follow only the README to install it,
   with no other help: it loads with no errors and the same ID (B8, B11).
5. In that profile, a pre-roll is skipped with delay 0, and the popup shows
   1 (B8, B15).
6. Follow the README's update steps with the same zip, then its uninstall
   steps: both work as written (B12).
7. Read the README's privacy note against the extension: every claim holds
   (B13).
8. Pre-roll, mid-roll, and a two-ad pod are skipped; an unskippable ad plays
   through (B15).
9. Delay 3 s: the click comes about 3 s after the Skip button appears;
   untick "Auto-skip ads" during the wait: no click, no count (B15).
10. Clicking through 5+ videos without a reload: ads are still skipped
    (B15).
11. Home page, Shorts, and search: no `[yt-skip-ad]` errors (B16).
12. Logged in and logged out (Incognito, with Allow in Incognito on): both
    work.
13. Popup reopen: the toggle, delay, and count are kept; light and dark
    mode are readable at about 280px with no horizontal scroll (no popup
    change this phase; regression only).
14. DevTools Network tab, filtered to the extension, on YouTube and in the
    popup: no requests (B17).
15. Chrome Task Manager: the extension's CPU stays near 0% while a video
    plays, including right after a skip.

## Done means

All checks above pass; `specs/tech-stack.md`, `README.md`,
`specs/roadmap.md`, and `CHANGELOG.md` are updated; no `node_modules/`,
`dist/`, `test-results/`, `*.pem`, or secrets are committed.
