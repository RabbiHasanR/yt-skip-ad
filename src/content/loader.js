// Content-script loader. MV3 content scripts run as classic scripts, so this
// file can't use `import` statements. It loads the real ES-module entry with a
// dynamic import() of its extension URL (listed in web_accessible_resources).
// A failure is logged once and never thrown at the YouTube page.

import(chrome.runtime.getURL('src/content/main.js')).catch((error) => {
  console.error('[yt-skip-ad] failed to load content script', error);
});
