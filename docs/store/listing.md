# Chrome Web Store listing

Everything to paste into the
[Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole),
tab by tab. Kept in the repo so the listing and the code change together.

## Before the first upload

- [ ] Developer account registered (one-time fee), 2-step verification on,
      contact email verified.
- [ ] **Trader / non-trader** declaration filled in (EU Digital Services
      Act). A trader's address and contact details are shown publicly.
- [ ] GitHub repo public, so the privacy policy and source links work:
      <https://github.com/RabbiHasanR/yt-skip-ad>.
- [ ] Release commit tagged (e.g. `v1.1.0`), then `npm run package:store`.
- [ ] Upload `dist/yt-skip-ad-<version>-store.zip`.

## Package tab

Upload the store zip. It is the repo's extension files with `key` removed
from `manifest.json`; the store assigns the extension's ID.

## Store listing tab

**Name** (from the manifest): Skip Ad for YouTube

**Summary** (the manifest `description`, max 132 characters):

> Clicks YouTube's Skip Ad button for you. Collects no data: no tracking, no
> network requests, open source.

**Description:**

```text
Skips the ad for you. Collects nothing.

When a YouTube ad shows its "Skip" button, Skip Ad for YouTube clicks it, so you don't have to watch the corner of the screen.

🔒 PRIVACY FIRST
• No data collected. No account, no analytics, no tracking, no servers.
• No network requests. Chrome itself blocks the extension's pages from connecting anywhere (Content Security Policy: connect-src 'none').
• Settings stay on your computer. They are not synced or sent anywhere.
• Two permissions only: storage (your settings) and youtube.com (to click Skip).
• Open source, with no build step: the code on GitHub is exactly the code Chrome runs.
• Pledge: this extension will never be sold and will never add tracking.

Don't take our word for it: the privacy policy has a two-minute "check it yourself" guide (DevTools Network tab, permissions, storage, source).

✅ WHAT IT DOES
• Clicks Skip as soon as a skippable ad allows it.
• Keeps working as you move from video to video.
• Optional delay of 0–10 seconds, if you like to glance at the ad first.
• On/off switch in the toolbar popup.
• Counter of ads skipped, kept only on this computer.
• Light and dark mode.

ℹ️ WHAT IT DOESN'T DO
It is not an ad blocker: ads still start, and unskippable ads play to the end. It never hides, mutes, or speeds up an ad.

Source code and issues: https://github.com/RabbiHasanR/yt-skip-ad

YouTube is a trademark of Google LLC. This extension is not affiliated with or endorsed by Google or YouTube.
```

**Category:** Tools (or the dashboard's closest match, such as "Tools" under
Productivity).

**Language:** English.

**Graphic assets** (in this folder):

| Field            | File                        | Size     |
| ---------------- | --------------------------- | -------- |
| Store icon       | `../../icons/icon128.png`   | 128×128  |
| Screenshot 1     | `screenshot-1-skip.png`     | 1280×800 |
| Screenshot 2     | `screenshot-2-privacy.png`  | 1280×800 |
| Screenshot 3     | `screenshot-3-settings.png` | 1280×800 |
| Small promo tile | `promo-small.png`           | 440×280  |

**Official URL:** none (needs a verified domain). **Homepage URL:**
<https://github.com/RabbiHasanR/yt-skip-ad>. **Support URL:**
<https://github.com/RabbiHasanR/yt-skip-ad/issues>.

## Privacy practices tab

**Single purpose:**

> Automatically clicks the Skip Ad button on YouTube videos when it becomes
> available.

**Permission justifications:**

| Permission                            | Justification                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `storage`                             | Saves the user's two settings (auto-skip on/off, delay in seconds) and a count of ads skipped, in chrome.storage.local on the user's device. Nothing is synced or transmitted. |
| Host permission `*://*.youtube.com/*` | The content script must run on YouTube pages to detect when the video player shows a skippable ad and click its Skip button. It runs on no other site.                         |

**Content scripts note** (if the reviewer asks why a script runs in the
page's world): `src/content/trusted-click.js` runs in YouTube's page world
because YouTube ignores clicks whose `event.isTrusted` is false. It wraps
only click listeners added to the Skip button, so they see the extension's
click as trusted. It reads nothing and sends nothing.

**Are you using remote code?** No, I am not using remote code. (All
JavaScript is in the package; modules are loaded with `import()` from the
extension's own files.)

**Data usage: what user data do you plan to collect?** Tick **none** of:
personally identifiable information, health, financial and payment,
authentication, personal communications, location, web history, user
activity, website content.

**Certifications:** tick all three:

- [x] I do not sell or transfer user data to third parties, outside of the
      approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to
      my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or
      for lending purposes.

With no data type ticked, the store page shows: _"The developer has
disclosed that it will not collect or use your data."_

**Privacy policy URL:**
<https://github.com/RabbiHasanR/yt-skip-ad/blob/main/PRIVACY.md>

## Distribution tab

Visibility **Public**, all regions, free.

## Images

The PNGs are rendered from the HTML in [`src/`](src/) with Playwright, which
the repo already has:

```sh
cd docs/store/src
npx playwright screenshot --viewport-size=1280,800 "file://$PWD/screenshot-1-skip.html" ../screenshot-1-skip.png
npx playwright screenshot --viewport-size=1280,800 "file://$PWD/screenshot-2-privacy.html" ../screenshot-2-privacy.png
npx playwright screenshot --viewport-size=1280,800 "file://$PWD/screenshot-3-settings.html" ../screenshot-3-settings.png
npx playwright screenshot --viewport-size=440,280 "file://$PWD/promo-small.html" ../promo-small.png
```

`src/popup-light.png` and `src/popup-dark.png` are screenshots of the real
popup (at 2× scale, with 1,284 ads skipped), taken from the loaded
extension. Retake them after any popup change.
