// test/integration/sidebar-provider.test.js
const assert = require('assert');
const sinon = require('sinon');
const { SidebarProvider } = require('../../src/ui/SidebarProvider');

suite('SidebarProvider (smoke)', () => {
  test('exposes resolveWebviewView', () => {
    const ctx = global.__lazyNovelTestContext;
    if (!ctx) return;
    const provider = new SidebarProvider(ctx, /* controller */ null);
    assert.strictEqual(typeof provider.resolveWebviewView, 'function');
  });
});
