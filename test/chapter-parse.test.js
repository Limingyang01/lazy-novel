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
	// 复刻 _extractChapters 里的取标题逻辑：最后一个捕获组优先
	const extractTitle = line => {
		const t = line.trim();
		for (const p of patterns) {
			const m = t.match(p);
			if (m) return (m[m.length - 1] || m[0]).replace(/^\s*[：:\-]\s*/, '').trim();
		}
		return null;
	};

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

		// 卷+章合写（用户报告的 bug 文件用的格式）。缺这条整本书 0 章节。
		'第一卷 成长之路 第001章 杜家私生子',
		'第二卷 绝代商骄 第063章 争夺地皮(上)',
		'第一卷　成长之路　第001章　杜家私生子',   // 全角空格 \s 能匹配
		'第一卷\t成长之路\t第001章\t杜家私生子',   // Tab
		'第一卷 成长之路 第001章：杜家私生子',      // 冒号也得能剥掉
	];

	const shouldNotMatch = [
		'他翻开书页继续读下去。',
		'那一年的春天格外漫长，风里带着湿气。',
		'',
		'第一卷 介绍',                  // 只有卷没有章，不应被识别
		'我们来到第一卷 第001章 杜承',   // 不以「第N卷」开头，新正则有 ^ 锚定
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

	test('卷+章格式的捕获标题只取「章名」部分', () => {
		// 用户的选择：标题只取「杜家私生子」，不要「成长之路 第001章 杜家私生子」
		assert.strictEqual(extractTitle('第一卷 成长之路 第001章 杜家私生子'), '杜家私生子');
		assert.strictEqual(extractTitle('第二卷 绝代商骄 第063章 争夺地皮(上)'), '争夺地皮(上)');
		// 冒号变体也该被剥掉
		assert.strictEqual(extractTitle('第一卷 成长之路 第001章：杜家私生子'), '杜家私生子');
	});
});

suite('readTextFileAutoEncoding（自动识别 GBK / UTF-8）', () => {
	// 从 extension.js 动态抠出函数体再 eval，避免把 iconv-lite 写两份
	function loadReadTextFile() {
		const source = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
		const match = source.match(/function readTextFileAutoEncoding\(filePath\) \{([\s\S]*?)\n\}/);
		assert.ok(match, '未能在 extension.js 中定位 readTextFileAutoEncoding');
		// 重新包成 require 风格：先建一个把 iconv 注入的 fn
		const iconv = require('iconv-lite');
		return new Function('iconv', 'fs', `${match[1]}; return readTextFileAutoEncoding;`)(iconv, fs);
	}

	const tmpDir = path.join(__dirname, '.tmp-encoding');
	before(() => fs.mkdirSync(tmpDir, { recursive: true }));
	after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

	function write(name, buf) {
		const p = path.join(tmpDir, name);
		fs.writeFileSync(p, buf);
		return p;
	}

	test('纯 UTF-8 文件（含中文）直接按 UTF-8 读', () => {
		const text = '第一卷 成长之路 第001章 杜家私生子\n正文第一句。';
		const p = write('utf8.txt', Buffer.from(text, 'utf8'));
		assert.strictEqual(loadReadTextFile()(p), text);
	});

	test('GBK 文件（有乱码风险）回退到 GB18030', () => {
		const text = '第一卷 成长之路 第001章 杜家私生子\n正文第一句。';
		const buf = require('iconv-lite').encode(text, 'gbk');
		const p = write('gbk.txt', buf);
		const decoded = loadReadTextFile()(p);
		assert.strictEqual(decoded, text, 'GBK 文件应当被正确解码为中文');
		assert.ok(decoded.includes('杜家私生子'));
	});

	test('UTF-8 BOM 头被剥掉', () => {
		const text = '第一卷 第001章 标题\n内容。';
		const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]);
		const p = write('bom.txt', buf);
		assert.strictEqual(loadReadTextFile()(p), text);
	});

	test('短文本（< 200 字）不触发 GBK 回退，避免抖样本', () => {
		// 故意拼一个「UTF-8 解出来只有 1 个 U+FFFD」的短样本
		const buf = Buffer.from([0xC0, 0x80, 0xE4, 0xB8, 0xAD, 0xE6, 0x96, 0x87]); // 首字节是无效 UTF-8 序列
		const p = write('short-bad.txt', buf);
		const result = loadReadTextFile()(p);
		// 应当原样返回（不重读为 GB18030），结果里至少包含「中文」两个字
		assert.ok(result.includes('中文'), '短文本不应被强制重读为 GBK');
	});

	test('大文件含高比例 U+FFFD 时会回退 GB18030', () => {
		// 构造一段 500 字节的 GBK 文本，全用 0xB0 段的高位字节模拟
		const gbkText = '第一卷 成长之路 第001章 杜家私生子\n' + '正文。'.repeat(100);
		const buf = require('iconv-lite').encode(gbkText, 'gbk');
		const p = write('big-gbk.txt', buf);
		assert.strictEqual(loadReadTextFile()(p), gbkText);
	});
});

