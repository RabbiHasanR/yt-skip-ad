---
name: feature-spec
description: Start the next YT Skip Ad roadmap phase. Find it in specs/roadmap.md, create its branch, ask the user grouped questions, agree any storage-schema or selector changes, then write specs/YYYY-MM-DD-<feature>/{requirements,plan,validation}.md. Run manually with an optional feature hint.
disable-model-invocation: true
allowed-tools: Bash(git status *), Bash(git branch *), Bash(git switch *), Bash(git log *), Bash(git rev-parse *), Bash(date *), Bash(ls *), Bash(npx prettier *), Read, Glob, Grep, Write, Edit, AskUserQuestion
---

Write the feature spec for the next piece of YT Skip Ad work. Extra
instructions from the user, if any: $ARGUMENTS

Never write a file before step 5. The user answers the questions and approves
any storage or selector changes first.

## 1. Gather context

Read all of these before deciding anything:

- `specs/roadmap.md`: the phases, their sub-slices, and which are marked
  `✅ Complete` (the others say `⏳ Not started`, `🚧 In progress` or
  `🔍 In review`).
- `specs/mission.md`: scope, users (developer, office colleagues), and what
  success looks like.
- `specs/tech-stack.md`: **Principles**, **Stack summary**, **Storage
  schema** (the current keys; Gate 0 compares against it), every
  **Decided in Phase N**, **Project conventions**, **Validation**,
  **Development workflow (TDD)** (rules, project settings, test levels),
  **Popup UI standard**, **Distribution**, **Known limitations**, and
  **Deferred decisions**. Note every item marked _(to confirm)_ or
  _Proposal_.
- `docs/PLAN.md`: the original plan (flow, pseudocode, edge cases, manual
  test plan). Use it for detail; the specs win where they differ.
- Every existing `specs/YYYY-MM-DD-*/` directory. Read the newest one in full;
  it is the template for tone, structure, and level of detail. If there is
  none yet, this skill's step 5 is the template.
- What code exists: `ls src popup icons tests`, `manifest.json`,
  `package.json`, `src/shared/constants.js`, `src/core/selectors.js`, and
  `git log --oneline -15`.
- `git rev-parse --is-inside-work-tree`, `git status`, and `git branch -a`.

## 2. Pick the feature and branch

- **Feature:** the first roadmap phase not marked `✅ Complete`. If the user's
  extra instructions name a feature or phase, use that one instead. If every
  phase is complete, compare `mission.md` with the code and existing specs,
  list the gaps (unmet mission promises, deferred decisions, known
  limitations, the roadmap's **Later** list), and let the user choose in
  step 3.
- **Name:** a short kebab-case slug, e.g. `auto-skip`.
- **Directory:** `specs/<today>-<slug>/`, where today comes from `date +%F`.
- **Branch:** `phase-<N>-<slug>`, where N is the roadmap phase number.
  - If the folder is not a Git repository yet, stop and ask the user whether
    to run `git init` (with `main` as the default branch) first.
  - If the working tree has uncommitted changes, stop and ask the user what
    to do with them.
  - Branch from `main` unless the user says otherwise:
    `git switch -c <branch> main`.
  - If the branch already exists, ask before reusing it.

## 3. Ask the user (required, before writing anything)

Call `AskUserQuestion` once, with one question per file you will write:

1. **requirements.md:** scope. Which roadmap items are in this phase? Use
   `multiSelect` and give each option's trade-off in its description.
2. **plan.md:** how to slice the phase into groups, e.g. one group per
   roadmap sub-slice, the thinnest end-to-end version first, or a sub-branch
   per group. The order inside a group is fixed (core → content/popup
   wiring, see step 5), so don't ask about it.
3. **validation.md:** the merge bar beyond the existing gate, e.g. current
   checks only, plus a manual pass on real YouTube, plus CI green once a
   remote exists.

Rules for the questions:

- Ground every option in what you read; name real files, storage keys,
  selectors, DOM events (`yt-navigate-finish`), and roadmap sub-slices.
- Put your recommended option first, with "(Recommended)" in its label.
- Ask a 4th question only for a decision that changes the spec's shape and
  can't be settled by a sensible default. The usual case: a **Deferred
  decision** in `tech-stack.md` that this phase is the first to depend on
  (e.g. content-script module loading in Phase 0, a stable extension `key`
  before Phase 4). If several apply, put the most important one in the
  question and propose defaults for the rest. Storage and selector choices
  are not asked here; they belong to step 4.
- Make smaller decisions yourself. Record them in the Decisions table and
  point them out in step 6.

## 4. Agree storage and selectors (Gate 0, when they change)

Skip this step only when the phase adds or changes no storage key, default,
selector, manifest permission or `web_accessible_resources` entry; say so to
the user.

This is a discussion, not a form. Present a draft in chat, discuss it, revise
it, and repeat until the user approves it. Write nothing to disk until then.

The draft, for what this phase adds or changes:

1. **Storage keys:** `| Key | Area | Type | Default | Valid range | Written by | Why |`.
   Area is `sync` unless there's a reason (e.g. `local` for something that
   shouldn't follow the user across devices).
2. **Selectors and DOM signals:** each selector or class the content script
   relies on, what it detects, and its fallback.
3. **Manifest changes:** permissions, host permissions, content scripts,
   `web_accessible_resources`, each with why. Every new permission needs a
   strong reason (Principles: minimal permissions).
4. **Contested choices only**, each as numbered options with pros and cons
   and your recommendation first, e.g. throttle with `requestAnimationFrame`
   or a time guard; counter in `sync` or `local`; observe the player or the
   whole document.
5. **Upgrade impact:** what happens to a colleague's existing settings and
   counter when they replace the folder with this version.
6. **Rules that become behaviours:** each clamp, default, fallback, or
   permission limit a user could notice, worded as a behaviour for
   `validation.md`.

Settle small choices yourself and list them so the user can push back. When
the user approves, the agreed design is the target for TDD: changes follow
it, and a test that shows it is wrong means stopping to ask.

## 5. Write the spec

Create `specs/<today>-<slug>/` with three files. A fourth, `tests.md`, is
written later by `/tdd`, one group at a time; don't create it here. Title
each file `# Phase <N> — <Feature Name>: <Requirements|Plan|Validation>`.
If step 4 agreed storage changes, also update
`specs/tech-stack.md → Storage schema`: add or change rows marked
`_(Phase <N>, planned)_` and settle any _(to confirm)_ note it resolved.

Use the mission's words (**ad**, **Skip button**, **settings**, **delay**,
**skip counter**, popup, colleague). Parts are `[core]`, `[content]`,
`[popup]`, `[manifest]`; write sections only for the parts the phase touches.

