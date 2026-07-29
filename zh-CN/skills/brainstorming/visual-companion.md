# 视觉伴侣指南

基于浏览器的可视化头脑风暴伴侣，用于展示原型图、图表和选项。

## 何时使用

按问题决定，而非按会话决定。判断标准是：**用户通过观看是否比阅读能更好地理解此内容？**

**使用浏览器** 当内容本身是视觉化的：

* **UI 原型图** — 线框图、布局、导航结构、组件设计
* **架构图** — 系统组件、数据流、关系图
* **并排视觉比较** — 比较两种布局、两种配色方案、两种设计方向
* **设计精修** — 当问题涉及外观、间距、视觉层次时
* **空间关系** — 状态机、流程图、以图表形式呈现的实体关系

**使用终端** 当内容是文本或表格时：

* **需求和范围问题** — “X 是什么意思？”、“哪些功能在范围内？”
* **概念性 A/B/C 选择** — 在文字描述的方法之间进行选择
* **权衡列表** — 利弊、比较表
* **技术决策** — API 设计、数据建模、架构方法选择
* **澄清性问题** — 任何答案是文字而非视觉偏好的情况

一个 *关于* UI 主题的问题并不自动成为视觉问题。“你想要哪种向导？”是概念性的——使用终端。“这些向导布局中哪个感觉合适？”是视觉性的——使用浏览器。

## 工作原理

服务器监视一个目录中的 HTML 文件，并将最新的一个提供给浏览器。你将 HTML 内容写入 `screen_dir`，用户即可在浏览器中查看并点击选择选项。选择记录会被保存到 `state_dir/events`，你可以在下一轮读取。

**内容片段与完整文档：** 如果您的 HTML 文件以 `<!DOCTYPE` 或 `<html` 开头，服务器会按原样提供（仅注入辅助脚本）。否则，服务器会自动将您的内容包装在框架模板中——添加页眉、CSS 主题、选择指示器以及所有交互式基础设施。**默认编写内容片段。** 仅在需要完全控制页面时才编写完整文档。

## 启动会话

```bash
# Start server with persistence (mockups saved to project)
scripts/start-server.sh --project-dir /path/to/project

# Returns: {"type":"server-started","port":52341,"url":"http://localhost:52341",
#           "screen_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/content",
#           "state_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/state"}
```

从响应中保存 `screen_dir` 和 `state_dir`。告知用户打开 URL。

**查找连接信息：** 服务器会将其启动 JSON 写入 `$STATE_DIR/server-info`。如果你在后台启动了服务器且未捕获标准输出，请读取该文件以获取 URL 和端口。使用 `--project-dir` 时，请检查 `<project>/.superpowers/brainstorm/` 以找到会话目录。

**注意：** 将项目根目录作为 `--project-dir` 传递，以便原型图持久保存在 `.superpowers/brainstorm/` 中并在服务器重启后保留。没有它，文件会进入 `/tmp` 并被清理。如果 `.superpowers/` 尚未存在，请提醒用户将其添加到 `.gitignore`。

**按平台启动服务器：**

**Claude Code (macOS / Linux):**

```bash
# Default mode works — the script backgrounds the server itself
scripts/start-server.sh --project-dir /path/to/project
```

**Claude Code (Windows):**

```bash
# Windows auto-detects and uses foreground mode, which blocks the tool call.
# Use run_in_background: true on the Bash tool call so the server survives
# across conversation turns.
scripts/start-server.sh --project-dir /path/to/project
```

通过 Bash 工具调用此功能时，请设置 `run_in_background: true`。然后在下一轮读取 `$STATE_DIR/server-info` 以获取 URL 和端口。

**Codex：**

```bash
# Codex reaps background processes. The script auto-detects CODEX_CI and
# switches to foreground mode. Run it normally — no extra flags needed.
scripts/start-server.sh --project-dir /path/to/project
```

**Gemini CLI：**

```bash
# Use --foreground and set is_background: true on your shell tool call
# so the process survives across turns
scripts/start-server.sh --project-dir /path/to/project --foreground
```

**其他环境：** 服务器必须在对话轮次之间持续在后台运行。如果您的环境回收分离的进程，请使用 `--foreground` 并使用您平台的背景执行机制启动命令。

如果 URL 无法从您的浏览器访问（在远程/容器化设置中常见），请绑定非环回主机：

