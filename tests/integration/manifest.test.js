import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** @returns {any} The parsed manifest.json from the repo root. */
function readManifest() {
  return JSON.parse(readFileSync('manifest.json', 'utf8'));
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
});
