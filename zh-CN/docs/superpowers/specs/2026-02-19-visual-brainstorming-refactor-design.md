# 可视化头脑风暴重构：浏览器显示与终端命令

**日期：** 2026-02-19
**状态：** 已批准
**范围：** `lib/brainstorm-server/`, `skills/brainstorming/visual-companion.md`, `tests/brainstorm-server/`

## 问题

在可视化头脑风暴过程中，Claude 将 `wait-for-feedback.sh` 作为后台任务运行并阻塞在 `TaskOutput(block=true, timeout=600s)` 上。这会完全占用 TUI —— 在可视化头脑风暴运行时用户无法向 Claude 输入。浏览器成为唯一的输入通道。

Claude Code 的执行模型是基于轮次的。Claude 无法在一个轮次内同时监听两个通道。阻塞式的 `TaskOutput` 模式是错误的原语 —— 它模拟了平台不支持的基于事件的行为。

## 设计

### 核心模型

**浏览器 = 交互式显示。** 显示设计稿，让用户点击选择选项。选择结果记录在服务器端。

**终端 = 对话通道。** 始终保持畅通，始终可用。用户在此与 Claude 对话。

### 循环流程

1. Claude 将 HTML 文件写入会话目录
2. 服务器通过 chokidar 检测到该文件，通过 WebSocket 推送重新加载指令到浏览器（保持不变）
3. Claude 结束其轮次 —— 告诉用户检查浏览器并在终端中回应
4. 用户查看浏览器，可选地点击选择选项，然后在终端中输入反馈
5. 在下一轮次中，Claude 读取 `$SCREEN_DIR/.events` 以获取浏览器交互流（点击、选择），并与终端文本合并
6. 迭代或推进

无后台任务。无 `TaskOutput` 阻塞。无轮询脚本。

### 关键删除项：`wait-for-feedback.sh`

完全删除。其目的是在“服务器将事件记录到标准输出”和“Claude 需要接收这些事件”之间建立桥梁。`.events` 文件取代了它 —— 服务器直接写入用户交互事件，而 Claude 使用平台提供的任何文件读取机制来读取它们。

### 关键新增项：`.events` 文件（每屏幕事件流）

服务器将所有用户交互事件写入 `$SCREEN_DIR/.events`，每行一个 JSON 对象。这为 Claude 提供了当前屏幕的完整交互流 —— 不仅仅是最终选择，还包括用户的探索路径（点击了 A，然后 B，最终选定 C）。

用户探索选项后的示例内容：

```jsonl
{"type":"click","choice":"a","text":"Option A - Preset-First Wizard","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Manual Config","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid Approach","timestamp":1706000115}
```

* 在单个屏幕内是追加写入。每个用户事件都作为新行追加。
* 当 chokidar 检测到新的 HTML 文件（推送新屏幕）时，文件会被清除（删除），防止陈旧的事件延续。
* 如果 Claude 读取时文件不存在，则表示没有发生浏览器交互 —— Claude 仅使用终端文本。
* 该文件仅包含用户事件（`click` 等）—— 不包含服务器生命周期事件（`server-started`、`screen-added`）。这使其保持小巧且专注。
* Claude 可以读取完整流来理解用户的探索模式，或者仅查看最后的 `choice` 事件以获取最终选择。

## 按文件划分的变更

### `index.js`（服务器）

**A. 将用户事件写入 `.events` 文件。**

在 WebSocket `message` 处理程序中，将事件记录到标准输出后：通过 `fs.appendFileSync` 将事件作为 JSON 行追加到 `$SCREEN_DIR/.events`。仅写入用户交互事件（那些带有 `source: 'user-event'` 的），不写入服务器生命周期事件。

**B. 在新屏幕时清除 `.events`。**

在 chokidar `add` 处理程序（检测到新的 `.html` 文件）中，如果 `$SCREEN_DIR/.events` 存在则删除它。这是明确的“新屏幕”信号 —— 比在每次重新加载都会触发的 GET `/` 时清除更好。

**C. 替换 `wrapInFrame` 内容注入。**

当前的正则表达式锚定在 `<div class="feedback-footer">`，而该内容正在被移除。替换为注释占位符：移除 `#claude-content` 内现有的默认内容（`<h2>Visual Brainstorming</h2>` 和副标题段落），并替换为单个 `<!-- CONTENT -->` 标记。内容注入变为 `frameTemplate.replace('<!-- CONTENT -->', content)`。更简单，并且如果模板格式更改也不会中断。

### `frame-template.html`（UI 框架）

**移除：**

* `feedback-footer` div（文本区域、发送按钮、标签、`.feedback-row`）
* 相关的 CSS（`.feedback-footer`、`.feedback-footer label`、`.feedback-row`、其中的文本区域和按钮样式）

**添加：**

