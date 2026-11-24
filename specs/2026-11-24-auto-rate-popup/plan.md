# Phase 7 — Auto-open rating popup: Plan

Branch: `phase-7-auto-rate-popup`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time. Per-behaviour gate: `npm test`, `npm run lint`,
`npm run typecheck`, and `npm run format:check` are green, then a
conventional commit with no Co-Authored-By or AI attribution lines.

Phase 6 tests whose behaviour this phase changes on purpose (× and Rate were
final; now they postpone) are rewritten to the new behaviour inside the
group that changes it, each change named in `tests.md`.

## 1. Groundwork

- Fetch docs with `ctx7`: `chrome.action.openPopup` (when it rejects),
  `chrome.action.setBadgeText`, `chrome.windows.getLastFocused` and window
  `state`, MV3 module service workers and top-level
  `chrome.storage.onChanged` listeners, Playwright's service-worker access.
- **Trial in real Chrome**, recorded in `tests.md`: does YouTube's video
  fullscreen make `chrome.windows.getLastFocused()` report
  `state: 'fullscreen'`? What does `openPopup()` do with Chrome unfocused
  and in fullscreen? If fullscreen isn't reported, stop and ask Rabbi.
- `src/shared/constants.js`: `RATE_FIRST_ASK_AT` (50, renamed from
  `RATE_PROMPT_THRESHOLD`), `RATE_ASK_EVERY` (100), `RATE_NEXT_ASK_AT_KEY`,
  `RATE_NEVER_ASK_KEY`, `RATE_BADGE_TEXT` ("★").
- `tests/setup/chrome.js`: `chrome.action` (`openPopup`, `setBadgeText`),
  `chrome.windows.getLastFocused`, and `storage.local.remove`, with only
  what the code calls.

## 2. Repeat asks (slice 1)

- **Behaviours:** B1–B9.
- **Acceptance:** `tests/integration/popup-rate-prompt.test.js` → "asks
  again 100 skips after the user closes the prompt".
- **Storage:** `rateNextAskAt`, `rateNeverAsk`; the one-time move from
  `ratePromptDone`.

Tasks, in build order:

- **Core:** `src/core/rate-ask.js` → `isAskDue(skipCount, state)`,
  `nextAskAfter(skipCount)`, `promptCount(skipCount)` and the state
  clean-up; replaces `src/core/rate-prompt.js`. Tests in
  `tests/unit/rate-ask.test.js` (replacing `tests/unit/rate-prompt.test.js`).
- **Core:** `src/shared/storage.js` → `getRateAsk()` (with the one-time
  move), `postponeRateAsk(skipCount)`, `stopRateAsk()`; replaces
  `isRatePromptDone` / `markRatePromptDone`. Tests in
  `tests/unit/storage.test.js`.
- **Popup:** `popup/popup.{html,css,js}`: the "Don't ask again" button, ×
  and Rate postponing, the rounded count text, live updates. Tests in
  `tests/integration/popup-rate-prompt.test.js`.

## 3. Auto-open (slice 2)

- **Behaviours:** B10–B13.
- **Acceptance:** `tests/integration/background-rate-ask.test.js` → "opens
  the popup when the 50th ad is skipped".
- **Manifest:** `background.service_worker`, `type: "module"`.

Tasks:

- **Core:** `src/core/rate-ask.js` → `crossedMilestone(oldCount, newCount,
state)`; tests in `tests/unit/rate-ask.test.js`.
- **Background:** `src/background/service-worker.js`: the top-level
  `storage.onChanged` listener, reading the ask state, calling
  `openPopup()`. Tests in `tests/integration/background-rate-ask.test.js`
  (imports the worker against the `chrome` mock).
- **Manifest:** `manifest.json` and `tests/integration/manifest.test.js`
  (the worker is declared; permissions unchanged).
- `scripts/package.js` already zips `src/`; `tests/integration/package.test.js`
  shows the worker is in both zips.

## 4. Guards (slice 3)

- **Behaviours:** B14–B16.
- **Acceptance:** `tests/integration/background-rate-ask.test.js` → "shows
  a badge instead of opening the popup in a fullscreen window".

Tasks:

- **Background:** fullscreen check, badge on a skipped or failed open, no
  badge after "Don't ask again", errors logged. Tests in
  `tests/integration/background-rate-ask.test.js`.
- **Popup:** clear the badge on open; tests in
  `tests/integration/popup-rate-prompt.test.js`.
- **End-to-end:** `tests/e2e/rate-ask.spec.js` → the real worker in
  Chromium answers a crossed milestone (with the test browser's popup
  unable to open, it sets the ★ badge; read with
  `chrome.action.getBadgeText`).

## 5. Verify and document

- Run `validation.md`, including the manual pass.
- `specs/tech-stack.md`: Storage schema rows from _planned_ to _built_
  (`ratePromptDone` removed), Stack summary, Principles ("rate us" prompts
  no longer ruled out; the worker), test levels (background integration
  tests), **Decided in Phase 7**, **Known limitations** (ignored auto-opens,
  counter reset delays, fullscreen detection).
- `docs/store/listing.md`: say the extension asks for a rating and how to
  stop it; `PRIVACY.md` if it lists what is stored.
- `README.md`, `USER-GUIDE.md`, `CHANGELOG.md`, version `1.3.0` in
  `manifest.json`, `package.json`, `package-lock.json`, store screenshots if
  the popup changed, `specs/roadmap.md` (mark Phase 7 `✅ Complete`).
