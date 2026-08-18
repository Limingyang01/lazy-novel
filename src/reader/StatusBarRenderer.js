// src/reader/StatusBarRenderer.js
'use strict';

const PREVIEW_HIDDEN_ICON = '📖';
const PREVIEW_VISIBLE_ICON = '🔍';

/**
 * Renders the status-bar text. Behavior is byte-identical to the legacy
 * `_updateStatusBar` method in extension.js; this is a pure extraction.
 */
class StatusBarRenderer {
  constructor(statusBarItem, options = {}) {
    this.item = statusBarItem;
    this.prefix = options.prefix ?? 'reader:';
    this.windowSize = options.windowSize ?? 80;
  }

  render({ chapter, offset, totalLength, opacity, previewVisible, content }) {
    const maxScrollOffset = Math.max(0, totalLength - 1);
    const safeOffset = Math.max(0, Math.min(offset, maxScrollOffset));
    const actualEnd = Math.min(safeOffset + this.windowSize, totalLength);
    const displayContent = (content || '').slice(safeOffset, actualEnd);
    const scrollIndicator =
      totalLength > this.windowSize
        ? ` [${safeOffset}-${actualEnd}/${totalLength}]`
        : '';
    const alpha = (opacity / 100).toFixed(2);
    const previewStatus = previewVisible ? PREVIEW_VISIBLE_ICON : PREVIEW_HIDDEN_ICON;

    this.item.color = `rgba(135, 135, 135, ${alpha})`;
    this.item.text = `${this.prefix} ${chapter.title}${scrollIndicator} - ${displayContent} ${previewStatus}`;
  }

  reset() {
    this.item.text = `${this.prefix} 准备就绪`;
  }
}

module.exports = { StatusBarRenderer };
