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

/**
 * Reads the popup's delay field. An empty or non-numeric field means there
 * is nothing to save (`Number('')` would otherwise read as 0).
 *
 * @param {string} value The field's text.
 * @returns {number | null} A valid delay, or null to keep the stored one.
 */
export function parseDelayField(value) {
  const number = value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(number) ? normalizeDelay(number) : null;
}
