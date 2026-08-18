# Lazy Novel Spec 1 — Refactor + 项目重命名

- **状态**:Draft (待用户审阅)
- **日期**:2026-08-18
- **作者**:brainstorming skill
- **项目目录**:`D:\extra_project\lazy-novel\`
- **基线**:`thief-reader v0.0.10`(单文件 3610 行,JS)
- **后续 spec**:Spec 2(书库/扫描/标签)、Spec 3(主题/书签/搜索)

## 1. 目标

将 thief-reader 单文件 `extension.js` 重构为多文件模块化结构,迁移持久化数据,重命名项目为 `lazy-novel`,**完整保留现有行为**。同时为后续 Spec 2/3 铺路(添加少量基础设施)。

## 2. 非目标(明确不做)

- ❌ 添加新功能(扫描/书库/标签/主题/书签/搜索 —— Spec 2/3 范畴)
- ❌ 修改现有用户可见行为(快捷键除重命名 + 新增 `Ctrl+Shift+L` 外不变)
- ❌ 移除 `pdf-parse` / `epub2` 依赖(下一 spec 再考虑)
- ❌ 删除 `thief-reader.*` 旧 globalState 键(下一版本再清空,本次仅迁移)
- ❌ 引入 TypeScript(保持 JS)
- ❌ 引入打包工具(继续 ES modules + CommonJS 混用,沿用 thief-reader 风格)

## 3. 现有行为保留清单(Spec 1 必须 100% 等价)

| # | 行为 | 来源(thief-reader 中位置) |
|---|------|----------------------------|
| B1 | 状态栏文字渲染(章节标题 + 80 字符窗口 + 透明度 + 滚动指示) | `extension.js:3300-3341` |
| B2 | 章节预览弹窗(点击状态栏 + 透明度) | `FloatingWindowManager` 类 |
| B3 | 文件加载(PDF/TXT/EPUB/粘贴) | `ThiefReaderWebviewProvider._loadFileXxx` |
| B4 | 章节解析(10+ 模式:中文/英文/Markdown 分隔符等) | `ThiefReaderWebviewProvider._extractChapters` |
| B5 | 多文件位置记忆(per-file `lastChapter`/`lastScrollOffset`) | `StorageManager` |
| B6 | 文件状态检测(正常/缺失/错误) | `StorageManager.status` 字段 |
| B7 | 老板键 `Shift+空格` 切换状态栏显隐 | `lazyNovel.toggleVisibility` 命令 |
| B8 | `Alt+方向键` 滑动 / `Alt+Shift+方向键` 翻页 | `lazyNovel.scrollXxx` / `previousPage/nextPage` |
| B9 | 侧边栏 webview(文件列表 + 章节列表 + 设置) | `ThiefReaderWebviewProvider._webview` |
| B10 | 持久化到 `globalState` | `StorageManager` |

## 4. 架构设计

### 4.1 模块拆分(单文件 → 多文件)

```
D:\extra_project\lazy-novel\
├── extension.js                       # 入口(瘦身后 ~80 行)
├── package.json                       # 重命名 + keybindings 更新
├── README.md                          # 后续 spec 改写
├── src/
│   ├── library/
│   │   ├── BookRepository.js          # 现有 _files CRUD 抽象(本 spec 仅 stub)
│   │   └── Migration.js               # thief-reader.files → lazy-novel.books(本 spec 实现)
│   ├── chapter/
│   │   ├── ChapterParser.js           # 拆分自 _extractChapters
│   │   └── ChapterIndex.js            # 章节→字符偏移查询
│   ├── reader/
│   │   ├── StatusBarRenderer.js       # 状态栏文字渲染(从 _updateStatusBar 抽出)
│   │   ├── Pager.js                   # 字符滑动/翻页(从 _previousPage/_nextPage 抽出)
│   │   └── ReaderController.js        # 协调状态栏 + 章节 + 文件状态
│   ├── preview/
│   │   ├── FloatingWindow.js          # 来自 FloatingWindowManager
│   │   └── PreviewController.js       # 章节预览控制逻辑
│   ├── storage/
│   │   ├── StorageManager.js          # 现有 StorageManager 改名 + 适配新 schema
│   │   └── Schema.js                  # schema 版本常量 + 字段默认值
│   ├── input/
│   │   ├── AltKeyManager.js           # 现有 AltKeyManager 改名
│   │   ├── ScrollWheelHandler.js      # 现有 ScrollWheelHandler 改名
│   │   └── MouseEventListener.js      # 现有 MouseEventListener 改名
│   ├── ui/
│   │   ├── SidebarProvider.js         # 来自 ThiefReaderWebviewProvider 的 webview 部分
│   │   └── html/
│   │       └── sidebar.html           # webview HTML(从字面量提取)
│   └── commands/
│       └── registerCommands.js        # 命令注册(从 activate() 中抽出)
└── test/
    └── integration/
        └── extension.test.js          # 新增:激活 + 关键路径验证
