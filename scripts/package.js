// Builds the dist zip colleagues install from. Dev tooling only: the
// extension itself has no build step, so the zip holds the source files as
// they are.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOG_PREFIX } from '../src/shared/constants.js';

const REPO_DIR = fileURLToPath(new URL('../', import.meta.url));

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
  // zip adds to an existing archive; start fresh so deleted files go too.
  rmSync(zipPath, { force: true });
  try {
    execFileSync(
      'zip',
      ['-r', '-X', '-q', zipPath, ...PACKAGE_FILES, '-x', ...EXCLUDED_PATTERNS],
      { cwd: rootDir },
    );
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      throw new Error(
        "can't build the dist zip: the zip command is not installed",
        { cause: error },
      );
    }
    throw error;
  }
  return zipPath;
}

// `npm run package` (or `node scripts/package.js [outDir]`): packages the
// repo into dist/, or into outDir when given (tests use a temp folder).
if (import.meta.main) {
  try {
    const outDir = process.argv[2] ?? join(REPO_DIR, 'dist');
    console.log(packageExtension({ rootDir: REPO_DIR, outDir }));
  } catch (error) {
    console.error(`${LOG_PREFIX} ${/** @type {Error} */ (error).message}`);
    process.exitCode = 1;
  }
}
