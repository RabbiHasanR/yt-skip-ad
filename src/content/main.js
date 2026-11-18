// Content-script entry (ES module), loaded by loader.js on YouTube pages.

import { LOG_PREFIX } from '../shared/constants.js';
import { watchSettings } from '../shared/storage.js';
import { followPlayer } from './follow-player.js';

console.log(`${LOG_PREFIX} content script loaded`);

// Settings first, so an ad is never clicked against a stored "off".
followPlayer(document, await watchSettings());
