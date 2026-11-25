# Phase 7 — Auto-open rating popup: Requirements

## Context

Phase 7 follows the [roadmap](../roadmap.md)'s Phase 6 (Store rating,
1.2.0), which asks once, inside the popup, for a Chrome Web Store rating
after 50 ads skipped. Users only see that prompt if they open the popup
themselves, which many rarely do. This phase brings the prompt to them: the
extension opens its own popup when the **skip counter** reaches a milestone,
and keeps asking at a steady pace until the user answers the prompt.

It serves the [mission](../mission.md)'s public users and the developer's
goal of a project people find and use, while keeping the main promise:
nothing leaves the device. The rating request stays a plain link. See
[tech-stack.md](../tech-stack.md) for the principles and storage schema; the
"Nothing leaves the device" principle still lists "rate us" prompts as
ruled out, which Phase 6 already changed and this phase corrects.

Rabbi's decisions (see [roadmap Phase 7](../roadmap.md)): ask at 50, then
every 100 more (2026-11-24). Revised 2026-11-25: "Rate it ★" and × both end
the asks for good, as in Phase 6, so a user who rated or said no is never
asked again; the repeat is only for users who ignore the prompt. The
"Don't ask again" control and the postponing state built first were
removed.

## Scope

**In scope**

- `[core]` **Ask rules:** when the prompt is due, which milestone it names,
  and when a skip crosses an auto-open milestone (`src/core/rate-ask.js`,
  replacing `src/core/rate-prompt.js`).
- `[core]` **Ask state:** Phase 6's `ratePromptDone`, unchanged.
- `[popup]` **Prompt:** names the last milestone (50+, 150+, 250+, …); "Rate
  it ★" and × still end it for good, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `[background]` **Auto-open:** a service worker,
  `src/background/service-worker.js`, follows `skipCount` through
  `chrome.storage.onChanged` and calls `chrome.action.openPopup()` when a
  skip crosses a milestone.
- `[background]` **Guards:** no auto-open unless the Chrome window is
  focused and not fullscreen or minimized; a ★ badge on the toolbar icon
  when the popup is not opened; the popup clears the badge, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `[manifest]` **Service worker:** `background.service_worker` as an ES
  module. No new permission.

**Out of scope**

- Postponing after × or "Rate it ★", and a separate "Don't ask again"
  control (built first, then dropped by Rabbi on 2026-11-25).
- Knowing whether the user really wrote a review: the store offers no such
  signal, and the network lock blocks asking.
- Any change to the content script or to auto-skip itself.
- Any prompt drawn on the YouTube page, notifications, or sounds.
- A Support / donation link (still waiting for a working account).

## Features

### Prompt

- **Due:** the prompt shows in the popup when `skipCount ≥ 50` and
  `ratePromptDone` is not `true`, as in Phase 6.
- **× and "Rate it ★":** hide the prompt and set `ratePromptDone` to `true`.
  From then on: no prompt, no auto-open, no badge, however high the counter
  goes, even after a counter reset. "Rate it ★" still opens the store's
  reviews page in a new tab.
- **Live:** in an open popup, the prompt appears when the count reaches 50,
  and its number follows the count.
