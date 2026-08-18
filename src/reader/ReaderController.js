// src/reader/ReaderController.js
'use strict';

const { Pager } = require('./Pager');

/**
 * Central coordinator for the status bar reader. Owns no DOM; delegates
 * rendering to StatusBarRenderer. Replaces the per-method logic previously
 * scattered through ThiefReaderWebviewProvider.
 */
class ReaderController {
  constructor(deps = {}) {
    this.renderer = deps.renderer || null;
    this.pager = deps.pager || new Pager({ windowSize: 80 });
    this._scrollOffset = 0;
    this._chapter = null;
    this._content = '';
    this._totalLength = 0;
    this._opacity = 100;
    this._previewVisible = false;
    this._hidden = false;
  }

  setCurrentChapter(c) {
    this._chapter = c;
    this._scrollOffset = 0;
  }
  getCurrentChapter() {
    return this._chapter;
  }
  setScrollOffset(o) {
    this._scrollOffset = Math.max(0, o);
  }
  getScrollOffset() {
    return this._scrollOffset;
  }
  setContent(s) {
    this._content = s || '';
    this._totalLength = this._content.length;
  }
  setTotalLength(n) {
    this._totalLength = n;
  }
  setOpacity(o) {
    this._opacity = o;
  }
  setPreviewVisible(v) {
    this._previewVisible = !!v;
  }

  updateStatusBar() {
    if (!this.renderer) return;
    if (this._hidden || !this._chapter) {
      this.renderer.reset();
      return;
    }
    this.renderer.render({
      chapter: this._chapter,
      offset: this._scrollOffset,
      totalLength: this._totalLength,
      opacity: this._opacity,
      previewVisible: this._previewVisible,
      content: this._content,
    });
  }

  next() {
    this.setScrollOffset(this._scrollOffset + this.pager.windowSize);
    this.updateStatusBar();
  }

  previous() {
    this.setScrollOffset(this._scrollOffset - this.pager.windowSize);
    this.updateStatusBar();
  }

  scrollLeft() {
    this.setScrollOffset(this._scrollOffset - 10);
    this.updateStatusBar();
  }

  scrollRight() {
    this.setScrollOffset(this._scrollOffset + 10);
    this.updateStatusBar();
  }

  toggleVisibility() {
    this._hidden = !this._hidden;
    this.updateStatusBar();
  }
}

module.exports = { ReaderController };