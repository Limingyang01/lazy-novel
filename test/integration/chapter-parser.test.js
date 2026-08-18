const assert = require('assert');
const { ChapterParser } = require('../../src/chapter/ChapterParser');

suite('ChapterParser', () => {
  test('returns single chapter when no marker matches', () => {
    const p = new ChapterParser();
    const chapters = p.parse('just some text\nline 2');
    assert.strictEqual(chapters.length, 1);
    assert.strictEqual(chapters[0].title, '全文');
    assert.strictEqual(chapters[0].startOffset, 0);
    assert.strictEqual(chapters[0].charCount, 'just some text\nline 2'.length);
  });

  test('matches Chinese "第X章"', () => {
    const p = new ChapterParser();
    const text = '前言\n第一章 起始\n正文A\n第二章 继续\n正文B';
    const chapters = p.parse(text);
    assert.ok(chapters.length >= 2);
    assert.ok(/第一章/.test(chapters[0].title));
    assert.ok(/第二章/.test(chapters[1].title));
  });

  test('matches English "Chapter N"', () => {
    const p = new ChapterParser();
    const text = 'Prose\nChapter 1 Begin\nA\nChapter 2 Next\nB';
    const chapters = p.parse(text);
    assert.strictEqual(chapters[0].title, 'Chapter 1 Begin');
    assert.strictEqual(chapters[1].title, 'Chapter 2 Next');
  });

  test('matches === title === style', () => {
    const p = new ChapterParser();
    const text = 'intro\n===Chapter A===\nbody\n===Chapter B===\nbody2';
    const chapters = p.parse(text);
    assert.ok(chapters.length >= 2);
  });

  test('matches 【标题】 and 《标题】', () => {
    const p = new ChapterParser();
    const text = 'intro\n【标题甲】\nbody\n《标题乙》\nbody2';
    const chapters = p.parse(text);
    assert.ok(chapters.length >= 2);
  });

  test('returns empty array for empty input', () => {
    const p = new ChapterParser();
    assert.deepStrictEqual(p.parse(''), []);
  });
});