```

### 4.2 模块依赖图

```
extension.js
   └── registerCommands.js
         ├── ReaderController
         │     ├── StatusBarRenderer
         │     ├── Pager
         │     ├── ChapterParser
         │     ├── ChapterIndex
         │     └── StorageManager
         ├── PreviewController
         │     └── FloatingWindow
         ├── SidebarProvider
         │     └── ReaderController(只读)
         ├── BookRepository(stub)
         ├── Migration
         └── AltKeyManager / ScrollWheelHandler / MouseEventListener
```

**规则**:`ReaderController` 是中央协调器,其他模块不直接相互依赖;UI 模块只读 controller 状态。

### 4.3 数据迁移

启动时(`activate()` 早阶段)执行一次性迁移:

```
if (!context.globalState.get('lazy-novel.books') && context.globalState.get('thief-reader.files')) {
  const oldFiles = context.globalState.get('thief-reader.files');
  const newBooks = oldFiles.map(file => ({
    id: file.id,
    title: file.name,
    format: file.type,        // 保留字符串 'PDF'/'TXT'/'EPUB'/'粘贴'
    filePath: file.path,
    fullText: file.fullText,
    tags: [],                // 新增
    status: file.status,
    missing: false,          // 新增
    addedAt: file.addedTime,
    progress: {
      chapter: file.lastChapter,
      offset: file.lastScrollOffset,
      updatedAt: file.lastReadTime
    },
    chapterPositions: file.chapterPositions || {},
    schemaVersion: 2
  }));
  context.globalState.update('lazy-novel.books', newBooks);
  context.globalState.update('lazy-novel.migrated', { from: 'thief-reader.files', at: Date.now() });
  // 保留旧键不清空
}
```

迁移日志:`console.log('[lazy-novel] migrated N books from thief-reader.files')`。

## 5. 项目名重命名

### 5.1 `package.json`

| 字段 | 旧值 | 新值 |
|------|------|------|
| `name` | `"thief-reader"` | `"lazy-novel"` |
| `displayName` | `"thief-reader"` | `"Lazy Novel"` |
| `description` | `"一个隐蔽的 VSCode 阅读器插件..."` | `"基于状态栏隐蔽阅读的 VSCode 插件,支持 PDF/TXT/EPUB,带书库与主题管理(详见 spec 2/3)"` |
| `publisher` | `"neroneroffy"` | 保留(原作者) |
| `repository` | `"https://github.com/neroneroffy/thief-reader"` | `"https://github.com/neroneroffy/thief-reader"` + 注明 "fork for lazy-novel" |
| `engines.vscode` | `"^1.85.0"` | 保留 |

### 5.2 命令 / 快捷键 / 视图

| 旧 ID | 新 ID | 默认快捷键 |
|-------|-------|------------|
| `thief-reader.open` | `lazyNovel.open` | (无) |
| `thief-reader.previousPage` | `lazyNovel.previousPage` | `Alt+Shift+Left` |
| `thief-reader.nextPage` | `lazyNovel.nextPage` | `Alt+Shift+Right` |
| `thief-reader.scrollLeft` | `lazyNovel.scrollLeft` | `Alt+Left` |
| `thief-reader.scrollRight` | `lazyNovel.scrollRight` | `Alt+Right` |
| `thief-reader.toggleVisibility` | `lazyNovel.toggleVisibility` | `Shift+Space` |
| `thief-reader.toggleChapterPreview` | `lazyNovel.toggleChapterPreview` | (无) |
| `thief-reader.showHoverPreview` | `lazyNovel.showHoverPreview` | `Ctrl+Alt+H` |
| `thief-reader.hideHoverPreview` | `lazyNovel.hideHoverPreview` | `Ctrl+Alt+Shift+H` |
| **(新)** | `lazyNovel.openBookshelf` | `Ctrl+Shift+L` |
| **(新)** | `lazyNovel.scanFolder` | (无) |

**关键决策**:`Ctrl+Shift+H`(用户期望的老板键)留到 Spec 3。Spec 1 不引入新的"全隐藏"快捷键,因为:
- Spec 3 才完成主题系统(透明度预设)
- 现有 `Shift+Space`(老板键切换显隐)已足够

**Spec 1 中 `openBookshelf` 与 `scanFolder` 的实现语义**:
- `lazyNovel.openBookshelf` 在 Spec 1 中**仅注册命令**,行为等价于现有 `lazyNovel.toggleChapterPreview`(聚焦到侧边栏 + 打开章节预览)。等价的 1 行 `vscode.commands.registerCommand` 调用,无新功能。
- `lazyNovel.scanFolder` 同上,Spec 1 仅注册命令,触发后给出"该功能将在 Spec 2 提供"的提示,实际扫描功能在 Spec 2 实现。

这样做的理由:**快捷键与命令 ID 是用户可见契约**,先注册确保后续 spec 实现时无需再改动快捷键;实际功能分阶段交付不影响用户体验。

### 5.3 视图容器

| 旧 | 新 |
|---|---|
| `thief-reader-explorer` | `lazy-novel-explorer` |
| `thief-reader-main` | `lazy-novel-main` |

### 5.4 globalState 键

| 旧键 | 新键 |
|------|------|
| `thief-reader.files` | `lazy-novel.books` |
| `thief-reader.readingState` | `lazy-novel.readingState` |
| (新增) | `lazy-novel.migrated`(迁移元数据) |

## 6. 少量增强(Spec 1 范围内)

| 增强 | 用途 | 工作量 |
|------|------|--------|
| **存储 `schemaVersion` 字段** | 后续迁移提供基础 | 极小 |
| **`Schema.js` 集中默认值** | 后续字段扩展只改一处 | 极小 |
| **`StatusBarRenderer` 抽离** | Spec 3 主题替换渲染时无需大改 | 中 |
| **`BookRepository.js` 创建空 stub** | Spec 2 直接在 stub 上加 API | 极小 |
| **`Migration.js` 独立模块** | 未来 thief-reader → lazy-novel 迁移复用 | 极小 |
| **`commands/registerCommands.js` 独立模块** | 后续 spec 加命令容易 | 小 |

**YAGNI(不做)**:
- ❌ 任何新用户可见功能
- ❌ 任何 UI 改动
- ❌ 依赖升级

## 7. 测试策略

### 7.1 集成测试(`test/integration/extension.test.js`)

沿用 thief-reader 已有的 `.vscode-test.mjs` 配置,扩展测试覆盖以下**关键路径**:

1. **激活**:扩展加载,`lazyNovel.*` 命令注册到 VSCode
2. **数据迁移**:`thief-reader.files` 存在时,启动后 `lazy-novel.books` 写入
3. **状态栏渲染**:加载 TXT 文件后,`createStatusBarItem` 被调用
4. **快捷键**:`previousPage` / `nextPage` / `scrollLeft` / `scrollRight` / `toggleVisibility` / `openBookshelf` 全部存在
5. **持久化往返**:加载文件 → 翻页 → 关闭 → 重新打开 → 位置恢复
6. **老板键**:`toggleVisibility` 切换状态栏文本显隐

### 7.2 不测

- ❌ 章节解析算法(继承自原 `_extractChapters`,行为等价通过集成测试间接覆盖)
- ❌ 视觉样式
- ❌ 性能

## 8. 命令清单

### 8.1 `package.json` contributes.commands

```json
[
  { "command": "lazyNovel.open", "title": "Lazy Novel: 打开", "category": "Lazy Novel" },
  { "command": "lazyNovel.previousPage", "title": "Lazy Novel: 上一页", "category": "Lazy Novel" },
  { "command": "lazyNovel.nextPage", "title": "Lazy Novel: 下一页", "category": "Lazy Novel" },
  { "command": "lazyNovel.scrollLeft", "title": "Lazy Novel: 向左滑动", "category": "Lazy Novel" },
  { "command": "lazyNovel.scrollRight", "title": "Lazy Novel: 向右滑动", "category": "Lazy Novel" },
  { "command": "lazyNovel.toggleVisibility", "title": "Lazy Novel: 切换状态栏文字显示/隐藏", "category": "Lazy Novel" },
  { "command": "lazyNovel.toggleChapterPreview", "title": "Lazy Novel: 切换章节预览", "category": "Lazy Novel" },
  { "command": "lazyNovel.showHoverPreview", "title": "Lazy Novel: 显示悬停预览", "category": "Lazy Novel" },
  { "command": "lazyNovel.hideHoverPreview", "title": "Lazy Novel: 隐藏悬停预览", "category": "Lazy Novel" },
  { "command": "lazyNovel.openBookshelf", "title": "Lazy Novel: 打开阅读面板", "category": "Lazy Novel" },
  { "command": "lazyNovel.scanFolder", "title": "Lazy Novel: 扫描文件夹", "category": "Lazy Novel" }
]
```

### 8.2 contributes.keybindings

```json
[
  { "command": "lazyNovel.previousPage", "key": "alt+shift+left" },
  { "command": "lazyNovel.nextPage", "key": "alt+shift+right" },
  { "command": "lazyNovel.scrollLeft", "key": "alt+left" },
  { "command": "lazyNovel.scrollRight", "key": "alt+right" },
  { "command": "lazyNovel.toggleVisibility", "key": "shift+space" },
  { "command": "lazyNovel.showHoverPreview", "key": "ctrl+alt+h" },
  { "command": "lazyNovel.hideHoverPreview", "key": "ctrl+alt+shift+h" },
  { "command": "lazyNovel.openBookshelf", "key": "ctrl+shift+l" }
]
```

### 8.3 contributes.viewsContainers / views

```json
{
  "viewsContainers": {
    "activitybar": [{
      "id": "lazy-novel-explorer",
      "title": "Lazy Novel",
      "icon": "main-icon.png"
    }]
  },
  "views": {
    "lazy-novel-explorer": [{
      "id": "lazy-novel-main",
      "name": "Lazy Novel 主界面",
      "type": "webview"
    }]
  }
}
```

### 8.4 contributes.configuration(沿用)

```json
{
  "configuration": {
    "title": "Lazy Novel",
    "properties": {
      "lazyNovel.statusBarOpacity": {
        "type": "number", "default": 100, "minimum": 5, "maximum": 100,
        "description": "状态栏文字区域的透明度 (5-100)"
      }
    }
  }
}
```

## 9. 错误处理

| 场景 | 处理 |
|------|------|
| 迁移时数据格式错误 | 跳过单条记录,日志记录,完成整体迁移 |
| 模块加载失败 | VSCode 自动禁用扩展 |
| 测试运行时找不到扩展 | 测试断言失败 + 输出诊断 |
| 旧键和新键同时存在 | 仅用新键,旧键保留(不删) |

## 10. 风险与权衡

| 风险 | 缓解 |
|------|------|
| 3610 行单文件拆错位置 | 集成测试覆盖关键路径 |
| 数据迁移破坏现有用户数据 | 双键策略;启动日志 |
| 模块跨状态共享变复杂 | ReaderController 中央协调 |
| `package.json` 重命名后用户需重装 | 开发期可接受;README 注明 |
| 原代码风格不一致(函数式 + class 混用) | 拆分时统一模块为 class 风格 |
| `AltKeyManager` 实际不工作(原代码仅 console.log) | 保留现状(Spec 1 不修 bug),Spec 3 重新设计老板键时一并修复 |

## 11. 后续 Spec 衔接

- **Spec 2**:在 `BookRepository.js` stub 基础上加完整 CRUD + TagService + FolderScanner + 侧边栏 UI 扩展
- **Spec 3**:在 `StatusBarRenderer.js` 抽离基础上加 ThemeSettings;在 BookRepository 基础上加 BookmarkService 和 InBookSearch;此时引入 `Ctrl+Shift+H` 全老板键
- **Spec 4(可选)**:打包发布、性能优化、清理 thief-reader 旧键

## 12. 文件结构变更总览

| 操作 | 路径 | 用途 |
|------|------|------|
| 修改 | `extension.js` | 3610 行 → ~80 行(只保留 activate/deactivate/require) |
| 修改 | `package.json` | 重命名 + commands/keybindings/views 重命名 |
| 新建 | `src/library/BookRepository.js` | stub(导出空 class) |
| 新建 | `src/library/Migration.js` | 一次性迁移逻辑 |
| 新建 | `src/chapter/ChapterParser.js` | 从 extension.js 拆出 _extractChapters |
| 新建 | `src/chapter/ChapterIndex.js` | 章节→字符偏移 |
| 新建 | `src/reader/StatusBarRenderer.js` | 状态栏渲染逻辑 |
| 新建 | `src/reader/Pager.js` | 翻页/滑动逻辑 |
| 新建 | `src/reader/ReaderController.js` | 中央协调器 |
| 新建 | `src/preview/FloatingWindow.js` | 弹窗类(改名自 FloatingWindowManager) |
| 新建 | `src/preview/PreviewController.js` | 弹窗控制 |
| 新建 | `src/storage/StorageManager.js` | 重命名 + 适配新 schema |
| 新建 | `src/storage/Schema.js` | schema 常量 |
| 新建 | `src/input/AltKeyManager.js` | 改名 |
| 新建 | `src/input/ScrollWheelHandler.js` | 改名 |
| 新建 | `src/input/MouseEventListener.js` | 改名 |
| 新建 | `src/ui/SidebarProvider.js` | webview provider(改名自 ThiefReaderWebviewProvider) |
| 新建 | `src/ui/html/sidebar.html` | webview HTML(从字面量提取) |
| 新建 | `src/commands/registerCommands.js` | 命令注册 |
| 新建 | `test/integration/extension.test.js` | 集成测试 |

**所有原代码保留在 extension.js 的逻辑都被 1:1 搬到对应模块**,无功能删减。

## 13. 待用户确认的开放点

无。所有关键决策已在 brainstorm 阶段确认。