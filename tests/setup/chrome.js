// Shared test setup: a minimal `chrome` API mock. Extend it per phase with
// only the APIs the code under test touches.

const EXTENSION_ORIGIN = 'chrome-extension://test-id/';

/** @type {any} */ (globalThis).chrome = {
  runtime: {
    /** @param {string} path */
    getURL: (path) => `${EXTENSION_ORIGIN}${path}`,
  },
};
