# Phase 7 — Auto-open rating popup: Requirements

## Context

Phase 7 follows the [roadmap](../roadmap.md)'s Phase 6 (Store rating,
1.2.0), which asks once, inside the popup, for a Chrome Web Store rating
after 50 ads skipped. Users only see that prompt if they open the popup
themselves, which many rarely do. This phase brings the prompt to them: the
extension opens its own popup when the **skip counter** reaches a milestone,
and keeps asking at a steady pace until the user says "Don't ask again".

It serves the [mission](../mission.md)'s public users and the developer's
goal of a project people find and use, while keeping the main promise:
nothing leaves the device. The rating request stays a plain link. See
[tech-stack.md](../tech-stack.md) for the principles and storage schema; the
"Nothing leaves the device" principle still lists "rate us" prompts as
ruled out, which Phase 6 already changed and this phase corrects.

Rabbi's decisions (2026-11-24, see [roadmap Phase 7](../roadmap.md)): ask
at 50, then every 100 more; only "Don't ask again" stops it; "Rate it ★"
does not, since the extension can't see whether a review was written.

## Scope

**In scope**

- `[core]` **Ask rules:** when the prompt is due, when a skip crosses an
  auto-open milestone, and where the next ask moves after × or "Rate it ★"
  (`src/core/rate-ask.js`, replacing `src/core/rate-prompt.js`).
- `[core]` **Ask state:** `rateNextAskAt` and `rateNeverAsk` in
  `src/shared/storage.js`, with a one-time move from Phase 6's
  `ratePromptDone`.
- `[popup]` **Repeat asks:** × and "Rate it ★" postpone the prompt by 100
  skips; a new "Don't ask again" control ends it for good, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `[background]` **Auto-open:** a service worker,
  `src/background/service-worker.js`, follows `skipCount` through
  `chrome.storage.onChanged` and calls `chrome.action.openPopup()` when a
  skip crosses a milestone.
- `[background]` **Guards:** no auto-open in a fullscreen window; a ★ badge
  on the toolbar icon when the popup is not opened; the popup clears the
  badge, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `[manifest]` **Service worker:** `background.service_worker` as an ES
  module. No new permission.

**Out of scope**

- A longer pause after "Rate it ★" (offered, not chosen): it pushes the
  prompt 100 skips, like ×.
- Knowing whether the user really wrote a review: the store offers no such
  signal, and the network lock blocks asking.
- Any change to the content script or to auto-skip itself.
- Any prompt drawn on the YouTube page, notifications, or sounds.
- A Support / donation link (still waiting for a working account).

## Features

### Repeat asks

- **Due:** the prompt shows in the popup when `skipCount ≥ rateNextAskAt`
  and `rateNeverAsk` is not `true`. A fresh install has `rateNextAskAt` 50,
  so the first ask is at 50 ads skipped, as in Phase 6.
- **× and "Rate it ★":** hide the prompt and set
  `rateNextAskAt = skipCount + 100`. "Rate it ★" still opens the store's
  reviews page in a new tab.
- **Don't ask again:** a button in the prompt; sets `rateNeverAsk` to `true`
  and hides the prompt. From then on: no prompt, no auto-open, no badge.
- **Live:** in an open popup, the prompt appears when the count reaches
  `rateNextAskAt`, and stays hidden after ×, Rate, or Don't ask again until
  the next time it is due.
- **Counter reset:** does not touch `rateNextAskAt`; after a reset, the next
  ask waits until the counter climbs back to it.
- **Text:** "<count>+ ads skipped! A quick rating helps others find this.",
  the number being the current skip count rounded down to the hundred
  (50 below 100), so it stays true at 150, 250, …

### Auto-open

- The service worker registers its `chrome.storage.onChanged` listener at
  the top level, so Chrome wakes it for every change.
- **Milestones:** `rateNextAskAt`, then every 100 after it, while the prompt
  stays unhandled (default: 50, 150, 250, …).
- **Crossing:** when `skipCount` changes from `old` to `new`, a milestone is
  crossed if one lies in `old < m ≤ new`. Each milestone is crossed by one
  storage change only, so one auto-open per milestone, even with several
  YouTube tabs skipping.
- On a crossing, when `rateNeverAsk` is not `true`, the worker calls
  `chrome.action.openPopup()`; the popup opens showing the prompt (it is due
  by the rule above).
- A counter reset (`new < old`) or a change between milestones never opens
  the popup.
- The worker only reads storage; only the popup writes the ask state.

### Guards

