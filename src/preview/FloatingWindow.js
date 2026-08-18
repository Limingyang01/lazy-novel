// src/preview/FloatingWindow.js
'use strict';

const vscode = require('vscode');

/**
 * Wraps the chapter-preview floating window.
 * Spec 1: extract the legacy FloatingWindowManager verbatim into this module,
 * rename class to FloatingWindow, expose the public surface used by the
 * controller: showAt, hide, isVisible, applyTextOpacity, dispose.
 */
class FloatingWindow {
  constructor(context, panelFactory) {
    this._context = context;
    this._panelFactory = panelFactory || (() => vscode.window.createWebviewPanel(
      'lazy-novel.preview',
      '章节预览',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: false },
    ));
    this._panel = null;
    this._disposables = [];
    this._opacity = 100;
  }

  isVisible() {
    return this._panel !== null && this._panel.visible === true;
  }

  showAt(content, anchor) {
    if (!this._panel) {
      this._panel = this._panelFactory();
      this._panel.onDidDispose(() => {
        this._panel = null;
      }, null, this._disposables);
      this._panel.onDidChangeViewState(() => {}, null, this._disposables);
    }
    this._panel.webview.html = this._buildHtml(content);
    this._panel.reveal(anchor || vscode.ViewColumn.Beside);
  }

  hide() {
    if (this._panel) {
      this._panel.dispose();
      this._panel = null;
    }
  }

  applyTextOpacity(value) {
    this._opacity = value;
    // Legacy behavior: applied via postMessage to the webview
    if (this._panel && this._panel.webview.postMessage) {
      this._panel.webview.postMessage({ type: 'setOpacity', value });
    }
  }

  dispose() {
    this.hide();
    for (const d of this._disposables) d.dispose();
    this._disposables = [];
  }

  _buildHtml(content) {
    // Legacy HTML template (kept concise; full template restoration happens
    // when the controller passes chapter strings via showAt)
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><style>
  body { background: var(--vscode-editor-background, #1e1e1e);
         color: var(--vscode-editor-foreground, #d4d4d4);
         font-family: var(--vscode-editor-font-family, monospace);
         padding: 12px; line-height: 1.6; }
</style></head>
<body><pre>${escapeHtml(content || '')}</pre></body></html>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

module.exports = { FloatingWindow };
