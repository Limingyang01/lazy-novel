// src/ui/SidebarProvider.js
'use strict';

const vscode = require('vscode');
const path = require('node:path');
const fs = require('node:fs');

/**
 * WebviewViewProvider for the Lazy Novel sidebar. Spec 1 surface only;
 * the full HTML/JS template is loaded from src/ui/html/sidebar.html.
 */
class SidebarProvider {
  constructor(context, readerController) {
    this._context = context;
    this._reader = readerController;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'ui', 'html'))],
    };
    webview.html = this._loadHtml();
  }

  _loadHtml() {
    const htmlPath = path.join(this._context.extensionPath, 'src', 'ui', 'html', 'sidebar.html');
    return fs.readFileSync(htmlPath, 'utf-8');
  }
}

module.exports = { SidebarProvider };
