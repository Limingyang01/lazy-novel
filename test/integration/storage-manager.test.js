// test/integration/storage-manager.test.js
const assert = require('assert');
require('../setup');
const { StorageManager } = require('../../src/storage/StorageManager');

suite('StorageManager', () => {
  test('delegates saveFiles/loadFiles to lazy-novel.books', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) return;
    const sm = new StorageManager(ctx);
    await sm.saveFiles([{ id: 'a', title: 'A' }]);
    const loaded = await sm.loadFiles();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, 'a');
    assert.strictEqual(loaded[0].title, 'A');
  });

  test('saveReadingState/loadReadingState round-trip', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) return;
    const sm = new StorageManager(ctx);
    await sm.saveReadingState({ currentFileId: 'x', currentChapter: 2, scrollOffset: 5, lastSaveTime: 100 });
    const s = await sm.loadReadingState();
    assert.strictEqual(s.currentFileId, 'x');
  });

  test('clearAll wipes both keys', async () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) return;
    const sm = new StorageManager(ctx);
    await sm.saveFiles([{ id: 'a' }]);
    await sm.saveReadingState({ currentFileId: 'x' });
    await sm.clearAll();
    assert.deepStrictEqual(await sm.loadFiles(), []);
  });
});
