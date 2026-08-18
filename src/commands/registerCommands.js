// src/commands/registerCommands.js
'use strict';

const vscode = require('vscode');

/**
 * Registers all lazyNovel.* commands and returns the disposable array.
 * Spec 1 wires the legacy commands to controllers; openBookshelf/scanFolder
 * show a placeholder notification since their real behavior ships in Spec 2.
 *
 * Per ledger R1: 11 commands are registered to match package.json contributes.commands.
 */
function registerCommands(context, deps) {
  const { readerController, previewController } = deps;
  const disposables = [];

  disposables.push(
    vscode.commands.registerCommand('lazyNovel.open', () => {
      // Focus the sidebar panel
      vscode.commands.executeCommand('workbench.view.lazy-novel-explorer');
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.toggleVisibility', () => {
      readerController.toggleVisibility();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.nextPage', () => {
      readerController.next();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.previousPage', () => {
      readerController.previous();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.scrollLeft', () => {
      readerController.scrollLeft();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.scrollRight', () => {
      readerController.scrollRight();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.toggleChapterPreview', () => {
      previewController.toggle();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.showHoverPreview', () => {
      previewController.show();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.hideHoverPreview', () => {
      previewController.hide();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.openBookshelf', () => {
      // Spec 1: equivalent to toggleChapterPreview; real behavior lands in Spec 2.
      previewController.toggle();
    }),
  );
  disposables.push(
    vscode.commands.registerCommand('lazyNovel.scanFolder', () => {
      vscode.window.showInformationMessage(
        'Lazy Novel: 文件夹扫描功能将在 Spec 2 提供。',
      );
    }),
  );

  return disposables;
}

module.exports = { registerCommands };