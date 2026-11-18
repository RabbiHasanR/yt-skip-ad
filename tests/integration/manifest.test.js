import { createPublicKey } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXPECTED_EXTENSION_ID,
  extensionIdFromKey,
} from '../fixtures/extension-id.js';

const ICON_SIZES = ['16', '48', '128'];
const YOUTUBE = '*://*.youtube.com/*';
const TRUSTED_CLICK = 'src/content/trusted-click.js';

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
    expect(manifest.host_permissions).toEqual([YOUTUBE]);
    expect(manifest.optional_permissions).toBeUndefined();
    expect(manifest.optional_host_permissions).toBeUndefined();
  });

  it('gives the extension the same pinned ID from its key, whatever its folder', () => {
    // GIVEN the manifest
    const manifest = readManifest();
    // WHEN Chrome derives the extension ID from its public key
    const id = extensionIdFromKey(String(manifest.key ?? ''));
    // THEN it is the pinned ID, with no folder path involved
    expect(id).toBe(EXPECTED_EXTENSION_ID);
  });

  it('its key is a 2048-bit RSA public key, never the private key', () => {
    // GIVEN the manifest's key, base64 DER as Chrome expects
    const der = Buffer.from(String(readManifest().key ?? ''), 'base64');
    // WHEN it is read as a public key (SubjectPublicKeyInfo)
    const key = createPublicKey({ key: der, format: 'der', type: 'spki' });
    // THEN it is a public RSA key of 2048 bits; a private key fails to parse
    expect(key.type).toBe('public');
    expect(key.asymmetricKeyType).toBe('rsa');
    expect(key.asymmetricKeyDetails?.modulusLength).toBe(2048);
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

  it.each([
    ['icons', (/** @type {any} */ m) => m.icons],
    ['action.default_icon', (/** @type {any} */ m) => m.action.default_icon],
  ])('icons are PNGs of their declared size (%s)', (_, pick) => {
    // GIVEN the icons the manifest declares, keyed by size
    const icons = pick(readManifest());
    // WHEN each file's PNG header is read
    const actual = Object.values(icons).map((path) => pngSize(String(path)));
    // THEN each one is a square PNG of its declared size
    const expected = Object.keys(icons).map((size) => ({
      width: Number(size),
      height: Number(size),
    }));
    expect(actual).toEqual(expected);
  });

  it('content script and web-accessible modules are YouTube-only', () => {
    // GIVEN the manifest
    const manifest = readManifest();
    // WHEN Chrome decides where to inject and what pages may fetch
    const scriptMatches = manifest.content_scripts.map(
      (/** @type {any} */ cs) => cs.matches,
    );
    const resources = manifest.web_accessible_resources;
    // THEN everything is limited to YouTube, and only our modules are exposed
    expect(scriptMatches).toEqual([[YOUTUBE], [YOUTUBE]]);
    expect(resources).toEqual([
      { resources: ['src/**/*.js'], matches: [YOUTUBE] },
    ]);
  });

  it("runs the trusted-click script in the page's world before its scripts", () => {
    // GIVEN the manifest
    const manifest = readManifest();
    // WHEN Chrome decides how to inject the trusted-click script
    const trustedClick = manifest.content_scripts.find(
      (/** @type {any} */ cs) => cs.js.includes(TRUSTED_CLICK),
    );
    // THEN it runs alone, in YouTube's own world, before YouTube's scripts
    expect(trustedClick).toEqual({
      matches: [YOUTUBE],
      js: [TRUSTED_CLICK],
      world: 'MAIN',
      run_at: 'document_start',
    });
  });
});

/**
 * Reads a PNG's dimensions from its IHDR chunk.
 *
 * @param {string} path Repo-relative path to the image.
 * @returns {{ width: number, height: number } | null} Null if not a PNG.
 */
function pngSize(path) {
  const bytes = readFileSync(path);
  const isPng = bytes.subarray(1, 4).toString('ascii') === 'PNG';
  if (!isPng) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