* `<!-- CONTENT -->` 占位符在 `#claude-content` 内，替换默认文本
* 一个选择指示条，位于原来页脚的位置，有两种状态：
  * 默认：“点击上方选项，然后返回终端”
  * 选择后：“已选择选项 B —— 返回终端以继续”
* 指示条的 CSS（微妙，视觉重量与现有页眉相似）

**保持不变：**

* 带有“Brainstorm Companion”标题和连接状态的页眉栏
* `.main` 包装器和 `#claude-content` 容器
* 所有组件 CSS（`.options`、`.cards`、`.mockup`、`.split`、`.pros-cons`、占位符、模拟元素）
* 深色/浅色主题变量和媒体查询

### `helper.js`（客户端脚本）

**移除：**

* `sendToClaude()` 函数和“已发送给 Claude”页面接管
* `window.send()` 函数（与已移除的发送按钮关联）
* 表单提交处理程序 —— 没有反馈文本区域后无意义，增加日志噪音
* 输入变更处理程序 —— 原因同上
* `pageshow` 事件监听器（原为修复文本区域持久性而添加 —— 现在没有文本区域了）

**保留：**

* WebSocket 连接、重新连接逻辑、事件队列
* 重新加载处理程序（服务器推送时的 `window.location.reload()`）
* 用于选择高亮的 `window.toggleSelect()`
* `window.selectedChoice` 跟踪
* `window.brainstorm.send()` 和 `window.brainstorm.choice()` —— 这些与已移除的 `window.send()` 不同。它们调用 `sendEvent`，后者通过 WebSocket 记录到服务器。对自定义完整文档页面很有用。

**收窄范围：**

* 点击处理程序：仅捕获 `[data-choice]` 点击，而非所有按钮/链接。当浏览器是反馈通道时需要广泛捕获；现在仅用于选择跟踪。

**添加：**

* 在 `data-choice` 点击时，更新选择指示条文本以显示选择了哪个选项。

**从 `window.brainstorm` API 中移除：**

* `brainstorm.sendToClaude` —— 不再存在

### `visual-companion.md`（技能说明）

**重写“循环流程”部分**为上述非阻塞流程。移除所有对以下内容的引用：

* `wait-for-feedback.sh`
* `TaskOutput` 阻塞
* 超时/重试逻辑（600 秒超时，30 分钟上限）
* 描述 `send-to-claude` JSON 的“用户反馈格式”部分

**替换为：**

* 新循环（写入 HTML → 结束轮次 → 用户在终端回应 → 读取 `.events` → 迭代）
* `.events` 文件格式文档
* 指导说明：终端消息是主要反馈；`.events` 提供完整的浏览器交互流以获取额外上下文

**保留：**

* 服务器启动/关闭说明
* 内容片段与完整文档的指导
* CSS 类参考和可用组件
* 设计技巧（根据问题调整保真度、每屏幕 2-4 个选项等）

### `wait-for-feedback.sh`

**完全删除。**

### `tests/brainstorm-server/server.test.js`

需要更新的测试：

* 断言片段响应中存在 `feedback-footer` 的测试 —— 更新为断言选择指示条或 `<!-- CONTENT -->` 替换
* 断言 `helper.js` 包含 `send` 的测试 —— 更新以反映收窄的 API
* 断言 `sendToClaude` CSS 变量用法的测试 —— 移除（函数不再存在）

## 平台兼容性

服务器代码（`index.js`、`helper.js`、`frame-template.html`）完全与平台无关 —— 纯 Node.js 和浏览器 JavaScript。没有 Claude Code 特定引用。已通过后台终端交互在 Codex 上验证可行。

技能说明（`visual-companion.md`）是平台适配层。每个平台的 Claude 使用其自己的工具来启动服务器、读取 `.events` 等。非阻塞模型自然适用于所有平台，因为它不依赖任何平台特定的阻塞原语。

## 此项重构带来的能力

* **TUI 在可视化头脑风暴期间始终保持响应**
* **混合输入** —— 在浏览器中点击 + 在终端中键入，自然地合并
* **优雅降级** —— 浏览器关闭或用户未打开？终端仍然可用
* **更简单的架构** —— 无后台任务、无轮询脚本、无超时管理
* **跨平台** —— 相同的服务器代码适用于 Claude Code、Codex 及任何未来平台

## 此项重构舍弃的内容

* **纯浏览器反馈工作流** —— 用户必须返回终端才能继续。选择指示条会引导他们，但与旧的点击-发送-等待流程相比，这多了一个步骤。
* **来自浏览器的内联文本反馈** —— 文本区域已移除。所有文本反馈都通过终端进行。这是有意为之 —— 终端是比框架中的小文本区域更好的文本输入通道。
* **浏览器发送后的即时响应** —— 旧系统在用户点击发送时 Claude 会立即响应。现在用户切换到终端时存在间隙。实际上这只有几秒钟，并且用户可以在其终端消息中添加上下文。
