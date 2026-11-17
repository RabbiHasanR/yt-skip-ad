import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const LOADER = '../../src/content/loader.js';

/**
 * Makes `chrome.runtime.getURL` resolve packaged paths to files in this repo,
 * like Chrome resolves them inside the unpacked extension folder.
 */
function resolveExtensionFilesFromRepo() {
  vi.mocked(chrome.runtime.getURL).mockImplementation(
    (path) => pathToFileURL(resolve(path)).href,
  );
}

describe('content script loader', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('loader imports the content entry, which logs once', async () => {
    // GIVEN the extension files are reachable, as on a YouTube page
    resolveExtensionFilesFromRepo();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    // WHEN Chrome runs the classic loader script
    await import(LOADER);
    // THEN the content entry logs once
    await vi.waitFor(() => expect(log).toHaveBeenCalled());
    expect(log).toHaveBeenCalledExactlyOnceWith(
      '[yt-skip-ad] content script loaded',
    );
  });

  it('logs one prefixed error when the entry fails to load', async () => {
    // GIVEN the content entry can't be fetched
    vi.mocked(chrome.runtime.getURL).mockReturnValue(
      pathToFileURL(resolve('src/content/missing.js')).href,
    );
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // WHEN Chrome runs the classic loader script
    await import(LOADER);
    // THEN one prefixed error is logged, and nothing is thrown at the page
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(error).toHaveBeenCalledExactlyOnceWith(
      '[yt-skip-ad] failed to load content script',
      expect.any(Error),
    );
  });
});