### `requirements.md`: scope, decisions, context

- `## Context`: where this phase sits in the roadmap, what earlier phases
  delivered, and which mission goals it serves. Link `../mission.md`,
  `../roadmap.md`, `../tech-stack.md`, and the relevant `../../docs/PLAN.md`
  sections.
- `## Scope`: **In scope** and **Out of scope** bullet lists. Each popup item
  cites
  [tech-stack.md → Popup UI standard](../tech-stack.md#popup-ui-standard).
- `## Features` with a `### <feature>` per feature when the phase has more
  than one. Each lists its rules and edge cases (from `docs/PLAN.md` §7.4
  where relevant).
- `## Storage and selectors`: only the delta agreed in step 4, with the
  reason for each contested choice. Skip the section if step 4 was skipped.
- `## Decisions`: a `| Decision | Choice | Why |` table, including the user's
  answers from steps 3 and 4.
- `## Constraints`: the project conventions, plus:
  - fetch current docs with `ctx7` for every library or API the phase
    touches (Chrome Extensions MV3 APIs, Vitest, jsdom, Playwright, ESLint,
    Prettier …) before coding;
  - every behaviour is built test-first, as in
    [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd);
  - logic lives in `src/core/`; `src/content/` and `popup/` only wire the
    DOM and `chrome.*`;
  - only `src/shared/storage.js` touches `chrome.storage`; keys and defaults
    live only in `src/shared/constants.js`; selectors only in
    `src/core/selectors.js`;
  - no new permission without the user's agreement;
  - no network requests, no data leaving the device;
  - no build step for the extension itself.

### `plan.md`: numbered task groups

- Short intro: the branch; that each group is built with `/tdd`, one group
  per run (Gate 2 on `tests.md` first), using outside-in TDD as in
  [tech-stack.md → Development workflow (TDD)](../tech-stack.md#development-workflow-tdd)
  (acceptance test first, marked `it.fails(...)`, then red → green →
  refactor one test at a time); and the per-behaviour gate (`npm test`,
  `npm run lint`, `npm run typecheck`, `npm run format:check` green, then a
  conventional commit with no Co-Authored-By or AI attribution lines). For
  Phase 0, the gate starts once group 1 has created `package.json`.
- `## 1. Groundwork`: fetch the relevant docs with `ctx7`, plus any
  constants (`src/shared/constants.js`), manifest changes, fixtures in
  `tests/fixtures/`, and `chrome` mock additions in `tests/setup/`.
- `## 2. <slice> (slice 1)`, `## 3. …`: one group per vertical slice, in the
  order the user chose. Each group starts with:
  - **Behaviours:** the `validation.md` IDs it delivers (e.g. B1–B4).
  - **Acceptance:** the acceptance test (file and test name) in
    `tests/integration/`.
  - **Storage/selectors:** the keys, selectors, or manifest entries this
    group adds or changes, if any.

  Then the tasks in build order, naming the real files:
  - **Core:** `src/core/<module>.js`, `src/shared/…`; tests in
    `tests/unit/<module>.test.js`.
  - **Content:** `src/content/<entry>.js`; tests in
    `tests/integration/content-<feature>.test.js` against
    `tests/fixtures/…`.
  - **Popup:** `popup/popup.{html,css,js}`; tests in
    `tests/integration/popup-<feature>.test.js`.

  No separate **Tests:** task: tests are written first, inside each task.
  The last slice group also names the phase's one end-to-end test,
  `tests/e2e/<journey>.spec.js`.

- Last group, `## N. Verify and document`: run `validation.md`; update
  `specs/tech-stack.md` (change this phase's **Storage schema** rows from
  _planned_ to _built_ and match them to `src/shared/constants.js`; record
  decisions under **Decided in Phase <N>**,
  turn _(to confirm)_ / _Proposal_ into decided, remove resolved **Deferred
  decisions**, add **Known limitations**), `README.md`, `manifest.json`
  version if the build will be shared, and `specs/roadmap.md` (mark the
  phase `✅ Complete` and link its spec); add a `CHANGELOG.md` entry.

### `validation.md`: how to know it's done and mergeable

- Opening line: the clean-checkout setup (`npm ci`, then load the folder
  with "Load unpacked" in `chrome://extensions`), and that a colleague's
  existing settings and counter survive the upgrade.
- `## Behaviours`: **Gate 1**. Numbered `B1`, `B2`, … across the whole phase,
  grouped under `### <feature>`. Each is one short plain sentence a
  non-developer can check, ending with the parts it touches, e.g.
  `B3 — A hidden Skip button is never clicked. [core] [content]`. Include
  error and edge cases as their own behaviours, and the rules from step 4.
  Always include, where they apply:
  - no click when auto-skip is off, or turned off during the delay;
  - no errors on pages without a player (home page, Shorts);
  - invalid stored values fall back to the defaults;
  - nothing is sent off the device.

  No test names or levels here; TDD turns behaviours into test cases in
  `tests.md`, one group at a time.

- `## Automated checks`: a `| Check | Command | Pass criteria |` table: fast
  tests (`npm test`, under 10 s), all tests with end-to-end
  (`npm run test:all`), lint (`npm run lint`), type checks
  (`npm run typecheck`), format (`npm run format:check`), coverage
  (`npm run coverage`, ~70% guide), dist zip (`npm run package` once it
  exists, containing only extension files), plus anything the user added.
- `## TDD record`: every group's `tests.md` section is complete: each
  selected test is ✅, each unticked test has a reason, and no `it.fails` or
  `it.todo` mark is left.
- `## Manual checks`: numbered. Always include: loads in
  `chrome://extensions` with no errors; the matching items from
  [tech-stack.md → Validation](../tech-stack.md#validation)'s manual pass on
  real YouTube; for popup changes, light and dark mode at the popup's fixed
  width and keyboard-only use; and the extension's CPU use in Chrome's Task
  Manager.
- `## Done means`: all checks pass; tech-stack, README, roadmap, and
  changelog are updated; no `node_modules/`, `dist/`, or secrets are
  committed.

Then run `npx prettier --write specs/<today>-<slug> specs/tech-stack.md`.

## 6. Stop for review

Don't commit. Tell the user:

- the branch and directory created;
- one line per file on what it covers;
- a numbered list of the decisions **you** made (the ones they weren't asked
  about), so they can push back;
- that `validation.md → ## Behaviours` is Gate 1: they should review it
  closely, and add, remove or reword behaviours before any code is written;
- that they can say "commit it". The commit is then
  `docs(specs): add phase <N> <slug> spec` with only the spec directory
  (and `specs/tech-stack.md` if the storage schema changed) staged, and no
  Co-Authored-By or AI attribution lines;
- that the next step is `/tdd`, which builds `plan.md` one group at a time.
