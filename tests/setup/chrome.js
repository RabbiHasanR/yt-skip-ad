// Shared test setup: a minimal `chrome` API mock, rebuilt before every test so
// no calls or state leak between tests. Extend `createChromeMock` per phase
// with only the APIs the code under test touches.
import { beforeEach, vi } from 'vitest';

const EXTENSION_ORIGIN = 'chrome-extension://test-id/';

/**
 * Builds a fresh `chrome` mock.
 *
 * @returns {object} An object shaped like the parts of `chrome.*` we use.
 */
function createChromeMock() {
  const onChanged = createEvent();
  return {
    runtime: {
      getURL: vi.fn(
        (/** @type {string} */ path) => `${EXTENSION_ORIGIN}${path}`,
      ),
    },
    storage: { sync: createStorageArea('sync', onChanged), onChanged },
  };
}

/**
 * Builds a `chrome.events.Event`-like object whose listeners can be fired.
 *
 * @returns {{ addListener: import('vitest').Mock, removeListener: import('vitest').Mock, fire: (...args: unknown[]) => void }}
 *   The event; `fire` calls every listener, as Chrome does.
 */
function createEvent() {
  /** @type {Set<(...args: unknown[]) => void>} */
  const listeners = new Set();
  return {
    addListener: vi.fn((listener) => listeners.add(listener)),
    removeListener: vi.fn((listener) => listeners.delete(listener)),
    fire: (...args) => listeners.forEach((listener) => listener(...args)),
  };
}

/**
 * Builds an in-memory `chrome.storage` area that starts empty.
 *
 * @param {string} areaName The area's name, passed to change listeners.
 * @param {ReturnType<typeof createEvent>} changed `chrome.storage.onChanged`.
 * @returns {object} An object shaped like `chrome.storage.sync`.
 */
function createStorageArea(areaName, changed) {
  /** @type {Record<string, unknown>} */
  const store = {};
  /**
   * Tells `onChanged` listeners about the changes, if there are any.
   *
   * @param {Record<string, chrome.storage.StorageChange>} changes What changed.
   */
  const report = (changes) => {
    if (Object.keys(changes).length > 0) changed.fire(changes, areaName);
  };
  return {
    // Only the defaults-object form of `get`, the one the extension uses.
    get: vi.fn(async (/** @type {Record<string, unknown>} */ defaults) =>
      Object.fromEntries(
        Object.entries(defaults).map(([key, fallback]) => [
          key,
          key in store ? store[key] : fallback,
        ]),
      ),
    ),
    set: vi.fn(async (/** @type {Record<string, unknown>} */ items) => {
      /** @type {Record<string, { oldValue?: unknown, newValue?: unknown }>} */
      const changes = {};
      for (const [key, newValue] of Object.entries(items)) {
        // Chrome stores JSON and reports only values that really changed.
        if (key in store && isSameJson(store[key], newValue)) continue;
        changes[key] =
          key in store ? { oldValue: store[key], newValue } : { newValue };
        store[key] = newValue;
      }
      report(changes);
    }),
    remove: vi.fn(async (/** @type {string | string[]} */ keys) => {
      /** @type {Record<string, { oldValue: unknown }>} */
      const changes = {};
      for (const key of [keys].flat()) {
        if (!(key in store)) continue;
        changes[key] = { oldValue: store[key] };
        delete store[key];
      }
      report(changes);
    }),
  };
}

/**
 * Tells whether two values are stored the same way, as JSON.
 *
 * @param {unknown} a One value.
 * @param {unknown} b The other value.
 * @returns {boolean} True when both serialise to the same JSON.
 */
function isSameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

beforeEach(() => {
  /** @type {any} */ (globalThis).chrome = createChromeMock();
});
