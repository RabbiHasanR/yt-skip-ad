# YT Skip Ad — Roadmap

High-level implementation order. Phases are **vertical slices**: each ships one
usable, demoable piece end to end (storage → content script → popup). Keep
every phase small. Every phase follows the directory and naming rules in
[tech-stack.md → Project conventions](tech-stack.md#project-conventions), is
built with the [TDD workflow](tech-stack.md#development-workflow-tdd), and
every popup change meets the
[popup UI standard](tech-stack.md#popup-ui-standard).

Each feature phase starts with one **acceptance test**, marked
`it.fails(...)`, and ends when it passes with the mark removed.

## Phase 0 — Project skeleton ✅ Complete

Spec: [2026-11-17-project-skeleton](2026-11-17-project-skeleton/requirements.md).
Automated and manual checks pass (2026-11-17).

- Add `manifest.json` (MV3, `storage` + YouTube host permission only) and
  placeholder icons.
- Add dev tooling: `package.json`, Vitest + jsdom, ESLint, Prettier, the
  `chrome` API mock, and one trivial passing test.
- Decide how the content script loads modules (see
  [Decided in Phase 0](tech-stack.md#decided-in-phase-0)).
- Confirm the extension loads in `chrome://extensions` with no errors, the
  content script logs once on YouTube, and the popup opens with a placeholder.

## Phase 1 — Auto-skip ✅ Complete

Spec: [2026-11-17-auto-skip](2026-11-17-auto-skip/requirements.md).
Automated checks and the manual pass on real YouTube pass (2026-11-18), as
version 0.2.1. The manual pass found YouTube ignores script clicks
(`isTrusted`); the trusted-click script fixes it. All 12 manual checks
pass, including a mid-roll and a two-ad pod (see the
[manual pass record](2026-11-17-auto-skip/validation.md#manual-pass-record)).

After this phase, skippable ads are skipped automatically (no settings yet).

### Detect and click

- Acceptance test: given a fixture player with `ad-showing` and a visible Skip
  button, the content script clicks the button.
- **Ad** detection: the player has the `ad-showing` class.
- **Skip button** lookup across the selector list; hidden buttons
  (countdown phase) are ignored.
- One click per ad; a two-ad pod gets two clicks.
- No click when no ad is showing, or the ad ends before the click.

### Follow the player

- Wait for the player to exist, then observe it with a `MutationObserver`.
- Re-attach when `yt-navigate-finish` fires and the player was replaced.
- Throttle checks so a burst of mutations runs one check.
- No errors on pages without a player (home page, Shorts).

### End to end

- One slow test: the extension, loaded in Chromium, clicks the Skip button on
  a local fixture page.

## Phase 2 — Settings ⏳ Not started

After this phase, a user can turn auto-skip on or off and set a delay from the
popup, and changes apply live.

### Settings storage

- Acceptance test: when `enabled` is set to `false` in storage, the content
  script stops clicking without a reload.
- **Settings** have defaults (`enabled: true`, `delaySec: 0`).
- `delaySec` is clamped to 0–10; invalid values fall back to the default.
- The content script follows `chrome.storage.onChanged`.

### Delay

- The click happens `delaySec` seconds after the button appears.
- If the user turns auto-skip off during the delay, no click happens.
- If the button disappears during the delay, no click happens.

### Popup controls

- The popup shows the stored toggle and delay on open.
- Changing them writes to storage.
- Meets the [popup UI standard](tech-stack.md#popup-ui-standard).

## Phase 3 — Skip counter ⏳ Not started

After this phase, a user sees how many ads were skipped and can reset it.

- Acceptance test: after the content script clicks Skip, the popup shows the
  **skip counter** increased by 1.
- Each successful click adds 1 to `skipCount`; a skipped click does not.
- The popup counter updates live while open.
- "Reset counter" sets it to 0.

## Phase 4 — MVP ⏳ Not started

Closes the mission's unmet promises and makes v1 ready for colleagues.

### Ready for colleagues

- `README.md` with install ("Load unpacked" from the shared folder or the
  WhatsApp zip), update, and uninstall steps,
  plus a privacy note: no data collected, nothing sent off the device.
- Final icons at 16/48/128 px.
- `DEBUG` flag for verbose logging, off by default.
- Version `1.0.0` in `manifest.json`.

### Release check

- Full suite, lint, and type checks pass.
- Manual test pass on real YouTube (see
  [tech-stack.md → Validation](tech-stack.md#validation)).
- `npm run package` builds the dist zip (see
  [tech-stack.md → Distribution](tech-stack.md#distribution)).
- Install from the zip on a clean Chrome profile, following only the README.

## Later (out of v1 scope)

"Don't skip this ad" button in the player, per-channel rules, countdown
overlay with cancel, muting or speeding up unskippable ads, toolbar badge
counter, Firefox/Edge builds, public Chrome Web Store release, a warning when
`ad-showing` lasts 30+ s with no Skip button found (a sign a selector broke).
