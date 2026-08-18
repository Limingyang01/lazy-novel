const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 防止「只改 package.json 不改 extension.js」的命名不一致导致侧边栏空白 / 命令失效
suite('package.json 与 extension.js id 一致性', () => {
	const root = path.join(__dirname, '..');
	const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
	const source = fs.readFileSync(path.join(root, 'extension.js'), 'utf8');

	const registeredCommands = [...source.matchAll(/registerCommand\('([^']+)'/g)].map(m => m[1]);
	const registeredViews = [...source.matchAll(/registerWebviewViewProvider\('([^']+)'/g)].map(m => m[1]);

	test('声明的 webview view id 有对应的 provider 注册', () => {
		const declaredViews = Object.values(pkg.contributes.views)
			.flat()
			.filter(v => v.type === 'webview')
			.map(v => v.id);

		assert.ok(declaredViews.length > 0, 'package.json 未声明任何 webview view');
		for (const id of declaredViews) {
			assert.ok(
				registeredViews.includes(id),
				`view "${id}" 没有 registerWebviewViewProvider，侧边栏会是空白`
			);
		}
	});

	test('注册的每个命令都在 package.json 中声明', () => {
		const declaredCommands = pkg.contributes.commands.map(c => c.command);

		assert.ok(registeredCommands.length > 0, 'extension.js 未注册任何命令');
		for (const id of registeredCommands) {
			assert.ok(
				declaredCommands.includes(id),
				`命令 "${id}" 已注册但 package.json 未声明，命令面板里找不到`
			);
		}
	});

	test('keybinding 绑定的命令都已注册', () => {
		for (const kb of pkg.contributes.keybindings) {
			assert.ok(
				registeredCommands.includes(kb.command),
				`快捷键 "${kb.key}" 绑定的 "${kb.command}" 未注册，按键无效`
			);
		}
	});
});
