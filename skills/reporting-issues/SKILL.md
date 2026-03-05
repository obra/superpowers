---
name: reporting-issues
description: Use when encountering UI/UX problems, visual defects, performance issues, or any bug that cannot be caught by tests or compilation. 中文触发场景：当用户说'这里有个UI问题'、'发现个体验缺陷'、'页面渲染有问题'、'记录这个bug'、'有个兼容性问题'等需要记录非确定性缺陷时使用此技能。
---

# Reporting Issues

## Overview

Record and track non-deterministic defects that slip through automated testing—UI/UX problems, visual glitches, performance issues, compatibility bugs, and experience flaws.

**Core principle:** Not all bugs are code errors. If it affects user satisfaction but tests pass, it belongs here.

**Announce at start:** "正在使用问题上报技能来记录这个缺陷..." (I'm using the reporting-issues skill to record this defect...)

## When to Use

**Use this skill when:**
- UI looks wrong but no test fails (misalignment, wrong color, broken layout)
- UX feels off (confusing flow, unexpected behavior, sluggish response)
- Performance issues ("a bit slow", loading delays, jank)
- Compatibility problems (works on Chrome, broken on Safari)
- Visual regressions ("this icon looks different")
- Accessibility concerns (contrast issues, keyboard navigation)

**Don't use when:**
- Tests fail → Use `test-driven-development` or `systematic-debugging`
- Code crashes → Use `systematic-debugging`
- Feature request → Use `brainstorming`

## The Process

### Step 1: Quick Assessment

Ask one question at a time:

**"这是什么类型的问题？"**

1. **UI/视觉** - 布局错乱、样式错误、组件显示异常
2. **UX/交互** - 流程困惑、操作反馈不清、体验不畅
3. **性能** - 加载慢、卡顿、资源占用高
4. **兼容性** - 浏览器/设备特定问题
5. **其他** - 不属于以上类别

**"严重程度如何？"**

| 级别 | 描述 | Beads Priority |
|------|------|----------------|
| P0 - 阻塞 | 功能完全无法使用，影响核心流程 | 0 |
| P1 - 严重 | 重要功能受损，有明显 workaround | 1 |
| P2 - 一般 | 影响体验，有替代方案 | 2 |
| P3 - 轻微 | 视觉瑕疵，几乎不影响使用 | 3 |

### Step 2: Gather Context

**"请描述问题现象："**
- What: 具体看到什么（截图描述）
- Where: 哪个页面/组件/流程
- When: 什么操作后发生
- Who: 影响哪些用户

**"复现步骤（如果有）："**
```
1. 进入 XXX 页面
2. 点击 YYY 按钮
3. 滚动到 ZZZ 位置
4. 观察到问题
```

**"期望行为 vs 实际行为："**
- Expected: 应该发生什么
- Actual: 实际发生什么

### Step 3: Document Integration

Create bug tracking document:

```bash
# Create bug document
BUG_DOC=$(node -e "
const { UnifiedDocsManager } = require('./lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());

const title = '${ISSUE_TITLE}';
const result = manager.createActiveDocument('bug', title, {
  severity: '${SEVERITY}',
  type: '${ISSUE_TYPE}'
}, {
  epic: '${CURRENT_EPIC_ID}'  // if in active development
});

console.log(result.path);
")
export BUG_DOC
echo "Created bug document: $BUG_DOC"
```

**Document template:**
```markdown
# Bug: [Title]

## 基本信息
- 类型: UI/UX/性能/兼容/其他
- 严重程度: P0/P1/P2/P3
- 创建时间: YYYY-MM-DD
- 状态: open

## 问题描述
[Step 2 收集的内容]

## 复现步骤
1. ...
2. ...

## 期望 vs 实际
- **期望**: ...
- **实际**: ...

## 环境信息
- 浏览器/平台: ...
- 版本: ...
- 相关截图: [attachments/]

## 关联文档
- Epic: [如果有]
- Task: [如果相关]

## 处理记录
- [YYYY-MM-DD] 创建问题
```

### Step 4: Beads Sync

**IF `beads.enabled: true`:**

```bash
node -e "
const { createBeadsSync } = require('./lib/beads-sync.js');
const sync = createBeadsSync(process.cwd());

if (sync.canSync() && process.env.BUG_DOC) {
  const priorityMap = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
  const priority = priorityMap['${SEVERITY}'] || 2;

  const bugId = sync.createTask(process.env.BUG_DOC, '${ISSUE_TITLE}', null, {
    type: 'bug',
    priority: priority,
    labels: ['horspowers', 'bug', '${ISSUE_TYPE}']
  });

  if (bugId) {
    console.log('✓ Bug tracked in beads:', bugId);
  }
}
" 2>/dev/null || echo "[beads] Sync skipped"
```

**Associate with current epic (if any):**
```bash
# Check if there's an active epic and link the bug
node -e "
const { createBeadsSync } = require('./lib/beads-sync.js');
const sync = createBeadsSync(process.cwd());

if (sync.canSync()) {
  const epicId = sync.findCurrentEpic();
  if (epicId && process.env.BUG_DOC) {
    const bugId = sync.extractBeadsId(process.env.BUG_DOC);
    if (bugId) {
      // Add dependency: bug blocks epic completion
      sync.addDependency(epicId, bugId);
      console.log('✓ Linked bug to epic:', epicId);
    }
  }
}
" 2>/dev/null
```

### Step 5: Next Actions

**Present options to user:**

```
✅ 问题已记录

文档: docs/active/bug-YYYY-MM-DD-xxx.md
Beads: bd-xxx (if enabled)

接下来：

1. 🔧 立即修复（使用 debugging/TDD 技能）
2. 📋 加入待办（稍后处理，继续当前工作）
3. 🔗 关联到当前任务（如果正在开发相关功能）
4. 🏁 结束（仅记录，暂不处理）

请选择：
```

**If user chooses "立即修复":**
- Use `horspowers:systematic-debugging` to investigate
- Or use `horspowers:test-driven-development` to write test first

**If user chooses "加入待办":**
- Document is already in `docs/active/`
- Will appear in `bd ready` when unblocked
- Can be picked up later

## Integration with Workflow

**During brainstorming:**
- If design review reveals UX concerns, use this skill to track them

**During executing-plans:**
- If manual testing reveals visual issues, use this skill before continuing

**During finishing-a-development-branch:**
- Check `docs/active/` for unresolved bugs before merging

## Key Principles

- **Lightweight** - Don't over-document, capture essentials only
- **Actionable** - Every bug should have clear next step
- **Traceable** - Link to epic/task when context exists
- **Visible** - Beads sync ensures bugs don't get forgotten

## Remember

- Not all issues need immediate fixing—prioritize based on severity
- UI/UX bugs often batch well—fix multiple small issues together
- Screenshots are worth 1000 words—encourage image attachments
- If you can't reproduce it, still record it (intermittent bugs are real)

## Example Flow

```
User: "这个按钮在 Safari 上显示错位了"

AI: "正在使用问题上报技能来记录这个缺陷..."

[Step 1]
AI: "这是什么类型的问题？"
User: "兼容性"

AI: "严重程度？"
User: "P2 - 一般"

[Step 2]
AI: "请描述问题现象..."
User: "按钮在 Safari 上向右偏移了 10px"

[Step 3-4]
AI: 创建 docs/active/bug-2026-03-05-safari-button-offset.md
AI: 同步到 beads: bd-a3f8e9

[Step 5]
AI: "✅ 问题已记录。接下来：1.立即修复 2.加入待办 3.结束"
User: "加入待办，继续当前功能"

AI: "好的，bug 已记录，继续执行当前计划..."
```
