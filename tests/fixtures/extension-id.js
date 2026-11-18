// The extension's ID, as Chrome derives it from the manifest `key`. Shared
// by the manifest test (which pins it) and the e2e fixtures (which open the
// popup at it), so both agree with what Chromium computes.
import { createHash } from 'node:crypto';

/**
 * The ID Chrome gives this extension, from the public key in manifest.json.
 * A changed or broken key no longer matches it.
 */
export const EXPECTED_EXTENSION_ID = 'efdhjhghkcidlflkhipiaijdemjjknbl';

/**
 * Works out an extension's ID from its manifest `key` the way Chrome does:
 * SHA-256 of the decoded public-key bytes, first 32 hex digits, each mapped
 * 0–f to a–p. The folder path plays no part.
 *
 * @param {string} base64Key The manifest's `key` value.
 * @returns {string} The extension ID.
 */
export function extensionIdFromKey(base64Key) {
  const hex = createHash('sha256')
    .update(Buffer.from(base64Key, 'base64'))
    .digest('hex')
    .slice(0, 32);
  return [...hex]
    .map((digit) => String.fromCharCode(97 + parseInt(digit, 16)))
    .join('');
}
