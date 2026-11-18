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
  return {
    runtime: {
      getURL: vi.fn(
        (/** @type {string} */ path) => `${EXTENSION_ORIGIN}${path}`,
      ),
    },
    storage: { sync: createStorageArea() },
  };
}

/**
 * Builds an in-memory `chrome.storage` area that starts empty.
 *
 * @returns {object} An object shaped like `chrome.storage.sync`.
 */
function createStorageArea() {
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
      Object.assign(store, items);
    }),
  };
}

beforeEach(() => {
  /** @type {any} */ (globalThis).chrome = createChromeMock();
});
