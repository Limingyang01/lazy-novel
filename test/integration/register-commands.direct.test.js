// test/integration/register-commands-direct.test.js
// Standalone Node script that verifies registerCommands wires all 11 commands
// without launching a VSCode instance (and without triggering wsl.exe prompts).
//
// Run: node test/integration/register-commands.direct.test.js

const assert = require('assert');
const Module = require('node:module');

// Fake `vscode` module surface.
const fakeRegistered = [];
const fakeVscode = {
  commands: {
    registerCommand(id, fn) {
      fakeRegistered.push(id);
      return { dispose: () => {} };
    },
    executeCommand() {},
  },
  window: {
    showInformationMessage() {},
  },
};

// Intercept any `require('vscode')`.
const origLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') return fakeVscode;
  return origLoad.call(this, request, parent, isMain);
};

const { registerCommands } = require('../../src/commands/RegisterCommands.js');

// Restore Module._load so other requires behave normally.
Module._load = origLoad;

let failures = 0;
function expect(cond, msg) {
  if (!cond) {
    console.error('FAIL: ' + msg);
    failures++;
  }
}

const ctx = {
  subscriptions: [],
  extensionPath: process.cwd(),
  globalState: { get: () => undefined, update: () => Promise.resolve() },
};
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

expect(Array.isArray(d), 'registerCommands should return an array; got: ' + typeof d);
expect(d.length === 11, 'should return 11 disposables; got: ' + d.length);
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
  expect(fakeRegistered.includes(id), 'missing command registration: ' + id);
}

if (failures === 0) {
  console.log('PASS: registerCommands wires all 11 lazyNovel.* commands');
  process.exit(0);
} else {
  console.error(`FAIL: ${failures} assertions failed`);
  process.exit(1);
}