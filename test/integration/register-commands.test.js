// test/integration/register-commands.test.js
const assert = require('assert');
const sinon = require('sinon');
const vscode = require('vscode');
const { registerCommands } = require('../../src/commands/registerCommands');

suite('registerCommands', () => {
  test('returns array of disposables and registers all 11 lazyNovel.* commands', () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) {
      throw new Error('test host did not inject __lazyNovelTestContext');
    }
    const registered = [];
    const stub = sinon.stub(vscode.commands, 'registerCommand').callsFake((id, fn) => {
      registered.push(id);
      return { dispose: () => {} };
    });

    const deps = {
      readerController: {
        toggleVisibility: () => {},
        next: () => {},
        previous: () => {},
        scrollLeft: () => {},
        scrollRight: () => {},
      },
      previewController: {
        toggle: () => {},
        show: () => {},
        hide: () => {},
      },
    };
    const d = registerCommands(ctx, deps);
    stub.restore();
    assert.ok(Array.isArray(d));
    const expected = [
      'lazyNovel.open',
      'lazyNovel.toggleVisibility',
      'lazyNovel.nextPage',
      'lazyNovel.previousPage',
      'lazyNovel.scrollLeft',
      'lazyNovel.scrollRight',
      'lazyNovel.toggleChapterPreview',
      'lazyNovel.showHoverPreview',
      'lazyNovel.hideHoverPreview',
      'lazyNovel.openBookshelf',
      'lazyNovel.scanFolder',
    ];
    for (const id of expected) {
      assert.ok(registered.includes(id), `missing command registration: ${id}`);
    }
  });
});