- **Fullscreen:** if `chrome.windows.getLastFocused()` reports
  `state: 'fullscreen'`, the worker does not open the popup and sets the ★
  badge instead. Groundwork confirms in real Chrome that YouTube's video
  fullscreen reports this state; if not, Rabbi decides the fallback.
- **Open fails:** if `openPopup()` rejects (for example, no focused Chrome
  window), the worker sets the ★ badge.
- **Badge:** text "★"; not stored. Opening the popup clears it. It is never
  set after "Don't ask again".
- A worker error is logged with the `[yt-skip-ad]` prefix and never breaks
  auto-skip, which doesn't depend on the worker.

## Storage and selectors

No selector or DOM signal change. No new permission: `action` is already in
the manifest, and `openPopup`, `setBadgeText`, and `windows.getLastFocused`
need none.

| Key              | Area    | Type    | Default | Valid range                                 | Written by                   | Why                                               |
| ---------------- | ------- | ------- | ------- | ------------------------------------------- | ---------------------------- | ------------------------------------------------- |
| `rateNextAskAt`  | `local` | integer | `50`    | whole number ≥ 0; anything else reads as 50 | popup (× / Rate), migration  | The skip count from which the prompt is due again |
| `rateNeverAsk`   | `local` | boolean | `false` | only `true` means never                     | popup ("Don't ask again")    | Stops every ask, auto-open, and badge forever     |
| `ratePromptDone` | `local` | —       | —       | —                                           | removed by the one-time move | Phase 6's "× is final" no longer applies          |

Manifest: `"background": { "service_worker": "src/background/service-worker.js", "type": "module" }`.

**Contested choices (Gate 0, approved by Rabbi):**

- **Only the popup writes the ask state:** the worker reads and reacts. One
  writer, so no race when several tabs skip at once. Cost: an ignored
  auto-open doesn't move `rateNextAskAt`; the crossing rule's "every 100
  after it" keeps the pace instead.
- **Badge not stored:** set by the worker, cleared by the popup. If Chrome
  restarts and the badge is gone, nothing breaks: the prompt is still due
  the next time the popup opens.
- **Phase 6 users asked again 100 skips later:** when `ratePromptDone` is
  `true`, the move sets `rateNextAskAt = skipCount + 100` and removes it, so
  someone who just closed the 1.2.0 prompt isn't asked again at once.
- **Follow storage, not messages:** the worker reads `skipCount` changes
  from `chrome.storage.onChanged` (old and new value), so the content script
  is unchanged and needs no messaging.

**Upgrade impact:** settings and the skip counter are kept. A 1.2.0 user who
handled the prompt is asked again 100 skips after the update; one who never
saw it keeps the default 50, so if already past 50 the prompt is due the
next time the popup opens, and the popup opens by itself at the next
milestone.

## Decisions

| Decision        | Choice                                                              | Why                                                                                 |
| --------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Scope           | Repeat asks, auto-open, guards                                      | Rabbi's choice; the longer pause after Rate was not chosen                          |
| Cadence         | 50, then every 100 more                                             | Rabbi's choice                                                                      |
| What stops it   | Only "Don't ask again"                                              | Rabbi: the extension can't see whether a review was written                         |
| Delivery        | `chrome.action.openPopup()` from a service worker                   | Shows the prompt without a click and without drawing on YouTube's page; Chrome 127+ |
| Trigger         | `chrome.storage.onChanged` on `skipCount`, crossing a milestone     | No content-script change; one storage change per milestone gives one auto-open      |
| Fullscreen      | `chrome.windows.getLastFocused().state`                             | Rabbi's choice; no messaging, no permission; checked in real Chrome first           |
| Storage         | `rateNextAskAt`, `rateNeverAsk`; `ratePromptDone` moved and removed | Gate 0, approved by Rabbi                                                           |
| Prompt text     | Count rounded down to the hundred (50 below 100)                    | "50+ ads skipped" stays true at 150, 250, …                                         |
| Don't ask again | A `<button>` in the prompt                                          | An action, not navigation; keyboard and screen readers treat it as one              |
| Slicing         | Popup first, then worker, then guards                               | Rabbi's choice; each group ships something usable                                   |
| Validation      | Gate, manual pass in real Chrome, and an e2e test of the worker     | Rabbi's choice; the worker is the phase's new moving part                           |
| Store policy    | No reward, no feature locked behind rating; listing says it asks    | Chrome Web Store spam policy; documented, not hidden                                |
| Principle       | "Nothing leaves the device" no longer lists "rate us" prompts       | Phase 6 added one; a link sends nothing, so the promise holds                       |
| Version         | `1.3.0`                                                             | New user-visible behaviour, nothing breaking                                        |

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
