# Phase 7 — Auto-open rating popup: Tests

## 1. Groundwork

### Real-Chrome trial (2026-11-25)

Chrome 158.0.8127.36 (Official Build, x86_64) on Linux (Fedora 44), with the
1.2.0 extension loaded unpacked. Run by Rabbi from the popup page opened as a
tab: a timer read `chrome.windows.getLastFocused()` 8 seconds after it
started and, where noted, called `chrome.action.openPopup()`.

| Step | Situation                                        | `state`      | `focused` | `openPopup()`                                                                |
| ---- | ------------------------------------------------ | ------------ | --------- | ---------------------------------------------------------------------------- |
| 1    | YouTube tab playing in the same window           | `maximized`  | `true`    | Opened: the popup appeared with the rating prompt and the video kept playing |
| 2    | Baseline, the extension's tab in front           | `maximized`  | `true`    | Not called                                                                   |
| 3    | YouTube video in fullscreen (F)                  | `fullscreen` | `true`    | Rejected: "Browser window has no toolbar."                                   |
| 4    | Another app in front (Chrome not the active app) | `maximized`  | `false`   | Rejected: "Could not find an active browser window."                         |

Results:

- YouTube's video fullscreen is reported as `state: 'fullscreen'`, so the
  planned check works and no fallback is needed.
- Chrome rejects `openPopup()` in fullscreen and when unfocused instead of
  opening it. The worker still checks `focused` and `state` first
  ([requirements.md → Guards](requirements.md#guards)), because other
  platforms may differ (for example, macOS can keep the toolbar in
  fullscreen).
