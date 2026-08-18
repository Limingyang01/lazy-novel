const assert = require('assert');
const sinon = require('sinon');
const { StatusBarRenderer } = require('../../src/reader/StatusBarRenderer');

suite('StatusBarRenderer', () => {
  test('render sets text with chapter, scroll indicator, content preview', () => {
    const item = {
      text: '',
      color: '',
      command: undefined,
      show: sinon.spy(),
    };
    const r = new StatusBarRenderer(item, { prefix: 'reader:', windowSize: 80 });
    r.render({
      chapter: { title: '第一章 起始' },
      offset: 0,
      totalLength: 100,
      opacity: 100,
      previewVisible: false,
      content: '这是正文内容',
    });
    assert.ok(item.text.includes('第一章 起始'));
    assert.ok(item.text.includes('这是正文内容'));
    assert.ok(item.text.includes('📖'));
    assert.ok(item.color.includes('1.00'));
  });

  test('render hides preview indicator when preview visible', () => {
    const item = { text: '', color: '', command: undefined, show: sinon.spy() };
    const r = new StatusBarRenderer(item, { prefix: 'reader:', windowSize: 80 });
    r.render({
      chapter: { title: 'X' },
      offset: 0,
      totalLength: 50,
      opacity: 50,
      previewVisible: true,
      content: 'abc',
    });
    assert.ok(item.text.includes('🔍'));
    assert.ok(item.color.includes('0.50'));
  });
});
