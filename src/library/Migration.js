// src/library/Migration.js
'use strict';

const { GLOBAL_STATE_KEYS, SCHEMA_VERSION } = require('../storage/Schema');

const OLD_FILES_KEY = 'thief-reader.files';

/**
 * One-shot migration: if lazy-novel.books is empty and thief-reader.files exists,
 * translate each entry to the new schema and write it.
 * Never deletes the old key.
 *
 * @param {vscode.ExtensionContext} context
 * @returns {Promise<{ migrated: boolean, count: number }>}
 */
async function migrateIfNeeded(context) {
  const oldFiles = context.globalState.get(OLD_FILES_KEY);
  const newBooks = context.globalState.get(GLOBAL_STATE_KEYS.books);

  if (!Array.isArray(oldFiles) || oldFiles.length === 0) {
    return { migrated: false, count: 0 };
  }
  if (Array.isArray(newBooks) && newBooks.length > 0) {
    return { migrated: false, count: 0 };
  }

  const translated = [];
  for (const old of oldFiles) {
    try {
      translated.push(translate(old));
    } catch (err) {
      console.error('[lazy-novel] migration: skipping malformed entry', old && old.id, err);
    }
  }

  await context.globalState.update(GLOBAL_STATE_KEYS.books, translated);
  await context.globalState.update(GLOBAL_STATE_KEYS.migrated, {
    from: OLD_FILES_KEY,
    at: Date.now(),
    count: translated.length,
  });

  console.log(`[lazy-novel] migrated ${translated.length} books from ${OLD_FILES_KEY}`);
  return { migrated: true, count: translated.length };
}

function translate(old) {
  if (!old || typeof old !== 'object' || !old.id) {
    throw new Error('entry missing id');
  }
  return {
    id: old.id,
    title: old.name || 'Untitled',
    format: old.type || 'TXT',
    filePath: old.path || '',
    fullText: old.fullText || '',
    tags: [],
    status: old.status || 'active',
    missing: false,
    addedAt: old.addedTime || Date.now(),
    progress: {
      chapter: old.lastChapter ?? 0,
      offset: old.lastScrollOffset ?? 0,
      updatedAt: old.lastReadTime ?? 0,
    },
    chapterPositions: old.chapterPositions || {},
    schemaVersion: SCHEMA_VERSION,
  };
}

module.exports = { migrateIfNeeded };
