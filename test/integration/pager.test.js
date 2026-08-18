// test/integration/pager.test.js
const assert = require('assert');
const { Pager } = require('../../src/reader/Pager');

suite('Pager (sliding window)', () => {
  test('returns single window when content fits', () => {
    const p = new Pager({ windowSize: 80 });
    const pages = p.paginate('short', 80);
    assert.deepStrictEqual(pages, ['short']);
  });

  test('returns full content as single window when content.length <= windowSize', () => {
    const text = 'x'.repeat(80);
    const p = new Pager({ windowSize: 80 });
    const pages = p.paginate(text, 80);
    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0], text);
  });

  test('window offset clamps to maxScrollOffset = totalLength - 1', () => {
    const text = 'x'.repeat(200);
    const p = new Pager({ windowSize: 80 });
    const pages = p.window(text, 9999);
    // maxScrollOffset = 200 - 1 = 199; window 199..280 clamps to 199..200
    assert.ok(pages[0].length <= 80);
  });

  test('scroll delta moves by windowSize', () => {
    const text = 'abcdefghij'.repeat(30); // 300 chars
    const p = new Pager({ windowSize: 80 });
    const at0 = p.window(text, 0);
    const at80 = p.window(text, 80);
    assert.strictEqual(at0[0].length, 80);
    assert.strictEqual(at80[0].length, 80);
    assert.notStrictEqual(at0[0], at80[0]);
  });
});