import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['node_modules/', 'coverage/', 'dist/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'popup/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
    // Nothing leaves the device (B8): ban the browser's network APIs.
    rules: {
      'no-restricted-globals': [
        'error',
        ...['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map(
          (name) => ({ name, message: 'No network requests (B8).' }),
        ),
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'navigator',
          property: 'sendBeacon',
          message: 'No network requests (B8).',
        },
      ],
    },
  },
  {
    files: ['tests/**/*.js', '*.config.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions,
      },
    },
  },
]);
