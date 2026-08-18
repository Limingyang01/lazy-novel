// src/reader/Pager.js
'use strict';

/**
 * Sliding-window pager. Spec 1 mirrors the legacy 80-char behavior of
 * thief-reader's _previousPage/_nextPage: full chapter content + an offset
 * produces a fixed-width window. Spec 3 may extend with soft-cut pagination.
 */
class Pager {
  constructor(options = {}) {
    this.windowSize = options.windowSize ?? 80;
  }

  /**
   * Return the chapter split into one or more chunks (legacy passthrough —
   * current thief-reader does not actually paginate by chapter; it operates
   * on global scrollOffset within fullText).
   */
  paginate(content, chunkSize) {
    if (!content) return [];
    if (content.length <= chunkSize) return [content];
    const out = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      out.push(content.slice(i, Math.min(i + chunkSize, content.length)));
    }
    return out;
  }

  /**
   * Return a single window of `windowSize` characters starting at `offset`,
   * clamped so the last character can be displayed at the window start.
   */
  window(content, offset) {
    if (!content) return [''];
    const maxOffset = Math.max(0, content.length - 1);
    const safe = Math.max(0, Math.min(offset, maxOffset));
    const end = Math.min(safe + this.windowSize, content.length);
    return [content.slice(safe, end)];
  }

  scrollBy(content, delta) {
    if (!content) return [''];
    const maxOffset = Math.max(0, content.length - 1);
    // Mirror _previousPage/_nextPage: shift by 80 (windowSize) or 10 (scroll)
    const safe = Math.max(0, Math.min(delta, maxOffset));
    const end = Math.min(safe + this.windowSize, content.length);
    return [content.slice(safe, end)];
  }
}

module.exports = { Pager };