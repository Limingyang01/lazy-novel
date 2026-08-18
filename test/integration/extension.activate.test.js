// test/integration/extension.activate.test.js
// Standalone verification that the slim extension.js wires all 11 commands
// without launching a real VSCode instance (avoids wsl.exe prompts).
//
// Run: node test/integration/extension.activate.test.js

const assert = require('assert');
const Module = require('node:module');

// Fake `vscode` module with full API surface used by extension.js + its deps.
const fakeRegisteredCommands = [];
const fakeWebviewViewProviders = [];
const fakeStatusBarItems = [];

const fakeVscode = {
  StatusBarAlignment: { Left: 1, Right: 2 },
  window: {
    createStatusBarItem(alignment, priority) {
      const item = {
        text: '',
        tooltip: '',
        color: undefined,
        command: undefined,
        show() {},
        hide() {},
        dispose() {},
        alignment,
        priority,
      };
      fakeStatusBarItems.push(item);
      return item;
    },
    registerWebviewViewProvider(id, provider) {
      fakeWebviewViewProviders.push({ id, provider });
      return { dispose() {} };
    },
    showInformationMessage(msg) {
      console.log('[info]', msg);
    },
  },
  commands: {
    registerCommand(id, fn) {
      fakeRegisteredCommands.push(id);
      return { dispose() {} };
    },
    executeCommand(id) {
      console.log('[exec]', id);
    },
    getCommands() {
      return Promise.resolve(fakeRegisteredCommands.slice());
    },
  },
  ViewColumn: { Beside: 2 },
};

// Intercept any `require('vscode')`.
const origLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') return fakeVscode;
  return origLoad.call(this, request, parent, isMain);
};

// Load the slim extension entry.
const ext = require('../../extension.js');

// Restore Module._load.
Module._load = origLoad;

(async () => {
  let failures = 0;
  function expect(cond, msg) {
    if (!cond) {
      console.error('FAIL: ' + msg);
      failures++;
    }
  }

  // Fake ExtensionContext
  const ctx = {
    subscriptions: [],
    extensionPath: process.cwd(),
    extensionUri: { fsPath: process.cwd(), scheme: 'file', path: process.cwd() },
    globalState: { get: () => undefined, update: () => Promise.resolve() },
    workspaceState: { get: () => undefined, update: () => Promise.resolve() },
    asAbsolutePath: (p) => `${process.cwd()}/${p}`,
  };

  try {
    await ext.activate(ctx);
  } catch (err) {
    console.error('activate() threw:', err);
    process.exit(1);
  }

  expect(typeof ext.activate === 'function', 'module.exports.activate must be a function');
  expect(typeof ext.deactivate === 'function', 'module.exports.deactivate must be a function');
  expect(ctx.subscriptions.length > 0, 'subscriptions should have entries');
  expect(fakeStatusBarItems.length === 1, 'should create exactly 1 status bar item; got: ' + fakeStatusBarItems.length);
  expect(fakeWebviewViewProviders.length === 1, 'should register exactly 1 webview view provider; got: ' + fakeWebviewViewProviders.length);
  expect(
    fakeWebviewViewProviders[0].id === 'lazy-novel-main',
    'webview view provider id should be "lazy-novel-main"; got: ' + fakeWebviewViewProviders[0].id,
  );

  const expectedCommands = [
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
  for (const id of expectedCommands) {
    expect(
      fakeRegisteredCommands.includes(id),
      `missing command: ${id}`,
    );
  }

  // Test deactivate doesn't throw
  try {
    ext.deactivate();
  } catch (err) {
    expect(false, 'deactivate() threw: ' + err.message);
  }

  if (failures === 0) {
    console.log(`PASS: extension activate() wired everything correctly`);
    console.log(`  subscriptions: ${ctx.subscriptions.length}`);
    console.log(`  status bar items: ${fakeStatusBarItems.length}`);
    console.log(`  webview view providers: ${fakeWebviewViewProviders.length}`);
    console.log(`  commands: ${fakeRegisteredCommands.length}`);
    process.exit(0);
  } else {
    console.error(`FAIL: ${failures} assertion(s) failed`);
    process.exit(1);
  }
})();