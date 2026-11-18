// Settings rules: turns whatever is found in storage into valid settings.
// A missing or invalid value is never an error; it becomes its default.
import {
  DEFAULT_SETTINGS,
  DELAY_SEC_MAX,
  DELAY_SEC_MIN,
} from '../shared/constants.js';

/**
 * Cleans up settings read from storage or about to be written to it.
 *
 * @param {Record<string, unknown>} raw Stored values; any may be missing or
 *   invalid.
 * @returns {import('../shared/constants.js').Settings} Valid settings.
 */
export function normalizeSettings(raw) {
  return {
    enabled:
      typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SETTINGS.enabled,
    delaySec: normalizeDelay(raw.delaySec),
  };
}

/**
 * Turns a stored delay into whole seconds within the allowed range.
 *
 * @param {unknown} value The stored delay.
 * @returns {number} Whole seconds from `DELAY_SEC_MIN` to `DELAY_SEC_MAX`.
 */
function normalizeDelay(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.delaySec;
  }
  return Math.min(DELAY_SEC_MAX, Math.max(DELAY_SEC_MIN, Math.round(value)));
}