- **Counter reset before answering:** the prompt hides until the counter is
  back at 50 (Phase 6's known limitation, kept).
- **Text:** "<count>+ ads skipped! A quick rating helps others find this.",
  the number being the last milestone at or below the current skip count:
  50, 150, 250, … (50 below 150), so the 150th skip says "150+".

### Auto-open

- The service worker registers its `chrome.storage.onChanged` listener at
  the top level, so Chrome wakes it for every change.
- **Milestones:** 50, then every 100 more (150, 250, …), while
  `ratePromptDone` is not `true`. Closing the auto-opened popup by clicking
  elsewhere doesn't answer the prompt, so it opens again at the next one.
- **Crossing:** when `skipCount` changes from `old` to `new`, a milestone is
  crossed if one lies in `old < m ≤ new`. Each milestone is crossed by one
  storage change only, so one auto-open per milestone, even with several
  YouTube tabs skipping.
- On a crossing, when `ratePromptDone` is not `true`, the worker calls
  `chrome.action.openPopup()`; the popup opens showing the prompt (it is due
  by the rule above).
- A counter reset (`new < old`) or a change between milestones never opens
  the popup.
- The worker only reads storage; only the popup writes `ratePromptDone`.

### Guards

- **Safe to open:** the worker calls `openPopup()` only when
  `chrome.windows.getLastFocused()` reports `focused: true` and `state`
  `'normal'` or `'maximized'`. Otherwise (fullscreen, minimized, or Chrome
  not the active app) it sets the ★ badge instead. The real-Chrome trial
  ([tests.md](tests.md#real-chrome-trial-2026-11-25)) showed YouTube's video
  fullscreen reports `'fullscreen'`.
- **Open fails:** if `openPopup()` still rejects, the worker sets the ★
  badge. In the trial, Chrome itself rejected in fullscreen and with another
  app in front, so this is the backup, not the rule.
- **Badge:** text "★"; not stored. Opening the popup clears it. It is never
  set once the prompt was answered.
- A worker error is logged with the `[yt-skip-ad]` prefix and never breaks
  auto-skip, which doesn't depend on the worker.

## Storage and selectors

No selector or DOM signal change. No new permission: `action` is already in
the manifest, and `openPopup`, `setBadgeText`, and `windows.getLastFocused`
need none.

No storage key changes: Phase 6's `ratePromptDone` (`local`, only `true`
means answered, written by the popup) keeps its meaning and is now also read
by the worker. The milestones are fixed (50, 150, 250, …), so nothing else
is stored.

Manifest: `"background": { "service_worker": "src/background/service-worker.js", "type": "module" }`.

**Contested choices (Gate 0, approved by Rabbi; revised 2026-11-25):**

- **Only the popup writes the ask state:** the worker reads and reacts. One
  writer, so no race when several tabs skip at once.
- **Badge not stored:** set by the worker, cleared by the popup. If Chrome
  restarts and the badge is gone, nothing breaks: the prompt is still due
  the next time the popup opens.
- **Keep `ratePromptDone`:** with × and Rate both final, nothing postpones
  the next ask, so `rateNextAskAt` and `rateNeverAsk` (agreed first) aren't
  needed, and no migration is needed either.
- **Follow storage, not messages:** the worker reads `skipCount` changes
  from `chrome.storage.onChanged` (old and new value), so the content script
  is unchanged and needs no messaging.

**Upgrade impact:** settings, the skip counter, and `ratePromptDone` are
kept. A 1.2.0 user who answered the prompt is never asked again; one who
never saw it is asked the next time the popup opens (if already past 50),
and the popup opens by itself at the next milestone.

## Decisions

| Decision      | Choice                                                            | Why                                                                                           |
| ------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Scope         | Milestone prompt, auto-open, guards                               | Rabbi's choice; repeat asks after × or Rate dropped on 2026-11-25                             |
| Cadence       | 50, then every 100 more                                           | Rabbi's choice                                                                                |
| What stops it | "Rate it ★" or ×, for good                                        | Rabbi (2026-11-25): never nag a user who rated or said no                                     |
| Delivery      | `chrome.action.openPopup()` from a service worker                 | Shows the prompt without a click and without drawing on YouTube's page; Chrome 127+           |
| Trigger       | `chrome.storage.onChanged` on `skipCount`, crossing a milestone   | No content-script change; one storage change per milestone gives one auto-open                |
| Fullscreen    | `getLastFocused()`: open only if focused and `normal`/`maximized` | Rabbi's choice; trial confirmed fullscreen is reported; our rule, not Chrome's error, decides |
| Storage       | Phase 6's `ratePromptDone`, unchanged                             | Revised Gate 0: nothing to postpone, so no new key and no migration                           |
| Prompt text   | Count rounded down to the last milestone: 50, 150, 250, …         | Rabbi's choice; matches the auto-open points, and stays true                                  |
| Slicing       | Popup first, then worker, then guards                             | Rabbi's choice; each group ships something usable                                             |
| Validation    | Gate, manual pass in real Chrome, and an e2e test of the worker   | Rabbi's choice; the worker is the phase's new moving part                                     |
| Store policy  | No reward, no feature locked behind rating; listing says it asks  | Chrome Web Store spam policy; documented, not hidden                                          |
| Principle     | "Nothing leaves the device" no longer lists "rate us" prompts     | Phase 6 added one; a link sends nothing, so the promise holds                                 |
| Version       | `1.3.0`                                                           | New user-visible behaviour, nothing breaking                                                  |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` for every API the phase touches
  (`chrome.action.openPopup`, `chrome.action.setBadgeText`,
  `chrome.windows.getLastFocused`, MV3 module service workers and
  `chrome.storage.onChanged` in a worker, Vitest, Playwright service
  workers) before coding.
- Every behaviour is built test-first, as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd).
- Logic lives in `src/core/`; `src/background/` and `popup/` only wire
  `chrome.*` and the DOM.
- Only `src/shared/storage.js` touches `chrome.storage`; keys, defaults, and
  the cadence live only in `src/shared/constants.js`.
- No new permission without Rabbi's agreement.
- No network requests, no data leaving the device.
- No build step for the extension itself.
