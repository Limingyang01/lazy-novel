// src/storage/StorageManager.js
// Spec 1: legacy-parity adapter; NOT USED by the new extension.js
// (which wires BookRepository directly). Retained for spec diff continuity;
// per ledger R2, deletion is deferred to a future spec.
'use strict';

const { BookRepository } = require('../library/BookRepository');
const { GLOBAL_STATE_KEYS, DEFAULT_READING_STATE } = require('./Schema');

/**
 * Adapter class kept for behavioral compatibility with the legacy
 * ThiefReaderWebviewProvider code path. Delegates to BookRepository for
 * persistence; spec 2 may collapse into a single class.
 */
class StorageManager {
  constructor(context) {
    this._context = context;
    this._repo = new BookRepository(context);
  }

  async saveFiles(files) {
    await this._context.globalState.update(GLOBAL_STATE_KEYS.books, files);
  }

  async loadFiles() {
    return this._repo.list();
  }

  async saveReadingState(state) {
    await this._repo.saveReadingState(state);
  }

  async loadReadingState() {
    return this._repo.loadReadingState();
  }

  async clearAll() {
    await this._context.globalState.update(GLOBAL_STATE_KEYS.books, undefined);
    await this._context.globalState.update(GLOBAL_STATE_KEYS.readingState, undefined);
  }
}

module.exports = { StorageManager };
