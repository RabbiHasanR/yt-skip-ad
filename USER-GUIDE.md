# Skip Ad for YouTube — User Guide

How to install, use, update, and uninstall Skip Ad for YouTube, the Chrome extension
that clicks YouTube's **Skip** button for you. For privacy, see
[PRIVACY.md](PRIVACY.md); for troubleshooting, the [README](README.md).

## Install

You need desktop Chrome.

### From the Chrome Web Store (recommended)

Open the extension's Chrome Web Store page, click **Add to Chrome**, then
**Add extension**. Chrome updates it for you. Pin it from the puzzle-piece
icon in the toolbar so its icon is always visible.

### Manually, from a zip

Use this if you got the extension as a zip instead of from the store. You
get it in one of two ways:

- **From WhatsApp:** a file named `yt-skip-ad-<version>.zip`.
- **From the shared folder:** the same zip, or a folder already unzipped.

Then:

1. **Make a permanent home for it.** Create a folder that you won't move or
   delete, for example `Documents/yt-skip-ad`. Chrome runs the extension
   from this folder every time it starts.
2. **Put the files there.** Unzip the zip into that folder (or copy the
   unzipped files into it). Check that `manifest.json` sits directly inside
   it, next to the `src`, `popup` and `icons` folders.
3. Open `chrome://extensions` in Chrome's address bar.
4. Turn on **Developer mode** (switch at the top right).
5. Click **Load unpacked** and choose the folder from step 1, the one that
   contains `manifest.json`.
6. **Skip Ad for YouTube** appears in the list. Click the puzzle-piece icon in
   Chrome's toolbar and pin it, so its icon is always visible.

Open any YouTube video: when an ad shows its Skip button, the extension
clicks it.

## Use

Click the extension's toolbar icon to open the popup:

- **Auto-skip ads:** untick to stop skipping, tick to start again. If an ad
  is showing its Skip button when you tick it, that ad is skipped.
- **Delay (seconds):** how long to wait after the Skip button appears before
  clicking it, from 0 (at once) to 10. Use the arrows, or type a number and
  press Enter.
- **Ads skipped:** how many ads the extension has skipped on this computer.
  It goes up while the popup is open. **Reset counter** sets it back to 0
  at once, with no confirmation.
- **Rating request:** after 50 ads skipped, the popup asks once for a
  rating on the Chrome Web Store. **Rate it ★** opens the reviews page;
  **×** closes it. Either way, it never asks again.
- **Footer:** links to the privacy policy, the source code (★ star it on
  GitHub if you like it), and the store reviews (**Rate**).

Changes apply straight away to open YouTube tabs; there's nothing to reload.

## Update

**From the Chrome Web Store:** nothing to do; Chrome updates it.

**From a zip:**

1. Delete the old files inside your extension folder, and put the new
   version's files in the **same folder** (same steps as installing).
2. Open `chrome://extensions` and click the round **reload** arrow on the
   Skip Ad for YouTube card. The card shows the new version number.

Your settings and skip counter are kept.

**Moving from a zip install to the store:** click **Remove** on the old card
first, then add it from the store. The store version is a separate install,
so it starts from the defaults (on, no delay, counter 0).

**Upgrading from a 0.x version** (before 1.0.0): click **Remove** on the old
Skip Ad for YouTube card first, then follow [Install](#install). This one time, your
settings and skip counter start again from the defaults (on, no delay,
counter 0). From 1.0.0 on, updates keep them.

## Uninstall

1. Open `chrome://extensions` and click **Remove** on the Skip Ad for YouTube card
   (or right-click the toolbar icon → **Remove from Chrome**).
2. If you installed from a zip, delete the extension folder.

Removing the extension also deletes its settings and skip counter.
