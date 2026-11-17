# YouTube Skip-Ad Extension — Basic Version Plan

**Goal:** A Chrome extension (Manifest V3, vanilla JS) that automatically clicks YouTube's **"Skip Ad"** button as soon as it appears.

**Not an ad blocker.** It only automates a click the user could make themselves. Unskippable ads still play.

---

## 1. Scope

### In scope (v1)

| #   | Feature                             | Notes                          |
| --- | ----------------------------------- | ------------------------------ |
| 1   | Auto-click "Skip Ad"                | Core feature                   |
| 2   | On/Off toggle                       | In the popup                   |
| 3   | Delay before skipping (0–10 s)      | Default `0` (skip immediately) |
| 4   | Skipped-ads counter                 | Shown in the popup             |
| 5   | Works across YouTube SPA navigation | No page reload between videos  |

### Out of scope (later versions)

- "Don't skip this ad" button injected into the player
- Per-channel rules (allow ads for channels you support)
- Countdown overlay with cancel
- Speeding up or muting unskippable ads (this is closer to ad-blocking, so skip it on purpose)
- Firefox/Edge builds

---

## 2. Tech stack

| Layer    | Choice                             | Why                                                                  |
| -------- | ---------------------------------- | -------------------------------------------------------------------- |
| Language | Vanilla JavaScript (ES2020+)       | No build step, small size, easy to debug                             |
| UI       | Plain HTML + CSS                   | The popup only has 3 controls                                        |
| Storage  | `chrome.storage.sync`              | Settings and counter shared between the popup and the content script |
| Manifest | V3                                 | Required by the Chrome Web Store                                     |
| Tooling  | None (optional: ESLint + Prettier) | Load the folder with "Load unpacked"                                 |

No background service worker is needed for v1.

---

## 3. Folder structure

```
yt-skip-ad/
├── manifest.json
├── src/
│   ├── content.js        # detects ads, clicks Skip
│   └── selectors.js      # list of Skip-button selectors (easy to update)
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 4. Architecture

```
┌──────────────────────── youtube.com tab ────────────────────────┐
│                                                                  │
│  YouTube player DOM  ──(mutations)──►  content.js                │
│                                         │                        │
│                                         ├─ is ad showing?        │
│                                         ├─ find Skip button      │
│                                         ├─ wait `delay` seconds  │
│                                         └─ button.click()        │
│                                               │                  │
└───────────────────────────────────────────────┼──────────────────┘
                                                ▼
                                    chrome.storage.sync
                               { enabled, delaySec, skipCount }
                                                ▲
                                                │
                                      popup.html / popup.js
                                 (toggle, delay input, counter)
```

- The **content script** reads its settings from storage and listens for `chrome.storage.onChanged`, so popup changes apply immediately without a reload.
- The **popup** reads and writes the same keys.

---

## 5. `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "YT Skip Ad",
  "version": "1.0.0",
  "description": "Automatically clicks YouTube's Skip Ad button when it appears.",
  "permissions": ["storage"],
  "host_permissions": ["*://*.youtube.com/*"],
  "content_scripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["src/selectors.js", "src/content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

Permissions are kept to the minimum: `storage` plus access to YouTube only. That makes Web Store review easier.

---

## 6. Storage schema

| Key         | Type          | Default | Written by     |
| ----------- | ------------- | ------- | -------------- |
| `enabled`   | boolean       | `true`  | popup          |
| `delaySec`  | number (0–10) | `0`     | popup          |
| `skipCount` | number        | `0`     | content script |

---

## 7. Content script logic (`content.js`)

### 7.1 Selectors (`selectors.js`)

YouTube renames these classes from time to time, so keep them in one list:

```js
const SKIP_SELECTORS = [
  '.ytp-skip-ad-button',
  '.ytp-ad-skip-button-modern',
  '.ytp-ad-skip-button',
];
const PLAYER_SELECTOR = '#movie_player, .html5-video-player';
const AD_SHOWING_CLASS = 'ad-showing';
```

### 7.2 Flow

1. **Init:** load `enabled` and `delaySec` from storage.
2. **Find the player:** wait until `PLAYER_SELECTOR` exists, using a document-level observer or a retry loop.
3. **Observe:** attach a `MutationObserver` to the player:
   - `attributes: true, attributeFilter: ['class']` → detects when `ad-showing` is added or removed
   - `childList: true, subtree: true` → detects when the Skip button is inserted
4. **On each mutation (throttled):**
   - If `!enabled`, return.
   - If the player doesn't have `ad-showing`, reset state and return.
   - Look for a Skip button that is visible (`offsetParent !== null`).
   - If one is found and no skip is pending for this ad:
     - mark `pending = true`
     - `setTimeout(click, delaySec * 1000)`
5. **click():**
   - Look for the button again (the DOM may have changed during the delay).
   - If it still exists and the ad is still showing, call `button.click()` and increment `skipCount` in storage.
   - Reset `pending`.
6. **SPA navigation:** listen for `yt-navigate-finish` on `window`. Re-run step 2 if the player element was replaced.
7. **Settings changes:** `chrome.storage.onChanged` updates the local `enabled` and `delaySec` values.

### 7.3 Pseudocode

