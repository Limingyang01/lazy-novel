// test/integration/floating-window.test.js
const assert = require('assert');
const sinon = require('sinon');
const { FloatingWindow } = require('../../src/preview/FloatingWindow');

suite('FloatingWindow (public surface)', () => {
  test('isVisible defaults to false', () => {
    const fakeContext = { globalState: { get: () => undefined } };
    const fakeWebview = { html: '', onDidReceiveMessage: () => ({ dispose: () => {} }), postMessage: sinon.spy() };
    const fakePanel = {
      webview: fakeWebview,
      onDidDispose: () => ({ dispose: () => {} }),
      onDidChangeViewState: () => ({ dispose: () => {} }),
      reveal: sinon.spy(),
      dispose: sinon.spy(),
    };
    const fw = new FloatingWindow(fakeContext, () => fakePanel);
    assert.strictEqual(fw.isVisible(), false);
  });

  test('hide() is idempotent and a no-op when not visible', () => {
    const fakeContext = { globalState: { get: () => undefined } };
    const fakePanel = {
      webview: { html: '', onDidReceiveMessage: () => ({ dispose: () => {} }), postMessage: sinon.spy() },
      onDidDispose: () => ({ dispose: () => {} }),
      onDidChangeViewState: () => ({ dispose: () => {} }),
      reveal: sinon.spy(),
      dispose: sinon.spy(),
    };
    const fw = new FloatingWindow(fakeContext, () => fakePanel);
    fw.hide();
    fw.hide();
    assert.strictEqual(fakePanel.dispose.callCount, 0);
    assert.strictEqual(fw.isVisible(), false);
  });
});
