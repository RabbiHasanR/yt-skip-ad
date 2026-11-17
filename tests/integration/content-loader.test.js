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

  it.fails('loader imports the content entry, which logs once', async () => {
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
});
