// src/input/ScrollWheelHandler.js
'use strict';

/**
 * Manages scroll-wheel interaction for the floating preview window.
 * Verbatim extraction from extension.js (Spec 1 refactor, no behavior change).
 */
class ScrollWheelHandler {
	constructor(readerProvider) {
		this._readerProvider = readerProvider;
		this._scrollStep = 50; // 每次滚动的字符数
		this._scrollPosition = 0; // 悬浮窗独立的滚动位置
		this._maxScrollPosition = 0;
		this._isInitialized = false;
	}

	/**
	 * 初始化滚动位置（与当前阅读位置同步）
	 */
	initialize() {
		if (this._readerProvider._currentFile && this._readerProvider._currentChapter !== null) {
			this._scrollPosition = this._readerProvider._scrollOffset;
			this._maxScrollPosition = this._getCurrentChapterLength();
			this._isInitialized = true;
		}
	}

	/**
	 * 处理滚轮事件
	 */
	handleWheelEvent(deltaY, ctrlKey = false) {
		if (!this._readerProvider._currentFile || this._readerProvider._currentChapter === null) {
			return null;
		}

		if (!this._isInitialized) {
			this.initialize();
		}

		// 计算滚动步长
		const step = ctrlKey ? this._scrollStep * 2 : this._scrollStep;
		const direction = Math.sign(deltaY);

		// 计算新的滚动位置
		const newPosition = Math.max(0, this._scrollPosition + (direction * step));
		const maxPosition = Math.max(0, this._maxScrollPosition - 200); // 保留一些缓冲

		this._scrollPosition = Math.min(newPosition, maxPosition);

		// 生成新内容
		return this._generateScrolledContent();
	}

	/**
	 * 获取当前章节长度
	 */
	_getCurrentChapterLength() {
		const currentFile = this._readerProvider._currentFile;
		if (!currentFile || !currentFile.chapters || this._readerProvider._currentChapter === null) {
			return 0;
		}

		const chapter = currentFile.chapters[this._readerProvider._currentChapter];
		if (!chapter) return 0;

		// 使用辅助函数处理内容
		const fullContent = getChapterContentAsString(chapter);
		return fullContent.length;
	}

	/**
	 * 生成滚动后的内容
	 */
	_generateScrolledContent() {
		const currentFile = this._readerProvider._currentFile;
		if (!currentFile || !currentFile.chapters || this._readerProvider._currentChapter === null) {
			return null;
		}

		const chapter = currentFile.chapters[this._readerProvider._currentChapter];
		if (!chapter) return null;

		// 获取显示的文字内容
		const displayLength = 300; // 悬浮窗显示的字符数

		// 使用辅助函数处理内容
		const fullContent = getChapterContentAsString(chapter);
		if (!fullContent) {
			console.error('Empty or invalid chapter content');
			return null;
		}

		const text = fullContent.substring(this._scrollPosition, this._scrollPosition + displayLength);

		// 生成位置信息
		const position = `${this._scrollPosition}-${this._scrollPosition + text.length}/${fullContent.length}`;

		return {
			text: text,
			chapterTitle: chapter.title,
			position: position,
			scrollPosition: this._scrollPosition,
			maxPosition: fullContent.length,
			hasMore: this._scrollPosition + displayLength < fullContent.length
		};
	}

	/**
	 * 同步滚动位置到状态栏（当悬浮窗隐藏时调用）
	 */
	syncToStatusBar() {
		if (this._readerProvider._currentFile && this._isInitialized) {
			// 更新主阅读器的滚动位置
			this._readerProvider._scrollOffset = this._scrollPosition;

			// 保存当前状态
			this._readerProvider._saveCurrentState();

			// 更新状态栏显示
			this._readerProvider._displayChapterText();

			console.log(`滚动位置已同步到状态栏: ${this._scrollPosition}`);
		}
	}

	/**
	 * 重置滚动位置
	 */
	reset() {
		this._scrollPosition = 0;
		this._maxScrollPosition = 0;
		this._isInitialized = false;
	}

	/**
	 * 获取当前滚动位置
	 */
	getCurrentPosition() {
		return this._scrollPosition;
	}

	/**
	 * 设置滚动步长
	 */
	setScrollStep(step) {
		this._scrollStep = Math.max(10, Math.min(200, step)); // 限制在合理范围内
	}
}

/**
 * 内容处理辅助函数 - 处理章节内容可能是数组或字符串的情况
 */
function getChapterContentAsString(chapter) {
	if (!chapter || !chapter.content) {
		return '';
	}

	if (Array.isArray(chapter.content)) {
		return chapter.content.join('\n'); // 数组情况：用换行符连接
	} else if (typeof chapter.content === 'string') {
		return chapter.content; // 字符串情况：直接使用
	} else {
		console.warn('Unexpected chapter.content type:', typeof chapter.content, chapter.content);
		return String(chapter.content); // 强制转换为字符串
	}
}

module.exports = { ScrollWheelHandler };
