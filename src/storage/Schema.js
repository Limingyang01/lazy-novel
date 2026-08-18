// src/storage/Schema.js
'use strict';

const SCHEMA_VERSION = 2;

const GLOBAL_STATE_KEYS = Object.freeze({
  books: 'lazy-novel.books',
  readingState: 'lazy-novel.readingState',
  migrated: 'lazy-novel.migrated',
});

const DEFAULT_BOOK = Object.freeze({
  tags: [],
  missing: false,
  schemaVersion: SCHEMA_VERSION,
});

const DEFAULT_READING_STATE = Object.freeze({
  currentFileId: null,
  currentChapter: 0,
  scrollOffset: 0,
  lastSaveTime: 0,
});

module.exports = {
  SCHEMA_VERSION,
  GLOBAL_STATE_KEYS,
  DEFAULT_BOOK,
  DEFAULT_READING_STATE,
};