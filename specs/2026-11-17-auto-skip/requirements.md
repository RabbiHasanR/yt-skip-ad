# Phase 1 — Auto-skip: Requirements

## Context

Phase 1 is the second phase in the [roadmap](../roadmap.md). Phase 0
delivered a loadable MV3 extension: a classic `src/content/loader.js` that
`import()`s the ES-module entry `src/content/main.js`, a placeholder popup,
the dev tooling, and the `chrome` mock in `tests/setup/chrome.js`.

After this phase, skippable **ads** are skipped automatically: the extension
clicks the **Skip button** as soon as it becomes visible, and keeps doing so
across YouTube's in-page navigation. There are no **settings** yet (Phase 2),
so auto-skip is always on with no **delay**.

It serves the [mission](../mission.md)'s core promise and two of its success
criteria: a skippable ad is skipped within about 0.5 s of the Skip button
appearing, and auto-skip still works after 5+ videos without a reload. See
[tech-stack.md](../tech-stack.md) for the principles and
[PLAN.md §7 and §10](../../docs/PLAN.md) for the original flow, pseudocode,
edge cases, and manual test plan.

## Scope

**In scope**

- `[core]` **Detect and click:** ad detection, Skip button lookup across the
  selector list, the visibility rule, and the click-once-per-appearance rule.
- `[content]` **Follow the player:** wait for the player, observe it, re-attach
  after `yt-navigate-finish` when the player was replaced, throttle checks, no
  errors on pages without a player.
- **End to end:** one Playwright test where real Chromium loads the unpacked
  extension and clicks the Skip button on a local fixture page.

**Out of scope**

- Settings (`enabled`, `delaySec`) and the popup controls (Phase 2).
- The skip counter (Phase 3).
- The `DEBUG` flag and verbose logging (Phase 4).
- The 30 s "no Skip button found" warning (roadmap **Later**).
- Embedded players on other sites (`youtube.com/embed` iframes, because
  `all_frames` is off), `youtube-nocookie.com`, YouTube Music, and
  `m.youtube.com`.
