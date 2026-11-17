import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ICON_SIZES = ['16', '48', '128'];

/** @returns {any} The parsed manifest.json from the repo root. */
function readManifest() {
  return JSON.parse(readFileSync('manifest.json', 'utf8'));
}

/**
 * Lists every file path the manifest points Chrome at.
 *
 * @param {any} manifest Parsed manifest.json.
 * @returns {string[]} Repo-relative file paths.
 */
function referencedFiles(manifest) {
  return [
    ...manifest.content_scripts.flatMap((/** @type {any} */ cs) => cs.js),
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
  ];
}

describe('manifest.json', () => {
  it('asks only for storage and YouTube host access', () => {
    // GIVEN the extension manifest
    // WHEN Chrome reads its permissions
    const manifest = readManifest();
    // THEN only storage and YouTube are requested
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(['storage']);
    expect(manifest.host_permissions).toEqual(['*://*.youtube.com/*']);
    expect(manifest.optional_permissions).toBeUndefined();
    expect(manifest.optional_host_permissions).toBeUndefined();
  });

  it('every file the manifest references exists', () => {
    // GIVEN the manifest declares a content script, a popup and icons
    const manifest = readManifest();
    expect(manifest.content_scripts).not.toHaveLength(0);
    expect(manifest.action.default_popup).toBeTruthy();
    expect(Object.keys(manifest.icons)).toEqual(ICON_SIZES);
    expect(Object.keys(manifest.action.default_icon)).toEqual(ICON_SIZES);
    // WHEN Chrome loads the unpacked folder
    const missing = referencedFiles(manifest).filter(
      (path) => !existsSync(path),
    );
    // THEN no referenced file is missing
    expect(missing).toEqual([]);
  });
});