```js
let settings = { enabled: true, delaySec: 0 };
let pending = false;
let observer = null;

function findSkipButton() {
  for (const sel of SKIP_SELECTORS) {
    const btn = document.querySelector(sel);
    if (btn && btn.offsetParent !== null) return btn;
  }
  return null;
}

function isAdShowing(player) {
  return player.classList.contains(AD_SHOWING_CLASS);
}

function check(player) {
  if (!settings.enabled || pending) return;
  if (!isAdShowing(player)) return;
  if (!findSkipButton()) return;

  pending = true;
  setTimeout(() => {
    const btn = findSkipButton();
    if (btn && isAdShowing(player)) {
      btn.click();
      incrementCount();
    }
    pending = false;
  }, settings.delaySec * 1000);
}
```

### 7.4 Edge cases

| Case                                                    | Handling                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| Two ads back to back                                    | `pending` resets after each click, so the second ad is handled too |
| Button exists but is hidden (countdown phase)           | Visibility check (`offsetParent`)                                  |
| User turns the extension off during the delay           | Check `settings.enabled` again inside the timeout                  |
| Player element replaced on navigation                   | Re-attach the observer on `yt-navigate-finish`                     |
| Many mutations per second                               | Throttle `check()` with `requestAnimationFrame` or a ~200 ms guard |
| `.click()` ignored (if YouTube ever checks `isTrusted`) | Known risk. Log it and investigate if it happens                   |

---

## 8. Popup (`popup/`)

### UI

```
┌──────────────────────────┐
│  YT Skip Ad              │
│                          │
│  Auto-skip     [ ON  ]   │
│  Delay (sec)   [  0 ▾]   │
│                          │
│  Ads skipped:  128       │
│  [Reset counter]         │
└──────────────────────────┘
```

### Logic (`popup.js`)

1. On load, read `enabled`, `delaySec` and `skipCount` from storage and fill in the controls.
2. Toggle change → `chrome.storage.sync.set({ enabled })`
3. Delay change → clamp to 0–10, then `set({ delaySec })`
4. Reset button → `set({ skipCount: 0 })`
5. Listen to `chrome.storage.onChanged` so the counter updates live while the popup is open.

---

## 9. Implementation steps

| Step | Task                                                     | Done when                                               |
| ---- | -------------------------------------------------------- | ------------------------------------------------------- |
| 1    | Create the folder, `manifest.json` and placeholder icons | Extension loads in `chrome://extensions` with no errors |
| 2    | `content.js` with a `console.log` on load                | Log appears in YouTube's DevTools console               |
| 3    | Player detection + `MutationObserver`                    | Logs "ad started" and "ad ended"                        |
| 4    | Skip-button detection + click (no delay)                 | Skippable ads are skipped automatically                 |
| 5    | `chrome.storage` settings + delay                        | Delay setting is respected                              |
| 6    | Skip counter                                             | Count goes up on each skip                              |
| 7    | Popup UI + wiring                                        | Toggle, delay and reset all work live                   |
| 8    | SPA navigation handling                                  | Works after clicking through 5+ videos without a reload |
| 9    | Throttling + cleanup                                     | No noticeable CPU use in Task Manager                   |
| 10   | Manual test pass (section 10)                            | All cases pass                                          |
| 11   | (Optional) Publish to the Chrome Web Store               | Listing live                                            |

---

## 10. Test plan (manual)

| #   | Scenario                            | Expected                                         |
| --- | ----------------------------------- | ------------------------------------------------ |
| 1   | Pre-roll skippable ad               | Skipped as soon as the button appears            |
| 2   | Mid-roll skippable ad (long video)  | Skipped                                          |
| 3   | Two-ad pod                          | Both skipped                                     |
| 4   | Unskippable ad                      | Plays normally, no errors                        |
| 5   | Extension toggled OFF               | Ads not skipped                                  |
| 6   | Delay = 3 s                         | Click happens about 3 s after the button appears |
| 7   | Navigate between videos (no reload) | Still works                                      |
| 8   | YouTube homepage / Shorts           | No errors in the console                         |
| 9   | Logged-in and logged-out            | Works in both                                    |
| 10  | Reopen popup                        | Settings and counter persist                     |

**Debugging tip:** open DevTools on the YouTube tab and choose the extension's content-script context in the console dropdown to see its logs.

---

## 11. Maintenance

- **Selectors break** when YouTube updates its UI. Fix: update `selectors.js` and ship a patch.
- Keep a `DEBUG` flag in `content.js` to turn verbose logging on and off.
- Optional: log a warning when `ad-showing` stays on for more than 30 s with no Skip button found. That usually means a selector has changed.

---

## 12. Publishing checklist (optional)

- [ ] Icons at 16/48/128 px
- [ ] Short description that clearly says it is **not an ad blocker** and only clicks the Skip button
- [ ] Privacy statement: no data collected, nothing sent off the device
- [ ] Justification for the minimal permissions (`storage`, `youtube.com`)
- [ ] Screenshots of the popup
- [ ] One-time Chrome Web Store developer fee paid
- [ ] Zip the folder (without `.git`) and upload

---

## 13. Roadmap after v1

| Version | Feature                                                                                 |
| ------- | --------------------------------------------------------------------------------------- |
| v1.1    | "Don't skip this ad" button injected into the player                                    |
| v1.2    | Countdown toast with a cancel option                                                    |
| v2.0    | Per-channel rules + options page (the point where a small UI library might be worth it) |
| v2.1    | Badge counter on the toolbar icon (needs a background service worker)                   |
