# Privacy Policy — Skip Ad for YouTube

_Last updated: 25 November 2026 · Applies to version 1.1.0 and later_

**Short version: Skip Ad for YouTube collects nothing.** No personal data, no browsing
history, no analytics, no crash reports, no identifiers. It has no account,
no server, and makes no network requests.

## What the extension stores, and where

Four values, kept **only on your computer**, in Chrome's own extension
storage (`chrome.storage.local`):

| Value            | What it is                                            |
| ---------------- | ----------------------------------------------------- |
| `enabled`        | Whether auto-skip is on                               |
| `delaySec`       | Seconds to wait before clicking Skip (0–10)           |
| `skipCount`      | How many ads the extension has skipped for you        |
| `ratePromptDone` | Whether you answered the rating request (since 1.2.0) |

These values are never sent anywhere, and Chrome Sync doesn't copy them to
your other devices. Removing the extension deletes them.

_Upgrading from 1.0.0:_ version 1.0.0 kept the two settings in Chrome Sync
storage. 1.1.0 moves them to this computer and deletes them from Chrome Sync.

## What the extension reads

To work, the extension watches YouTube's video player for the **Skip** button
and clicks it. It looks only at the player's state (is an ad showing, is the
Skip button visible). It does not read, store, or send what you watch,
search, or type, and it does nothing on any other website.

## Permissions, and why

| Permission                                   | Why                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Storage**                                  | To remember your two settings, the skip counter, and whether you answered the rating request, on your computer                        |
| **Read and change your data on youtube.com** | To see when an ad's Skip button appears and click it. This is how Chrome words the permission every extension needs to run on a site. |

That's all. No access to other sites, tabs, history, downloads, or cookies.

## Check it yourself

You don't have to take our word for it:

1. **Permissions:** open `chrome://extensions`, click **Details** on YT Skip
   Ad, and read **Permissions** and **Site access**: only youtube.com.
2. **Network:** open the popup, right-click it, choose **Inspect**, and open
   the **Network** tab. Use the popup: no requests appear. On a YouTube page,
   DevTools → Network shows nothing coming from the extension.
3. **Blocked by Chrome:** in that same popup DevTools console, run
   `fetch('https://example.com')`. Chrome refuses it with a Content Security
   Policy error: the extension's manifest forbids its pages from connecting
   to anything.
4. **Storage:** in the popup console, `await chrome.storage.local.get(null)`
   shows everything the extension keeps: the four values above.
5. **Source code:** every line is public at
   <https://github.com/RabbiHasanR/yt-skip-ad>. It is not minified and has no
   build step, so the code in the repo is the code Chrome runs.

## Our pledge

- This extension will **never be sold** or handed over to another owner.
- It will **never add tracking**, analytics, ads, or remote code.
- If that ever had to change, it would be a new extension, not an update to
  this one.

## Children

The extension collects no data from anyone, including children under 13.

## Changes to this policy

Any change is made in this file, in the public repo, so its full history is
visible. The date at the top shows the last change.

## Contact

Questions or concerns: open an issue at
<https://github.com/RabbiHasanR/yt-skip-ad/issues>.