```bash
scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

使用 `--url-host` 来控制返回的 URL JSON 中打印的主机名。

## 循环流程

1. **检查服务器是否存活**，然后**将 HTML 写入** `screen_dir` 中的一个新文件：
   * 每次写入前，检查 `$STATE_DIR/server-info` 是否存在。如果不存在（或存在 `$STATE_DIR/server-stopped`），则表示服务器已关闭——请使用 `start-server.sh` 重新启动它，然后再继续。服务器在 30 分钟无活动后会自动退出。
   * 使用语义化的文件名：`platform.html`、`visual-style.html`、`layout.html`
   * **切勿重复使用文件名**——每个界面都应使用一个新文件
   * 使用 Write 工具——**切勿使用 cat/heredoc**（会在终端中输出冗余信息）
   * 服务器会自动提供最新的文件

2. **告知用户预期内容并结束你的回合：**
   * 提醒他们 URL（每一步都要提醒，不仅仅是第一步）
   * 简要总结屏幕上的内容（例如：“为主页展示了 3 种布局选项”）
   * 请他们在终端中回应：“看一下并告诉我你的想法。如果愿意，可以点击选择一个选项。”

3. **在你的下一轮**——用户在终端中回应后：
   * 如果 `$STATE_DIR/events` 存在，请读取它——该文件包含用户的浏览器交互（点击、选择），格式为 JSON 行
   * 将其与用户的终端文本合并，以获取完整情况
   * 终端消息是主要反馈；`state_dir/events` 提供结构化的交互数据

4. **迭代或推进**——如果反馈改变了当前界面，请写入一个新文件（例如 `layout-v2.html`）。只有在当前步骤得到确认后，才进入下一个问题。

5. **返回终端时卸载**——当下一步不需要浏览器时（例如澄清问题、权衡讨论），推送一个等待界面以清除过时内容：

   ```html
   <!-- filename: waiting.html (或 waiting-2.html 等) -->
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">正在切换至终端...</p>
   </div>
   ```

   这可以避免用户在对话已推进时仍盯着已解决的选项。当下一个视觉问题出现时，照常推送新的内容文件。

6. 重复直到完成。

## 编写内容片段

仅编写页面内部的内容。服务器会自动将其包装在框架模板中（页眉、主题 CSS、选择指示器以及所有交互式基础设施）。

**最小示例：**

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

就这样。不需要 `<html>`、CSS 或 `<script>` 标签。服务器提供所有这些。

## 可用的 CSS 类

框架模板为您的内容提供以下 CSS 类：

### 选项（A/B/C 选择）

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

**多选：** 向容器添加 `data-multiselect` 以允许用户选择多个选项。每次点击切换项目。指示条显示计数。

```html
<div class="options" data-multiselect>
  <!-- same option markup — users can select/deselect multiple -->
</div>
```

### 卡片（视觉设计）

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup content --></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

### 原型图容器

```html
<div class="mockup">
  <div class="mockup-header">Preview: Dashboard Layout</div>
  <div class="mockup-body"><!-- your mockup HTML --></div>
</div>
```

### 分屏视图（并排）

```html
<div class="split">
  <div class="mockup"><!-- left --></div>
  <div class="mockup"><!-- right --></div>
</div>
```

### 利弊分析

```html
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>Benefit</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>Drawback</li></ul></div>
</div>
```

### 模拟元素（线框图构建块）

```html
<div class="mock-nav">Logo | Home | About | Contact</div>
<div style="display: flex;">
  <div class="mock-sidebar">Navigation</div>
  <div class="mock-content">Main content area</div>
</div>
<button class="mock-button">Action Button</button>
<input class="mock-input" placeholder="Input field">
<div class="placeholder">Placeholder area</div>
```

### 排版和版块

* `h2` — 页面标题
* `h3` — 版块标题
* `.subtitle` — 标题下方的辅助文本
* `.section` — 带底部边距的内容块
* `.label` — 小型大写标签文本

## 浏览器事件格式

当用户在浏览器中点击选项时，他们的交互会被记录到 `$STATE_DIR/events`（每行一个 JSON 对象）。当你推送新界面时，该文件会自动清空。

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Complex Grid","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

完整的事件流显示了用户的探索路径——他们可能在确定前点击了多个选项。最后的 `choice` 事件通常是最终选择，但点击模式可能揭示值得询问的犹豫或偏好。

如果 `$STATE_DIR/events` 不存在，则表示用户未与浏览器交互——请仅使用他们的终端文本。

## 设计技巧

* **根据问题调整保真度**——布局用线框图，精修问题用精修设计
* **在每个页面上解释问题**——“哪种布局感觉更专业？”而不仅仅是“选一个”
* **在推进前迭代**——如果反馈改变了当前屏幕，则编写新版本
* **每屏最多 2-4 个选项**
* **在重要时使用真实内容**——对于摄影作品集，使用实际图像（Unsplash）。占位符内容会掩盖设计问题。
* **保持原型图简洁**——专注于布局和结构，而非像素级完美的设计

## 文件命名

* 使用语义化名称：`platform.html`、`visual-style.html`、`layout.html`
* 切勿重复使用文件名——每个屏幕必须是新文件
* 对于迭代：附加版本后缀，如 `layout-v2.html`、`layout-v3.html`
* 服务器按修改时间提供最新文件

## 清理

```bash
scripts/stop-server.sh $SESSION_DIR
```

如果会话使用了 `--project-dir`，原型图文件将持久保存在 `.superpowers/brainstorm/` 中以供日后参考。只有 `/tmp` 会话会在停止时被删除。

## 参考

* 框架模板（CSS 参考）：`scripts/frame-template.html`
* 辅助脚本（客户端）：`scripts/helper.js`
