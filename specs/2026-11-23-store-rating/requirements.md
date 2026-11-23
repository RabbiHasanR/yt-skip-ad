# Phase 6 — Store rating: Requirements

## Context

Phase 6 follows the [roadmap](../roadmap.md)'s Phase 5 (Web Store, 1.1.0),
which made **Skip Ad for YouTube** free on the Chrome Web Store. Installs
there come mostly from store search, and the store ranks and converts on
ratings: most happy users never rate unless asked. This phase asks them,
once, at a moment the extension has proven itself, and gives a permanent
way to rate and to star the source.

It serves the [mission](../mission.md)'s public users (finding an extension
that collects nothing) and the developer's goal of a project people use. It
keeps every promise of Phase 5: the prompt is only a link, so nothing is
sent off the device. See [tech-stack.md](../tech-stack.md) for the
principles and storage schema.

Phase 5 listed "ratings prompts" as out of scope; Rabbi has now put a
one-time, popup-only prompt in scope.

The code for this phase was written before this spec (on `main`,
uncommitted) and moved to the phase branch. See Decisions for how the TDD
record handles that.

## Scope

**In scope**

- `[core]` **Rating rule:** `shouldShowRatePrompt(skipCount, done)` in
  `src/core/rate-prompt.js`.
- `[core]` **Prompt state:** `isRatePromptDone()` and `markRatePromptDone()`
  in `src/shared/storage.js`, over the new `ratePromptDone` key.
- `[popup]` **Rating prompt:** a one-time card below the skip counter,
  meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `[popup]` **Footer links:** an always-on "Rate" link, and a ★ on "Source"
  inviting a GitHub star, meeting
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).

**Out of scope**

- A Support / donation link (Ko-fi or Buy Me a Coffee): no account yet, and
  payouts must be confirmed to work first. A later phase.
- The GitHub star button with a live count: it is a third-party iframe and
  would break the network lock (`connect-src 'none'`).
- A LinkedIn or GitHub profile link in the popup: not useful to users there;
  it belongs in the README and store listing.
- README and store-listing marketing changes, the Edge Add-ons submission,
  and launch posts: done outside this spec.
- Any prompt inside the YouTube page, any reminder after a dismissal, any
  record of whether the user rated.

## Features

### Rating prompt

- Shown when the **skip counter** is at least `RATE_PROMPT_THRESHOLD` (50)
  and the prompt is not done. Hidden otherwise; hidden in the HTML by
  default, so it never flashes.
- Text: "50+ ads skipped! A quick rating helps others find this.", the number
  filled in from the threshold constant.
- **Rate it ★:** a link to the store's reviews page, opening in a new tab
  (`target="_blank"`, `rel="noopener"`). Clicking it hides the prompt and
  marks it done.
- **×** (named "Dismiss"): hides the prompt and marks it done.
- **Live:** while the popup is open, the prompt appears when the counter
  reaches the threshold, and stays hidden once done, even as the counter
  grows.
- **Edge cases:** the counter is reset after the prompt is done → it never
  comes back. The counter is reset before the prompt is seen → it shows when
  the counter reaches the threshold again. An invalid stored state reads as
  not done.
- Readable in light and dark mode at the fixed width; both controls are
  reachable with Tab and have the visible focus ring.

### Footer links

- The footer is two lines: "🔒 No data collected", then "Privacy · Source ★ ·
  Rate".
- **Rate** links to the same reviews page as the prompt, in a new tab, always
  shown.
- The ★ after Source is decorative (`aria-hidden`); the link's title says
  "Source code: star it on GitHub". The link target is unchanged.
- The store URL is defined once, as `STORE_REVIEWS_URL` in
  `src/shared/constants.js`; the popup fills in every link marked
  `data-store-reviews`.

## Storage and selectors

No selector, DOM signal, manifest, or permission change.

| Key              | Area    | Type    | Default | Valid range           | Written by | Why                                              |
| ---------------- | ------- | ------- | ------- | --------------------- | ---------- | ------------------------------------------------ |
| `ratePromptDone` | `local` | boolean | `false` | only `true` is "done" | popup      | The prompt never comes back once rated/dismissed |

**Contested choices:**

- **Trigger on `skipCount`, not a lifetime counter:** no new write per skip
  and no content-script change. Cost: a counter reset before the prompt is
  seen delays it.
- **One boolean, not "rated" vs "dismissed":** the difference would never
  leave the device, so nothing could use it.

**Upgrade impact:** none migrated. A 1.1.0 user with 50+ skips sees the
prompt the first time they open the popup after the update; settings and
the counter are kept.

## Decisions

| Decision         | Choice                                                               | Why                                                                   |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Scope            | Rating prompt and footer links                                       | Rabbi's choice; the footer was already built and tested               |
| Code before spec | Keep it; each acceptance test is shown failing with its code removed | Rabbi's choice; an honest TDD record without rebuilding the same code |
| Threshold        | 50 ads skipped                                                       | Late enough that the extension has proven itself                      |
| Reminders        | None: rated or dismissed is final                                    | Store policy and goodwill; no nagging                                 |
| Trigger          | Existing `skipCount`                                                 | See Contested choices                                                 |
| State            | `ratePromptDone` boolean in `local`                                  | Gate 0, approved by Rabbi                                             |
| Prompt location  | In the popup only, below the counter                                 | Never interrupts a video                                              |
| Rate target      | `…/detail/kdembckigpophgcgjfmbenkgnnkdoofe/reviews`, no `utm`        | Opens the review form directly; nothing tracked                       |
| Star             | Plain link with a ★, not GitHub's iframe button                      | The network lock blocks the iframe                                    |
| Store URL        | One constant, filled in by `popup.js`                                | DRY: the prompt and the footer share it                               |
| Validation bar   | Usual gate plus a manual pass in real Chrome                         | Rabbi's choice; jsdom can't show the popup closing on the Rate click  |
| Version          | `1.2.0`                                                              | Rabbi's choice; a new user-visible feature, nothing breaking          |

## Constraints

- Follow [tech-stack.md → Project conventions](../tech-stack.md#project-conventions).
- Fetch current docs with `ctx7` for every API the phase touches
  (`chrome.storage.local`, extension popup behaviour on link clicks, Vitest,
  jsdom) before changing code.
- Every behaviour is built test-first, as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd);
  for the code written early, each acceptance test is shown failing with
  its code removed.
- Logic lives in `src/core/`; `popup/` only wires the DOM and `chrome.*`.
- Only `src/shared/storage.js` touches `chrome.storage`; keys, defaults, the
  threshold, and the store URL live only in `src/shared/constants.js`.
- No new permission. No network requests, no data leaving the device.
- No build step for the extension itself.
