# 第 3 轮：Visual Companion 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-04-28

## 目标

将 Horspowers 现有的 Visual Companion / brainstorm server 半成品补成正式可用状态：保留 `.horspowers/brainstorm/` 本地命名和现有 server 实现，补齐更完整的使用指南、可执行的测试入口，以及对应验证。

## 架构方案

本轮不重写 `server.cjs` 主体逻辑，而是基于当前已经存在的本地化 server 和测试文件做“产品化收口”。`visual-companion.md` 吸收上游更完整的操作说明与内容写法指导，但继续使用 Horspowers 路径和宿主说明；`tests/brainstorm-server` 则补 runner / 文档 / 测试脚本配置，让 Node 集成测试和 Windows 生命周期测试都能被一致执行。

## 技术栈

Markdown 指南文档、Bash 测试 runner、Node 集成测试、WebSocket/HTTP server 测试、npm 依赖安装流程

---

### Task 1: 补齐 Visual Companion 指南深度

**Files:**
- Modify: `skills/brainstorming/visual-companion.md`
- Reference: upstream `skills/brainstorming/visual-companion.md`

**Step 1: 对比本地与上游指南差异**

确认本地文档缺失但 round 3 有价值的内容：
- content fragment vs full document 的明确说明
- 每轮浏览器循环的更完整操作细节
- 可用 CSS 类和示例结构
- 等待页 / unload 场景
- 更完整的 design tips

Run:

```bash
sed -n '1,260p' skills/brainstorming/visual-companion.md
git show upstream/dev:skills/brainstorming/visual-companion.md | sed -n '1,260p'
```

Expected:
- 能明确列出需要补齐的段落，同时保留 `.horspowers/brainstorm/`

**Step 2: 吸收高价值说明，但保留 Horspowers 本地化命名**

修改 `skills/brainstorming/visual-companion.md`：
- 保留 `.horspowers/brainstorm/`
- 保留 Codex/Claude/Gemini 平台说明
- 补充 content fragment / full document、CSS classes、browser loop、waiting screen 等实操信息
- 避免把 `.superpowers/brainstorm/` 或上游命名重新写回来

**Step 3: 自检文档边界**

确认文档没有越界到：
- 强制所有 brainstorming 使用浏览器
- marketplace / 插件发布
- 新客户端支持

Run:

```bash
rg -n "\.horspowers/brainstorm|\.superpowers/brainstorm|waiting|fragment|CSS Classes|Codex" skills/brainstorming/visual-companion.md
```

Expected:
- 只出现 Horspowers 路径
- 新说明段落已落地

**Step 4: 提交本任务**

```bash
git add skills/brainstorming/visual-companion.md
git commit -m "docs: expand visual companion guide"
```

### Task 2: 让 brainstorm-server 测试可直接执行

**Files:**
- Create: `tests/brainstorm-server/run-tests.sh`
- Create: `tests/brainstorm-server/README.md`
- Modify: `tests/brainstorm-server/package.json`

**Step 1: 设计统一 runner**

新增 `tests/brainstorm-server/run-tests.sh`，要求：
- 检查 `node` / `npm`
- 在缺少 `node_modules/ws` 时自动执行 `npm ci`
- 运行 `node server.test.js`
- 运行 `node ws-protocol.test.js`
- 运行 `bash windows-lifecycle.test.sh`

**Step 2: 修正 package.json 的测试入口**

更新 `tests/brainstorm-server/package.json`，让 `npm test` 至少覆盖：
- `server.test.js`
- `ws-protocol.test.js`

Windows 生命周期测试保留在 shell runner 中，不强行塞进 `npm test`。

**Step 3: 补 README 说明**

新增 `tests/brainstorm-server/README.md`，写清：
- 依赖：Node + npm
- 推荐命令：`bash ./run-tests.sh`
- `npm test` 只覆盖 Node 侧测试
- `windows-lifecycle.test.sh` 在非 Windows 平台会部分 skip

**Step 4: 跑本地验证**

Run:

```bash
bash tests/brainstorm-server/run-tests.sh
```

Expected:
- 自动准备依赖后通过
- 非 Windows 平台显示合理 skip

**Step 5: 提交本任务**

```bash
git add tests/brainstorm-server/run-tests.sh \
        tests/brainstorm-server/README.md \
        tests/brainstorm-server/package.json
git commit -m "test: add brainstorm server runner"
```

### Task 3: 跑 round 3 回归并收尾

**Files:**
- Review: `skills/brainstorming/visual-companion.md`
- Review: `skills/brainstorming/scripts/*`
- Review: `tests/brainstorm-server/*`

**Step 1: 跑 brainstorm-server 定向测试**

Run:

```bash
bash tests/brainstorm-server/run-tests.sh
```

Expected:
- Node 测试通过
- Windows 生命周期测试通过或合理 skip

**Step 2: 进行文本级范围复核**

确认没有混入：
- round 4 的旧 Claude 测试稳定化
- marketplace / plugin 逻辑
- 新客户端支持

**Step 3: 记录验证状态**

Run:

```bash
git status --short
git log --oneline -5
```

Expected:
- 仅包含 round 3 相关变更
