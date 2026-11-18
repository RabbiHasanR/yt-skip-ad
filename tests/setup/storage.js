// Test helper: put values in the mock's `chrome.storage.sync` before the code
// under test runs, as if a colleague had saved them earlier. Invalid values
// are allowed on purpose, to test the clean-up rules.

/**
 * Stores values in the `sync` area, then forgets the `set` call, so tests
 * only see the calls made by the code under test.
 *
 * @param {Record<string, unknown>} values Keys and values to store.
 * @returns {Promise<void>} Resolves once the values are stored.
 */
export async function seedStorage(values) {
  await chrome.storage.sync.set(values);
  /** @type {import('vitest').Mock} */ (chrome.storage.sync.set).mockClear();
}
