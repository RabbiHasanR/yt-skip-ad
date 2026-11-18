// Builds the dist zip colleagues install from. Dev tooling only: the
// extension itself has no build step, so the zip holds the source files as
// they are.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Repo paths that make up the extension; nothing else goes in the zip.
 *
 * @type {readonly string[]}
 */
export const PACKAGE_FILES = Object.freeze([
  'manifest.json',
  'src',
  'popup',
  'icons',
  'README.md',
]);

/**
 * `zip -x` patterns kept out even inside `PACKAGE_FILES`: dotfiles and
 * folders (`.DS_Store`, editor folders) and private keys. In `zip`, `*` also
 * matches `/`, so these apply at any depth.
 */
const EXCLUDED_PATTERNS = Object.freeze(['*/.*', '*.pem']);

/**
 * Zips the extension files of `rootDir` into
 * `<outDir>/yt-skip-ad-<version>.zip`, with paths relative to `rootDir`, so
 * the unzipped folder loads in Chrome as it is.
 *
 * @param {{ rootDir: string, outDir: string }} options Project and output folders.
 * @returns {string} Path of the zip written.
 */
export function packageExtension({ rootDir, outDir }) {
  const { version } = JSON.parse(
    readFileSync(join(rootDir, 'manifest.json'), 'utf8'),
  );
  const zipPath = join(outDir, `yt-skip-ad-${version}.zip`);
  mkdirSync(outDir, { recursive: true });
  execFileSync(
    'zip',
    ['-r', '-X', '-q', zipPath, ...PACKAGE_FILES, '-x', ...EXCLUDED_PATTERNS],
    { cwd: rootDir },
  );
  return zipPath;
}
