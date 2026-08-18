// src/preview/PreviewController.js
'use strict';

/**
 * Coordinates the floating preview window. Spec 1 surface only.
 */
class PreviewController {
  constructor(floatingWindow) {
    this._fw = floatingWindow;
    this._content = '';
  }

  setContent(s) {
    this._content = s || '';
  }

  toggle() {
    if (this._fw.isVisible()) {
      this._fw.hide();
    } else {
      this._fw.showAt(this._content);
    }
  }

  show() {
    this._fw.showAt(this._content);
  }

  hide() {
    this._fw.hide();
  }

  isVisible() {
    return this._fw.isVisible();
  }
}

module.exports = { PreviewController };