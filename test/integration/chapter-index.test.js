// test/integration/chapter-index.test.js
const assert = require('assert');
const { ChapterIndex } = require('../../src/chapter/ChapterIndex');

suite('ChapterIndex', () => {
  const chapters = [
    { index: 0, title: 'A', startOffset: 0, charCount: 100 },
    { index: 1, title: 'B', startOffset: 100, charCount: 80 },
    { index: 2, title: 'C', startOffset: 180, charCount: 50 },
  ];

  test('findByOffset returns correct chapter', () => {
    const idx = new ChapterIndex(chapters);
    assert.strictEqual(idx.findByOffset(0), 0);
    assert.strictEqual(idx.findByOffset(50), 0);
    assert.strictEqual(idx.findByOffset(99), 0);
    assert.strictEqual(idx.findByOffset(100), 1);
    assert.strictEqual(idx.findByOffset(179), 1);
    assert.strictEqual(idx.findByOffset(180), 2);
    assert.strictEqual(idx.findByOffset(999), 2);
  });

  test('getRange returns range for chapter', () => {
    const idx = new ChapterIndex(chapters);
    assert.deepStrictEqual(idx.getRange(1), { startOffset: 100, endOffset: 180, charCount: 80 });
  });

  test('empty chapters array handled gracefully', () => {
    const idx = new ChapterIndex([]);
    assert.strictEqual(idx.findByOffset(50), 0);
    assert.deepStrictEqual(idx.getRange(0), { startOffset: 0, endOffset: 0, charCount: 0 });
  });
});