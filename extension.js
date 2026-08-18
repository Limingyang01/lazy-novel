// extension.js
'use strict';

const vscode = require('vscode');
const { migrateIfNeeded } = require('./src/library/Migration');
const { StatusBarRenderer } = require('./src/reader/StatusBarRenderer');
const { ReaderController } = require('./src/reader/ReaderController');
const { FloatingWindow } = require('./src/preview/FloatingWindow');
const { PreviewController } = require('./src/preview/PreviewController');
const { SidebarProvider } = require('./src/ui/SidebarProvider');
const { registerCommands } = require('./src/commands/registerCommands');

let _reader;
let _preview;

async function activate(context) {
  console.log('Lazy Novel activating');

  // 1. Run one-shot migration from thief-reader.* keys
  await migrateIfNeeded(context);

  // 2. Wire controllers
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.text = 'Lazy Novel: 准备就绪';
  statusBarItem.tooltip = 'Lazy Novel';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const renderer = new StatusBarRenderer(statusBarItem, {
    prefix: 'reader:',
    windowSize: 80,
  });
  _reader = new ReaderController({ renderer });
  _preview = new PreviewController(new FloatingWindow(context));

  // 3. Register commands
  context.subscriptions.push(
    registerCommands(context, {
      readerController: _reader,
      previewController: _preview,
    }),
  );

  // 4. Register sidebar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('lazy-novel-main', new SidebarProvider(context, _reader)),
  );

  console.log('Lazy Novel activated');
}

function deactivate() {
  if (_preview) _preview.hide();
}

module.exports = { activate, deactivate };