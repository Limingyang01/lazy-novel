// src/library/BookRepository.js
'use strict';

const { randomUUID } = require('node:crypto');
const {
  GLOBAL_STATE_KEYS,
  SCHEMA_VERSION,
  DEFAULT_BOOK,
  DEFAULT_READING_STATE,
} = require('../storage/Schema');

/**
 * Persists books and reading state to globalState. Spec 1 stub:
 * round-trip CRUD; spec 2 will extend with tags, scanning, migration hooks.
 */
class BookRepository {
  constructor(context) {
    this.context = context;
  }

  async list() {
    const books = this.context.globalState.get(GLOBAL_STATE_KEYS.books);
    return Array.isArray(books) ? books : [];
  }

  async get(id) {
    const books = await this.list();
    return books.find((b) => b.id === id) || undefined;
  }

  async add(meta) {
    const books = await this.list();
    const book = {
      ...DEFAULT_BOOK,
      ...meta,
      id: randomUUID(),
      schemaVersion: SCHEMA_VERSION,
    };
    books.push(book);
    await this.context.globalState.update(GLOBAL_STATE_KEYS.books, books);
    return book;
  }

  async update(id, patch) {
    const books = await this.list();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    books[idx] = { ...books[idx], ...patch, id: books[idx].id };
    await this.context.globalState.update(GLOBAL_STATE_KEYS.books, books);
    return books[idx];
  }

  async remove(id) {
    const books = await this.list();
    const next = books.filter((b) => b.id !== id);
    await this.context.globalState.update(GLOBAL_STATE_KEYS.books, next);
  }

  async saveReadingState(state) {
    await this.context.globalState.update(GLOBAL_STATE_KEYS.readingState, state);
  }

  async loadReadingState() {
    const s = this.context.globalState.get(GLOBAL_STATE_KEYS.readingState);
    return s || { ...DEFAULT_READING_STATE };
  }
}

module.exports = { BookRepository };