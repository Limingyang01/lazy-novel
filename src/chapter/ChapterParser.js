// src/chapter/ChapterParser.js
'use strict';

const CHAPTER_PATTERNS = [
  /^第[一二三四五六七八九十\d]+章\s*[：:\-]?\s*(.+)/,
  /^第\d+章\s*[：:\-]?\s*(.+)/,
  /^[一二三四五六七八九十]+、\s*(.+)/,
  /^[\d]+\.\s*(.+)/,
  /^[\d]+[\s]*[、．.]\s*(.+)/,
  /^Chapter\s+\d+\s*[:\-]?\s*(.+)/i,
  /^CHAPTER\s+\d+\s*[:\-]?\s*(.+)/i,
  /^={3,}\s*(.+)\s*={3,}/,
  /^-{3,}\s*(.+)\s*-{3,}/,
  /^\*{3,}\s*(.+)\s*\*{3,}/,
  /^【(.+)】$/,
  /^《(.+)》$/,
  /^(\d+)\s*[、．.]\s*(.+)/,
  /^(\d+)\s+(.+)/,
];

const KEYWORD_HEAD = /^(序言|前言|引言|结语|附录|目录|索引|参考文献|致谢)/i;

/**
 * Splits text into chapters using regex + heuristic rules.
 * Behavior is byte-identical to the legacy _extractChapters in
 * extension.js; this is a pure extraction.
 */
class ChapterParser {
  parse(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const chapters = [];
    let current = null;
    let chapterIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let isChapter = false;
      let chapterTitle = '';

      for (const pattern of CHAPTER_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          isChapter = true;
          chapterTitle = match[match.length - 1] || match[0];
          chapterTitle = chapterTitle.replace(/^\s*[：:\-]\s*/, '').trim();
          break;
        }
      }

      if (!isChapter && line.length > 2 && line.length < 50) {
        if (/^[A-Z\s\d\-_]+$/.test(line)) {
          isChapter = true;
          chapterTitle = line;
        } else if (KEYWORD_HEAD.test(line)) {
          isChapter = true;
          chapterTitle = line;
        }
      }

      if (isChapter) {
        if (current) {
          current.charCount = current._endOffset - current.startOffset;
          delete current._endOffset;
          chapters.push(current);
        }
        current = {
          index: chapterIndex++,
          title: chapterTitle,
          startOffset: this._offsetOf(lines, i),
          _endOffset: 0,
        };
      }
    }

    if (current) {
      current.charCount = text.length - current.startOffset;
      delete current._endOffset;
      chapters.push(current);
    }

    // Spec §3 B4: return [] when no chapters match (matches thief-reader behavior).
    // Fallback chapter generation is the ReaderController's responsibility (T11).
    return chapters;
  }

  _offsetOf(lines, lineIndex) {
    let off = 0;
    for (let i = 0; i < lineIndex; i++) off += lines[i].length + 1;
    return off;
  }
}

module.exports = { ChapterParser };
