const assert = require('assert');
const {
	adjustDisplayLength,
	MIN_DISPLAY_LENGTH,
	MAX_DISPLAY_LENGTH,
	DISPLAY_LENGTH_STEP,
	DEFAULT_DISPLAY_LENGTH
} = require('../extension');

suite('一屏宽度调节', () => {
	test('按步长变宽变窄', () => {
		assert.strictEqual(adjustDisplayLength(40, DISPLAY_LENGTH_STEP), 45);
		assert.strictEqual(adjustDisplayLength(40, -DISPLAY_LENGTH_STEP), 35);
	});

	test('夹在合法区间内，到边界返回边界值', () => {
		assert.strictEqual(adjustDisplayLength(MIN_DISPLAY_LENGTH, -DISPLAY_LENGTH_STEP), MIN_DISPLAY_LENGTH);
		assert.strictEqual(adjustDisplayLength(MAX_DISPLAY_LENGTH, DISPLAY_LENGTH_STEP), MAX_DISPLAY_LENGTH);
		// 越界步长也不会突破上下限
		assert.strictEqual(adjustDisplayLength(12, -100), MIN_DISPLAY_LENGTH);
		assert.strictEqual(adjustDisplayLength(198, 100), MAX_DISPLAY_LENGTH);
	});

	test('脏值回落到默认值再调整', () => {
		assert.strictEqual(adjustDisplayLength(undefined, DISPLAY_LENGTH_STEP), DEFAULT_DISPLAY_LENGTH + DISPLAY_LENGTH_STEP);
		assert.strictEqual(adjustDisplayLength(0, -DISPLAY_LENGTH_STEP), DEFAULT_DISPLAY_LENGTH - DISPLAY_LENGTH_STEP);
	});
});
