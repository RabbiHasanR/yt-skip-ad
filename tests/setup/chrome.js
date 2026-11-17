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
  };
}

beforeEach(() => {
  /** @type {any} */ (globalThis).chrome = createChromeMock();
});
