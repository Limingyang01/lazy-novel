const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 直接从 extension.js 取 chapterPatterns 求值，避免测试里复制一份正则后失同步
function loadChapterPatterns() {
	const source = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
	// 行尾分号可有可无：源码风格变动过，别让测试跟着一起挂
	const match = source.match(/const chapterPatterns = (\[[\s\S]*?\n\t\t\]);?/);
	assert.ok(match, '未能在 extension.js 中定位 chapterPatterns');
	return new Function(`return ${match[1]}`)();
}

suite('章节标题识别', () => {
	const patterns = loadChapterPatterns();
	const matches = line => patterns.some(p => p.test(line.trim()));

	// 这些格式漏掉任意一种，整本书就会解析出 0 章节
	const shouldMatch = [
		'第一章 凡骨',
		'第1章 凡骨',
		'第三十六章 无题',
		'第一章：入门',
		'第一百零八章 问仙',   // 字符类缺「百零」时会漏
		'第一千零一章 大道',   // 字符类缺「千」时会漏
		'第两百章 归来',
		'第一章',              // 章号后无标题，(.+) 会漏
		'第1024章',
		'Chapter 5 Trial',
		'【卷一 启程】',
	];

	const shouldNotMatch = [
		'他翻开书页继续读下去。',
		'那一年的春天格外漫长，风里带着湿气。',
		'',
	];

	test('常见章节标题都能识别', () => {
		for (const line of shouldMatch) {
			assert.ok(matches(line), `章节标题未被识别: "${line}"`);
		}
	});

	test('普通正文不会被误判成章节', () => {
		for (const line of shouldNotMatch) {
			assert.ok(!matches(line), `正文被误判成章节标题: "${line}"`);
		}
	});
});
