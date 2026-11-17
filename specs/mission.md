# YT Skip Ad — Mission

## What it is

**YT Skip Ad** is a Chrome extension (Manifest V3) that clicks YouTube's
**Skip button** as soon as it appears on a skippable **ad**. Users control it
through a small popup: an on/off toggle and a skip **delay** (the
**settings**), plus a **skip counter**. It is **not an ad blocker**:
unskippable ads still play, and it never hides, mutes, or speeds up an ad.

## Why it exists

Clicking "Skip" by hand on every ad is tedious and means watching the screen.
Ad blockers go further than wanted: ads playing is fine, babysitting the Skip
button is not. Building it is also a hands-on way to learn Manifest V3
extensions.

## Scope (v1 — Focused MVP)

In scope:

- The extension clicks the **Skip button** automatically when it becomes
  visible during an **ad**.
- A user turns auto-skip **on or off** from the popup.
- A user sets a **delay** of 0–10 seconds before the click (default 0).
- A user sees the **skip counter** in the popup and can reset it.
- Auto-skip keeps working across YouTube's in-page (SPA) navigation, with no
  reload between videos.
- A colleague installs the extension by following the README alone.

Out of scope for v1 (revisit later): "Don't skip this ad" button in the
player, per-channel rules, countdown overlay with cancel, muting or speeding up
unskippable ads, toolbar badge counter, Firefox/Edge builds, public Chrome Web
Store release.

## Who it's for

- **Developer (Rabbi)** — builds and maintains it, and uses it daily on desktop
  Chrome.
- **Office colleagues** — install it on their own desktop Chrome so they stop
  clicking "Skip" by hand.

## Stakeholder goals this serves

- **Rabbi Hasan (developer and user):** a reliable auto-skip with **minimal
  permissions**, simple code with **no build step**, and a project that
  teaches MV3, built with **spec-driven development** and **TDD**.
- **Office colleagues (users):** an install that is easy to follow and an
  extension that simply works, with no data leaving their machine.

## Success looks like

- With delay 0, a skippable ad is skipped within about 0.5 s of the Skip
  button appearing.
- Auto-skip still works after clicking through 5+ videos without a reload.
- Toggle and delay changes apply immediately, without reloading the page.
- No console errors from the extension on the YouTube home page, Shorts, or
  watch pages.
- CPU use from the extension is negligible in Chrome's Task Manager.
- A colleague can install it from the README without help.
