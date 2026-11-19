// Builds the dist zip colleagues install from. Dev tooling only: the
// extension itself has no build step, so the zip holds the source files as
// they are.
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
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
  'USER-GUIDE.md',
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
 * the unzipped folder loads in Chrome as it is. With `store`, it writes
 * `yt-skip-ad-<version>-store.zip` instead, for the Chrome Web Store: the
 * same files, with `key` removed from `manifest.json`, because the store
 * sets its own.
 *
 * @param {{ rootDir: string, outDir: string, store?: boolean }} options
 *   Project and output folders, and whether to build the store zip.
 * @returns {string} Path of the zip written.
 */
export function packageExtension({ rootDir, outDir, store = false }) {
  const manifest = JSON.parse(
    readFileSync(join(rootDir, 'manifest.json'), 'utf8'),
  );
  const suffix = store ? '-store' : '';
  const zipPath = join(outDir, `yt-skip-ad-${manifest.version}${suffix}.zip`);
  mkdirSync(outDir, { recursive: true });
  // zip adds to an existing archive; start fresh so deleted files go too.
  rmSync(zipPath, { force: true });
  runZip(
    ['-r', '-X', '-q', zipPath, ...PACKAGE_FILES, '-x', ...EXCLUDED_PATTERNS],
    rootDir,
  );
  if (store) {
    const storeManifest = { ...manifest };
    delete storeManifest.key;
    replaceManifest(zipPath, storeManifest);
  }
  return zipPath;
}

/**
 * Overwrites the `manifest.json` entry of a zip.
 *
 * @param {string} zipPath The zip to change.
 * @param {object} manifest The manifest to store in it.
 */
function replaceManifest(zipPath, manifest) {
  const dir = mkdtempSync(join(tmpdir(), 'yt-skip-ad-manifest-'));
  try {
    writeFileSync(
      join(dir, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    runZip(['-X', '-q', zipPath, 'manifest.json'], dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Runs the system `zip` command, with no shell.
 *
 * @param {string[]} args Arguments to `zip`.
 * @param {string} cwd Folder whose relative paths go in the zip.
 * @throws {Error} A clear message when `zip` is not installed.
 */
function runZip(args, cwd) {
  try {
    execFileSync('zip', args, { cwd });
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      throw new Error(
        "can't build the dist zip: the zip command is not installed",
        { cause: error },
      );
    }
    throw error;
  }
}

// `npm run package` (or `node scripts/package.js [--store] [outDir]`):
// packages the repo into dist/, or into outDir when given (tests use a temp
// folder). `--store` builds the Chrome Web Store zip (`npm run package:store`).
if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    const store = args.includes('--store');
    const outDir =
      args.find((arg) => arg !== '--store') ?? join(REPO_DIR, 'dist');
    console.log(packageExtension({ rootDir: REPO_DIR, outDir, store }));
  } catch (error) {
    console.error(`${LOG_PREFIX} ${/** @type {Error} */ (error).message}`);
    process.exitCode = 1;
  }
}
