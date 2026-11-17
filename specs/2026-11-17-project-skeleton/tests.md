# Phase 0 — Project Skeleton: Tests

## 1. Groundwork

Behaviours: none (tooling) · Branch: phase-0-project-skeleton

| #   | Behaviour | Level | File                      | Test name                                      | Status |
| --- | --------- | ----- | ------------------------- | ---------------------------------------------- | ------ |
| T1  | setup     | unit  | tests/unit/sanity.test.js | runs in a jsdom environment with a document    | ✅     |
| T2  | setup     | unit  | tests/unit/sanity.test.js | chrome.runtime.getURL returns an extension URL | ⬜     |
| T3  | setup     | unit  | tests/unit/sanity.test.js | chrome mock calls are reset between tests      | ⬜     |

No acceptance test: this group has no user-facing behaviour (`plan.md` names
none). Lint, typecheck and format:check are proven by running them green on
the new configs, not by tests. T3 uses two tests in one `describe`, relying on
Vitest running a file's tests in order; it is the only order-dependent test,
by design.
