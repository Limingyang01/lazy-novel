// test/integration/book-repository.test.js
const assert = require('assert');
require('../setup');
const { BookRepository } = require('../../src/library/BookRepository');
const { GLOBAL_STATE_KEYS } = require('../../src/storage/Schema');

suite('BookRepository (stub)', () => {
  test('list, add, get, update, remove round-trip', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) {
      throw new Error('test host did not inject __lazyNovelTestContext');
    }
    await ctx.globalState.update(GLOBAL_STATE_KEYS.books, undefined);
    await ctx.globalState.update(GLOBAL_STATE_KEYS.readingState, undefined);

    const repo = new BookRepository(ctx);
    assert.deepStrictEqual(await repo.list(), []);

    const created = await repo.add({
      title: 'Book A',
      format: 'TXT',
      filePath: '/a.txt',
      fullText: 'aaa',
    });
    assert.ok(created.id);
    assert.strictEqual(created.title, 'Book A');
    assert.deepStrictEqual(created.tags, []);
    assert.strictEqual(created.schemaVersion, 2);

    const fetched = await repo.get(created.id);
    assert.strictEqual(fetched.id, created.id);

    const updated = await repo.update(created.id, { title: 'Book A2' });
    assert.strictEqual(updated.title, 'Book A2');

    await repo.remove(created.id);
    assert.strictEqual(await repo.get(created.id), undefined);

    assert.strictEqual((await repo.list()).length, 0);
  });

  test('reading state round-trip', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) {
      throw new Error('test host did not inject __lazyNovelTestContext');
    }
    await ctx.globalState.update(GLOBAL_STATE_KEYS.readingState, undefined);
    const repo = new BookRepository(ctx);
    assert.deepStrictEqual(await repo.loadReadingState(), {
      currentFileId: null,
      currentChapter: 0,
      scrollOffset: 0,
      lastSaveTime: 0,
    });
    await repo.saveReadingState({ currentFileId: 'x', currentChapter: 3, scrollOffset: 10, lastSaveTime: 1 });
    const s = await repo.loadReadingState();
    assert.strictEqual(s.currentFileId, 'x');
    assert.strictEqual(s.currentChapter, 3);
  });
});