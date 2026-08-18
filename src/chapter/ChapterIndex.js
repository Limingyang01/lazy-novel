// src/chapter/ChapterIndex.js
'use strict';

/**
 * Pure lookup utility over a Chapter[] array.
 * Each chapter's [startOffset, startOffset+charCount) is half-open.
 */
class ChapterIndex {
  constructor(chapters) {
    this.chapters = Array.isArray(chapters) ? chapters : [];
  }

  findByOffset(offset) {
    if (this.chapters.length === 0) return 0;
    let lo = 0;
    let hi = this.chapters.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (this.chapters[mid].startOffset <= offset) lo = mid;
      else hi = mid - 1;
    }
    return this.chapters[lo].startOffset <= offset ? lo : 0;
  }

  getRange(index) {
    if (this.chapters.length === 0) return { startOffset: 0, endOffset: 0, charCount: 0 };
    const c = this.chapters[index];
    if (!c) return { startOffset: 0, endOffset: 0, charCount: 0 };
    return {
      startOffset: c.startOffset,
      endOffset: c.startOffset + c.charCount,
      charCount: c.charCount,
    };
  }
}

module.exports = { ChapterIndex };