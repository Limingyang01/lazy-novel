// .mocharc.cjs
// Mocha configuration for vscode-test.
// Loads test/setup.js BEFORE test files so global.__lazyNovelTestContext
// is available to all suites.

module.exports = {
  require: ['test/setup.js'],
  timeout: 20000,
};