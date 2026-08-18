// test/setup.js
// Mocha global setup: provides a fake ExtensionContext on
// global.__lazyNovelTestContext so migration.test.js and
// book-repository.test.js run real assertions against an in-memory store.

// Build an in-memory Memento that mimics vscode.Memento's get/update semantics.
function makeMemento() {
  const store = new Map();
  return {
    get(key, defaultValue) {
      if (store.has(key)) return store.get(key);
      return defaultValue;
    },
    update(key, value) {
      if (value === undefined) {
        store.delete(key);
      } else {
        store.set(key, value);
      }
      return Promise.resolve();
    },
    keys() {
      return Array.from(store.keys());
    },
    _store: store,
  };
}

function makeUri(path) {
  return {
    scheme: 'file',
    path,
    fsPath: path,
    toString() { return `file://${path}`; },
    with() { return this; },
  };
}

global.__lazyNovelTestContext = {
  globalState: makeMemento(),
  workspaceState: makeMemento(),
  subscriptions: [],
  extensionPath: process.cwd(),
  extensionUri: makeUri(process.cwd()),
  asAbsolutePath(p) { return `${this.extensionPath}/${p}`; },
  environmentVariableCollection: {
    persistent: false,
    replace: () => {},
    append: () => {},
    prepend: () => {},
    get: () => undefined,
    forEach: () => {},
    delete: () => {},
    clear: () => {},
  },
};