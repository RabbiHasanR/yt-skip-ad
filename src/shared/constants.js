// Shared constants. Storage keys and defaults join this file in Phase 2.

/** Prefix for every console line the extension writes; easy to filter. */
export const LOG_PREFIX = '[yt-skip-ad]';

/**
 * Wait from the first player change to the check it triggers; changes in
 * between share that check. Well inside the mission's ~0.5 s skip target.
 */
export const CHECK_THROTTLE_MS = 100;
