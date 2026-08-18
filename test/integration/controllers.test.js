// test/integration/controllers.test.js
const assert = require('assert');
const sinon = require('sinon');
const { ReaderController } = require('../../src/reader/ReaderController');
const { StatusBarRenderer } = require('../../src/reader/StatusBarRenderer');

suite('ReaderController', () => {
  test('updateStatusBar renders via StatusBarRenderer', () => {
    const item = { text: '', color: '', command: undefined, show: () => {} };
    const renderer = new StatusBarRenderer(item, { prefix: 'reader:', windowSize: 80 });
    const ctrl = new ReaderController({ renderer, pager: { windowSize: 80 } });
    ctrl.setCurrentChapter({ title: 'X' });
    ctrl.setScrollOffset(0);
    ctrl.setTotalLength(100);
    ctrl.setOpacity(100);
    ctrl.setContent('hello');
    ctrl.updateStatusBar({ previewVisible: false });
    assert.ok(item.text.includes('hello'));
  });

  test('toggleVisibility flips state', () => {
    const renderer = { render: sinon.spy(), reset: sinon.spy() };
    const ctrl = new ReaderController({ renderer });
    ctrl.setCurrentChapter({ title: 'X' });
    ctrl.setContent('hello');
    ctrl.toggleVisibility();
    assert.strictEqual(renderer.reset.callCount, 1);
    ctrl.toggleVisibility();
    assert.strictEqual(renderer.render.callCount, 1);
  });

  test('next/previous shift scroll offset by windowSize', () => {
    const renderer = { render: sinon.spy(), reset: sinon.spy() };
    const ctrl = new ReaderController({ renderer, pager: { windowSize: 80 } });
    ctrl.setContent('x'.repeat(500));
    ctrl.setTotalLength(500);
    ctrl.setScrollOffset(0);
    ctrl.next();
    assert.strictEqual(ctrl.getScrollOffset(), 80);
    ctrl.previous();
    assert.strictEqual(ctrl.getScrollOffset(), 0);
  });
});