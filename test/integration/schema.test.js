// test/integration/schema.test.js
const assert = require('assert');
const Schema = require('../../src/storage/Schema');

suite('Schema', () => {
  test('SCHEMA_VERSION is 2', () => {
    assert.strictEqual(Schema.SCHEMA_VERSION, 2);
  });

  test('GLOBAL_STATE_KEYS exposes new names', () => {
    assert.strictEqual(Schema.GLOBAL_STATE_KEYS.books, 'lazy-novel.books');
    assert.strictEqual(Schema.GLOBAL_STATE_KEYS.readingState, 'lazy-novel.readingState');
    assert.strictEqual(Schema.GLOBAL_STATE_KEYS.migrated, 'lazy-novel.migrated');
  });

  test('DEFAULT_BOOK has tags and schemaVersion', () => {
    assert.deepStrictEqual(Schema.DEFAULT_BOOK.tags, []);
    assert.strictEqual(Schema.DEFAULT_BOOK.missing, false);
    assert.strictEqual(Schema.DEFAULT_BOOK.schemaVersion, 2);
  });
});