const assert = require('assert');
const { nextPagePosition, previousPagePosition, DEFAULT_DISPLAY_LENGTH } = require('../extension');

suite('翻页位置计算（跨章）', () => {
	// 第 0 章是开头那行书籍简介（很短），第 1、2 章是正常章节
	const chapterLengths = [40, 500, 300];

	test('默认一屏 40 字符', () => {
		assert.strictEqual(DEFAULT_DISPLAY_LENGTH, 40);
	});

	test('章节内正常向后翻', () => {
		assert.deepStrictEqual(
			nextPagePosition(1, 0, chapterLengths),
			{ chapterIndex: 1, scrollOffset: 40 }
		);
	});

	test('翻页跨度跟随传入的显示长度', () => {
		assert.deepStrictEqual(
			nextPagePosition(1, 0, chapterLengths, 100),
			{ chapterIndex: 1, scrollOffset: 100 }
		);
		assert.deepStrictEqual(
			previousPagePosition(1, 200, chapterLengths, 100),
			{ chapterIndex: 1, scrollOffset: 100 }
		);
	});

	test('短章节滚到底后跨到下一章开头', () => {
		// 40 字符的简介章：偏移先被夹到 39（章末），再翻一次就该进第 1 章
		assert.deepStrictEqual(
			nextPagePosition(0, 0, chapterLengths),
			{ chapterIndex: 0, scrollOffset: 39 }
		);
		assert.deepStrictEqual(
			nextPagePosition(0, 39, chapterLengths),
			{ chapterIndex: 1, scrollOffset: 0 }
		);
	});

	test('章末不会越过本章长度', () => {
		// 480 + 40 = 520 已超过本章 500 字，应被夹到章末 499
		assert.deepStrictEqual(
			nextPagePosition(1, 480, chapterLengths),
			{ chapterIndex: 1, scrollOffset: 499 }
		);
	});

	test('全书末尾返回 null', () => {
		assert.strictEqual(nextPagePosition(2, 299, chapterLengths), null);
	});

	test('章节内正常向前翻', () => {
		assert.deepStrictEqual(
			previousPagePosition(1, 200, chapterLengths),
			{ chapterIndex: 1, scrollOffset: 160 }
		);
	});

	test('退到章首后回到上一章末尾', () => {
		assert.deepStrictEqual(
			previousPagePosition(1, 0, chapterLengths),
			{ chapterIndex: 0, scrollOffset: 39 }
		);
	});

	test('全书开头返回 null', () => {
		assert.strictEqual(previousPagePosition(0, 0, chapterLengths), null);
	});

	test('空章节也能跨过去，不会卡住', () => {
		const withEmpty = [0, 100];
		assert.deepStrictEqual(
			nextPagePosition(0, 0, withEmpty),
			{ chapterIndex: 1, scrollOffset: 0 }
		);
	});
});
