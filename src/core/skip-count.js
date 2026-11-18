// Skip counter rules: turns whatever is found in storage into a valid count.
// A missing or invalid value is never an error; it becomes the default.
import { DEFAULT_SKIP_COUNT } from '../shared/constants.js';

/**
 * Cleans up a skip count read from storage.
 *
 * @param {unknown} raw The stored count; may be missing or invalid.
 * @returns {number} A whole number of skips, at least 0.
 */
export function normalizeSkipCount(raw) {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
    return DEFAULT_SKIP_COUNT;
  }
  return Math.floor(raw);
}
