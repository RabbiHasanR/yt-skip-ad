---
name: tdd
description: Build one plan.md group of the current YT Skip Ad phase spec with outside-in TDD. Writes that group's section of tests.md, gets it approved (Gate 2), then runs acceptance test → red/green/refactor per behaviour, reporting every cycle. Run manually with an optional group number or spec directory.
disable-model-invocation: true
allowed-tools: Bash(npm test *), Bash(npm run *), Bash(npx vitest *), Bash(npx playwright *), Bash(npx prettier *), Bash(npx eslint *), Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git branch *), Bash(git add *), Bash(git commit *), Bash(date *), Bash(ls *), Read, Glob, Grep, Write, Edit, AskUserQuestion
---

Build one group of the current phase spec with test-driven development.
Extra instructions from the user, if any: $ARGUMENTS

Never write production code before Gate 2 is approved, and never without a
failing test that requires it.

## 1. Gather context

Read all of these before doing anything:

- The spec directory: the newest `specs/YYYY-MM-DD-*/`, unless the user's
  extra instructions name another. Read its `requirements.md`, `plan.md`,
  `validation.md`, and `tests.md` (if it exists) in full.
- `specs/tech-stack.md`: **Development workflow (TDD)** (rules, project
  settings, test levels), **Project conventions**, **Storage schema**,
  **Popup UI standard**, and **Validation**.
- The code the group touches, and the existing tests next to it in
  `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/fixtures/`, and
  `tests/setup/`.
- `git status`, `git branch --show-current`, and `git log --oneline -10`.

Then pick the **group**: the one named in the extra instructions, otherwise
the first `plan.md` group whose `tests.md` section is missing or not
complete. Stop and ask if:

- the current branch is not the spec's branch (`phase-<N>-<slug>`);
- the working tree has uncommitted changes from outside this group;
- the group depends on an earlier group that isn't complete.

## 2. Write the group's tests.md section (Gate 2)

Fetch current docs with `ctx7` for every library or API the group touches
(Vitest, jsdom, Playwright, Chrome Extensions APIs …) before choosing test
techniques.

Add (or create `tests.md` with) a section for this group only:

```
## <Group number>. <Group name>

Behaviours: B<x>–B<y> · Branch: phase-<N>-<slug>

| #   | Behaviour | Level       | File                               | Test name                        | Status |
| --- | --------- | ----------- | ---------------------------------- | -------------------------------- | ------ |
| T1  | B3        | acceptance  | tests/integration/<file>.test.js   | clicks a visible Skip button ... | ⬜     |
| T2  | B3        | unit        | tests/unit/<module>.test.js        | ignores a hidden Skip button     | ⬜     |
```

- `tests.md` is titled `# Phase <N> — <Feature Name>: Tests` when created.
- **T1 is the acceptance test**: the group's **Acceptance** from `plan.md`,
  at the public boundary, naming the requirement.
- One row per behaviour-level test, in the order you will build them,
  simplest first. Every `validation.md` behaviour of the group has at least
  one row; no behaviour is tested twice.
- Error and edge cases get their own rows; several bad inputs share one
  parameterised test (`it.each`).
- The last slice group of the phase adds the end-to-end row
  (`tests/e2e/<journey>.spec.js`, level `e2e`).
- Follow "What to test and what to skip": no tests for private helpers,
  styling, or what Chrome or a library already guarantees.
- Status: ⬜ not started, 🔴 red, ✅ done, ➖ dropped (with a reason).

Show the section in chat and call `AskUserQuestion` once:

1. **Gate 2:** approve the test list as is, or name changes. (Recommended:
   approve.)
2. **Commits:** commit after each green behaviour (Recommended), once at the
   end of the group, or don't commit (the user commits).

Revise until approved. Then write the section to `tests.md`.

## 3. Phase 0 only: prove the setup

If the group sets up tooling (no `package.json` or test runner yet): first
add the tooling the plan names, asking before adding any dependency not
listed in `tech-stack.md`. Then write one trivial passing test and run
`npm test`. This proves a later failure is a real red, not a broken setup.

## 4. Outer loop: acceptance test

1. Write T1 in GIVEN / WHEN / THEN form.
2. Run it and show the output. Confirm it fails **for the expected reason**
   (missing behaviour, not a syntax error or a broken import).
3. Mark it `it.fails(...)`, run `npm test`, confirm the suite is green.
4. Set T1 to 🔴 in `tests.md`.

## 5. Inner loop: one test at a time

For each remaining row, in order:

1. **Behaviour:** state it in one plain sentence.
2. **Red:** write the one test. Run it (`npx vitest run <file> -t "<name>"`)
   and show it fails for the expected reason. Set the row to 🔴.
3. **Green:** write the minimum code to pass, in the files `plan.md` names
   and the layer the conventions require (logic in `src/core/`, wiring in
   `src/content/` and `popup/`). Run `npm test`; everything except T1 is
   green.
4. **Refactor:** improve names, duplication, and structure, in code and
   tests, while green. Run `npm test` again.
5. **Gate:** `npm test`, `npm run lint`, `npm run typecheck`,
   `npm run format:check` all pass. Set the row to ✅.
6. **Commit**, if chosen in Gate 2: stage only this behaviour's files and
   `tests.md`; conventional commit message
   (`feat(<scope>): <behaviour>`, `test(<scope>): …`, `refactor(<scope>): …`);
   no Co-Authored-By or AI attribution lines.

Report every cycle in this order, so the test-first sequence is visible:

1. the behaviour, in one sentence;
2. the new test, and the output showing it fails;
3. the code change, and the output showing all fast tests pass;
4. any refactor, and confirmation that tests still pass.

## 6. Close the group

1. When T1's behaviour is complete, remove `it.fails`, run `npm test`, and
   set T1 to ✅.
2. If this group has the e2e row, write it, see it fail, make it pass with
   `npm run test:e2e`, and set it to ✅.
3. Final check: `npm run test:all`, `npm run lint`, `npm run typecheck`,
   `npm run format:check`, `npm run coverage`. Look at uncovered lines for
   missed behaviours; don't add tests only to raise the number.
4. Every row is ✅ or ➖ with a reason; no `it.fails`, `it.todo`, or
   `it.skip` is left in this group's tests.

## Stop and ask

Stop and ask the user, instead of guessing, when:

- a dependency must be added;
- an existing test seems wrong (say why); never delete, skip, or loosen a
  failing test to get green;
- a test shows the agreed **Storage schema**, selectors, or `plan.md` is
  wrong;
- a behaviour is unclear, or needs a test outside the approved list (add a
  row only after the user agrees);
- you can't run the tests yourself (give the exact command and wait).

Mock only external things: `chrome.*` (via `tests/setup/`), timers
(`vi.useFakeTimers`), and the YouTube DOM (via `tests/fixtures/`). Never mock
the project's own modules.

## 7. Stop for review

Tell the user:

- the group built and its `tests.md` rows, with status;
- the commits made (or the suggested messages, if they commit themselves);
- any ➖ rows, new **Known limitations**, or decisions for
  `tech-stack.md → Decided in Phase <N>` that the last `plan.md` group
  should record;
- the next group, or, if this was the last slice group, that the
  "Verify and document" group remains.
