# Phase 6 — Store rating: Plan

Branch: `phase-6-store-rating`.

Each group is built with `/tdd`, one group per run (Gate 2 on `tests.md`
first), using outside-in TDD as in
[tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd):
acceptance test first, marked `it.fails(...)`, then red → green → refactor
one test at a time. Per-behaviour gate: `npm test`, `npm run lint`,
`npm run typecheck`, and `npm run format:check` are green, then a
conventional commit with no Co-Authored-By or AI attribution lines.

**Code written before this spec:** it is on the branch, uncommitted. For each
test, temporarily remove the code it covers, see the test fail for the
expected reason, restore the code, see it pass, and only then tick it in
`tests.md` (noting "test written after the code"). Commit per group.

## 1. Groundwork

- Fetch docs with `ctx7`: `chrome.storage.local` `get` with defaults; what
  happens to an extension popup when a `target="_blank"` link opens a tab
  (does a `storage.set` started in the click handler finish?).
- `src/shared/constants.js`: `STORE_REVIEWS_URL`, `RATE_PROMPT_THRESHOLD`,
  `RATE_PROMPT_DONE_KEY`.
- No manifest change, no new fixtures or `chrome` mock additions.

## 2. Rating prompt (slice 1)

- **Behaviours:** B1–B7.
- **Acceptance:** `tests/integration/popup-rate-prompt.test.js` → "asks for
  a rating at the threshold, naming it".
- **Storage:** `ratePromptDone` (`local`).

Tasks, in build order:

- **Core:** `src/core/rate-prompt.js` → `shouldShowRatePrompt`; tests in
  `tests/unit/rate-prompt.test.js`.
- **Core:** `src/shared/storage.js` → `isRatePromptDone`,
  `markRatePromptDone`; tests in `tests/unit/storage.test.js`.
- **Popup:** `popup/popup.{html,css,js}`: the hidden prompt card, the
  threshold text, the show/hide rule on load and on `watchSkipCount`, both
  controls marking it done; tests in
  `tests/integration/popup-rate-prompt.test.js`.

## 3. Footer links (slice 2)

- **Behaviours:** B8–B10.
- **Acceptance:** `tests/integration/popup-privacy.test.js` → "links to the
  store reviews, so users can rate it".

Tasks:

- **Popup:** `popup/popup.html` footer (two lines, Rate link, ★ on Source),
  `popup/popup.css` (`.privacy-note`), `popup/popup.js` fills every
  `data-store-reviews` link; tests in
  `tests/integration/popup-privacy.test.js` (link lookup ignores
  `aria-hidden` parts; Rate added to the new-tab test).
- No new end-to-end test (validation choice); the existing e2e suite must
  stay green, `network-lock.spec.js` included.

## 4. Verify and document

- Run `validation.md`, including the manual pass.
- `specs/tech-stack.md`: `ratePromptDone` row from _planned_ to _built_,
  matched to `src/shared/constants.js`; Stack summary database row;
  **Decided in Phase 6**; **Known limitations** (a reset before the prompt
  is seen delays it); **Popup UI standard** (links and the prompt).
- `specs/mission.md` (Phase 6 in scope), `specs/roadmap.md` (mark Phase 6
  `✅ Complete`), `README.md`, `USER-GUIDE.md` if it describes the popup,
  `CHANGELOG.md`, `manifest.json` and `package.json` version `1.2.0`.
