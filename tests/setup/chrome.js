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
        changes[key] =
          key in store ? { oldValue: store[key], newValue } : { newValue };
        store[key] = newValue;
      }
      changed.fire(changes, areaName);
    }),
  };
}

beforeEach(() => {
  /** @type {any} */ (globalThis).chrome = createChromeMock();
});
