// YouTube DOM contract: every selector, class, and event the extension relies
// on. YouTube renames these from time to time; when skipping breaks, start
// here. Agreed at Phase 1 Gate 0.

/** The main video player, first match wins; the class is a rename fallback. */
export const PLAYER_SELECTORS = ['#movie_player', '.html5-video-player'];

/** Class YouTube sets on the player while an ad plays. */
export const AD_SHOWING_CLASS = 'ad-showing';

/** Skip button inside the player, tried in order; old names for old builds. */
export const SKIP_BUTTON_SELECTORS = [
  '.ytp-skip-ad-button',
  '.ytp-ad-skip-button-modern',
  '.ytp-ad-skip-button',
];

/** Event YouTube fires on `document` after an in-page (SPA) navigation. */
export const NAVIGATE_EVENT = 'yt-navigate-finish';
