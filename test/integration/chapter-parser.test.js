const assert = require('assert');
const { ChapterParser } = require('../../src/chapter/ChapterParser');

suite('ChapterParser', () => {
  test('returns empty array when no marker matches (fallback is controller responsibility)', () => {
    const p = new ChapterParser();
    const chapters = p.parse('just some text\nline 2');
    assert.strictEqual(chapters.length, 0);
  });

  test('matches Chinese "第X章"', () => {
    const p = new ChapterParser();
    const text = '第一章 起始\n正文A\n第二章 继续\n正文B';
    const chapters = p.parse(text);
    assert.ok(chapters.length >= 2);
    // Brief impl extracts the trailing capture group (e.g. "起始") as the title.
    assert.strictEqual(chapters[0].title, '起始');
    assert.strictEqual(chapters[1].title, '继续');
  });

  test('matches English "Chapter N"', () => {
    const p = new ChapterParser();
    const text = 'Prose\nChapter 1 Begin\nA\nChapter 2 Next\nB';
    const chapters = p.parse(text);
    assert.strictEqual(chapters[0].title, 'Begin');
    assert.strictEqual(chapters[1].title, 'Next');
  });

  test('matches === title === style', () => {
    const p = new ChapterParser();
    const text = 'intro\n===Chapter A===\nbody\n===Chapter B===\nbody2';
    const chapters = p.parse(text);
    assert.ok(chapters.length >= 2);
  });

  test('matches 【标题】 and 《标题》', () => {
    const p = new ChapterParser();
    const text = 'intro\n【标题甲】\nbody\n《标题乙》\nbody2';
    const chapters = p.parse(text);
    assert.ok(chapters.length >= 2);
    assert.ok(/标题甲/.test(chapters[0].title));
    assert.ok(/标题乙/.test(chapters[1].title));
  });

  test('returns empty array for empty input', () => {
    const p = new ChapterParser();
    assert.deepStrictEqual(p.parse(''), []);
  });
});
