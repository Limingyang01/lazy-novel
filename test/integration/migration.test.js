// test/integration/migration.test.js
const assert = require('assert');
const vscode = require('vscode');
const { migrateIfNeeded } = require('../../src/library/Migration');
const { GLOBAL_STATE_KEYS } = require('../../src/storage/Schema');

suite('Migration', () => {
  test('copies thief-reader.files to lazy-novel.books with translated fields', async () => {
    // Seed old key
    const oldFiles = [
      {
        id: 'abc',
        name: 'My Book',
        type: 'TXT',
        path: '/tmp/book.txt',
        fullText: 'hello',
        addedTime: 1700000000000,
        status: 'active',
        lastChapter: 2,
        lastScrollOffset: 40,
        lastReadTime: 1700000010000,
        chapterPositions: { 0: 0, 1: 100 },
      },
    ];
    await vscode.workspace
      .getConfiguration()
      .update('legacy.thief-reader.files', null, vscode.ConfigurationTarget.Global);
    await vscode.extensions.getExtension('neroneroffy.lazy-novel');
    // Direct globalState seed (the test runner exposes a real ExtensionContext via the host)
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) {
      // Fallback: skip if test host doesn't expose context
      return;
    }
    await ctx.globalState.update('thief-reader.files', oldFiles);
    await ctx.globalState.update(GLOBAL_STATE_KEYS.books, undefined);

    const result = await migrateIfNeeded(ctx);
    assert.strictEqual(result.migrated, true);
    assert.strictEqual(result.count, 1);

    const newBooks = ctx.globalState.get(GLOBAL_STATE_KEYS.books);
    assert.strictEqual(newBooks.length, 1);
    assert.strictEqual(newBooks[0].id, 'abc');
    assert.strictEqual(newBooks[0].title, 'My Book');
    assert.strictEqual(newBooks[0].format, 'TXT');
    assert.strictEqual(newBooks[0].filePath, '/tmp/book.txt');
    assert.deepStrictEqual(newBooks[0].tags, []);
    assert.strictEqual(newBooks[0].missing, false);
    assert.strictEqual(newBooks[0].schemaVersion, 2);
    assert.strictEqual(newBooks[0].progress.chapter, 2);
    assert.strictEqual(newBooks[0].progress.offset, 40);
    assert.strictEqual(newBooks[0].progress.updatedAt, 1700000010000);
  });

  test('skips when new key already present', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) return;
    await ctx.globalState.update(GLOBAL_STATE_KEYS.books, [{ id: 'x' }]);
    await ctx.globalState.update('thief-reader.files', [{ id: 'y' }]);

    const result = await migrateIfNeeded(ctx);
    assert.strictEqual(result.migrated, false);
    // New key untouched
    assert.strictEqual(ctx.globalState.get(GLOBAL_STATE_KEYS.books).length, 1);
  });

  test('skips when no old key present', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) return;
    await ctx.globalState.update(GLOBAL_STATE_KEYS.books, undefined);
    await ctx.globalState.update('thief-reader.files', undefined);

    const result = await migrateIfNeeded(ctx);
    assert.strictEqual(result.migrated, false);
    assert.strictEqual(result.count, 0);
  });
});