- Popup changes; the Phase 0 placeholder stays.
- CI (still deferred; see
  [Deferred decisions](../tech-stack.md#deferred-decisions)).

## Features

### Detect and click

- An **ad** is showing when the player has the `ad-showing` class.
- The **Skip button** is looked up **inside the player only**, trying each
  selector in `SKIP_BUTTON_SELECTORS` in order.
- A button counts as visible when neither it nor any ancestor up to the player
  has computed `display: none` (this covers the `hidden` attribute), and its
  own computed `visibility` is not `hidden`.
- Hidden buttons (the countdown phase) are ignored.
- **Click once per appearance:** the skipper starts armed. A check that finds
  an ad showing and a visible Skip button clicks it and disarms. A check that
  finds no visible Skip button, either because the ad ended or because the
  next ad in a pod is counting down, re-arms.
- Edge cases (PLAN.md §7.4):
  - Two-ad pod: the second ad's countdown hides the button, which re-arms the
    skipper, so the pod gets two clicks.
  - A Skip button without `ad-showing`: no click.
  - The ad ends before the check runs: no click, because each check reads the
    DOM fresh.
  - Unskippable ad: no button is ever visible, so no click and no error.
  - `.click()` ignored if YouTube ever checks `isTrusted`: a known risk,
    recorded as a known limitation.

### Follow the player

- At load, `main.js` looks for the player (`PLAYER_SELECTORS`, first match).
  If there is none yet, a document-level `MutationObserver` waits for it and
  disconnects once it appears.
- Once found, the player is observed with `subtree`, `childList`, and
  attributes filtered to `class`, `style`, and `hidden`. This catches the
  `ad-showing` toggle, the button being inserted, and the button being
  revealed by a style change. A check runs right away on attach.
- On `yt-navigate-finish` (listened for on `document`), the player is looked
  up again. If it is a different element, the old observer is disconnected and
  the new player is observed and checked once.
- **Throttle:** the first mutation schedules one check `CHECK_THROTTLE_MS`
  (100 ms) later, and mutations in between schedule nothing more. Checks run
  in background tabs too, where Chrome slows timers to about 1 s.
- Pages without a player (home page, Shorts, search) produce no errors and no
  clicks.
- The single `[yt-skip-ad] content script loaded` log stays; there are no
  per-click logs in this phase.

### End to end

- `tests/e2e/auto-skip.spec.js` launches Chromium with the unpacked extension
  loaded.
- Playwright intercepts `https://www.youtube.com/watch?v=fixture` and serves
  `tests/fixtures/player.html`. The URL matches the manifest, so the real
  content script runs through the real loader. Every other request is aborted,
  so nothing leaves the machine.
- The fixture shows an ad with a hidden Skip button, then reveals it; the test
  expects one click.

## Storage and selectors

No storage keys, permissions, or manifest entries change. The existing
`src/**/*.js` web-accessible glob covers the new modules.

Agreed at Gate 0, in `src/core/selectors.js`:

| Name                    | Value                                                                      | Detects                                 | Fallback                                        |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| `PLAYER_SELECTORS`      | `#movie_player`, then `.html5-video-player`                                | The main video player                   | Second entry, in case YouTube renames the id    |
| `AD_SHOWING_CLASS`      | `ad-showing` (on the player)                                               | An ad is playing                        | None; YouTube's one stable ad signal            |
| `SKIP_BUTTON_SELECTORS` | `.ytp-skip-ad-button`, `.ytp-ad-skip-button-modern`, `.ytp-ad-skip-button` | The Skip button, inside the player only | Tried in order; old names kept for older builds |
| `NAVIGATE_EVENT`        | `yt-navigate-finish` (on `document`)                                       | YouTube's in-page navigation finished   | None                                            |

**Contested choices:**

- **Visibility, computed style** over `offsetParent !== null` (always `null`
  in jsdom, so only e2e could test it, and also `null` for `position: fixed`)
  and over `checkVisibility()` (not in jsdom, so tests would run against our
  own polyfill). Trade-off accepted: `opacity: 0` is not detected. If YouTube
  hides the countdown button with opacity, we click early and the click may be
  ignored; the manual pass checks for this.
- **Click once per appearance (arm/disarm)** over remembering clicked elements
  (breaks if YouTube reuses one button across a pod) and over PLAN.md's
  `pending` flag (double-clicks a lingering button, or loses the second click
  of a pod).
- **Throttle with a 100 ms time guard** over `requestAnimationFrame` (stops in
  background tabs) and over debounce (the progress bar mutates constantly
  during an ad, so the check could starve).
- **Observe the player** (class, style, and hidden attributes) over all of
  `document.body` (CPU cost from every DOM change) and over observing only the
  class plus polling (an extra timer loop and up to 250 ms of latency).

**Upgrade impact:** nothing is stored yet, so a colleague who replaces the
folder loses nothing.

## Decisions

| Decision            | Choice                                                                      | Why                                                                           |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Scope               | Detect and click, follow the player, one e2e test                           | User's choice; all three roadmap sub-slices                                   |
| Slicing             | One group per roadmap sub-slice                                             | User's choice; each group has a clear acceptance test                         |
| Merge bar           | Automated checks plus a manual pass on real YouTube                         | User's choice; only live YouTube proves the selectors                         |
| Selectors           | As in the table above                                                       | Agreed at Gate 0                                                              |
| Visibility rule     | Computed style up to the player                                             | Agreed at Gate 0; testable in jsdom and correct in Chrome                     |
| Click rule          | Arm/disarm per appearance                                                   | Agreed at Gate 0; handles pods without relying on element identity            |
| Throttle            | 100 ms time guard (`CHECK_THROTTLE_MS`)                                     | Agreed at Gate 0; bounded latency, works in background tabs                   |
| Observed target     | The player: subtree, childList, `class`/`style`/`hidden`                    | Agreed at Gate 0; catches reveals done with a style change                    |
| Waiting for player  | Document-level `MutationObserver`, disconnected once found                  | No polling when idle; reacts immediately                                      |
| Navigation          | Re-resolve on `yt-navigate-finish`; re-attach only if the element changed   | Avoids needless re-attaching; handles a replaced player                       |
| Click method        | `button.click()`                                                            | Simplest; the `isTrusted` risk is recorded as a known limitation              |
| Log prefix          | `LOG_PREFIX` in new `src/shared/constants.js`; `loader.js` keeps its copy   | Planned in Phase 0; the classic loader can't import                           |
| Logging             | Only the existing load log                                                  | Verbose logging waits for Phase 4's `DEBUG` flag                              |
| Core modules        | `selectors.js`, `ad-detection.js`, `skipper.js`, `throttle.js`              | One responsibility each; `main.js` stays wiring only                          |
| e2e fixture hosting | Playwright route intercept of a `www.youtube.com` URL; other requests abort | Real loader and content script, no manifest change, nothing leaves the device |
| e2e dependency      | `@playwright/test` and its Chromium build                                   | Already chosen in tech-stack.md                                               |
| Version             | `0.2.0` in the Verify group, if the build will be shared                    | Colleagues can tell builds apart; `1.0.0` stays reserved for v1               |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` before coding for: Chrome Extensions MV3
  content scripts, `MutationObserver`, `getComputedStyle` in jsdom, Vitest
  (fake timers, `it.fails`), and Playwright (Chrome extensions, persistent
  context, `page.route`).
- Every behaviour is built test-first, as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd).
- Logic lives in `src/core/`; `src/content/` only wires the DOM and events.
- Only `src/shared/storage.js` touches `chrome.storage` (not used this phase);
  keys and defaults live only in `src/shared/constants.js`; selectors only in
  `src/core/selectors.js`.
- No new permission without the user's agreement.
- No network requests, no data leaving the device.
- No build step for the extension itself.
