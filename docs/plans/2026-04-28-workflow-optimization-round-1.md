# 第 1 轮：工作流优化 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-04-28

## 目标

吸收上游工作流优化中对 Horspowers 当前最有价值的两项能力：`subagent-driven-development` 连续执行优化，以及 `using-git-worktrees` 的 detect-and-defer / rototill 思路，并为 Claude/Codex 维持稳定测试覆盖。

## 架构方案

本轮只改动工作流 skill 与对应测试，不引入文档审查或 visual companion。先将 `subagent-driven-development` 的“连续执行、不无谓停顿”行为与当前 Horspowers 文档集成版 skill 对齐，再将 `using-git-worktrees` 从“固定 git worktree 流程”升级为“先检测隔离环境、优先原生工具、最后回退 git worktree”的模式，最后补齐并跑通 Claude/Codex 回归测试。

## 技术栈

Markdown skill 文档、Bash 测试脚本、Claude Code skill 测试、Codex 测试、git worktree 语义验证

---

### Task 1: 对齐 SDD 的连续执行语义

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Test: `tests/claude-code/test-subagent-driven-development.sh`

**Step 1: 先写/调整失败断言，覆盖“不要每 3 个任务停顿”的行为**

在 `tests/claude-code/test-subagent-driven-development.sh` 增加或改造一条断言，验证 skill 明确要求：
- 不要在任务之间向用户做“Should I continue?”式暂停
- 只有 `BLOCKED / 真实歧义 / 全部完成` 才停止

可接受的断言关键词示例：

```bash
if echo "$output" | grep -qiE "(do not pause|don't pause|execute all tasks without stopping|不要停下来确认|不要每个任务后都汇报|只有.*blocked|只有.*歧义|全部完成才停止)"; then
    : # pass
fi
```

**Step 2: 运行单测，确认它先失败**

Run:

```bash
bash tests/claude-code/test-subagent-driven-development.sh
```

Expected:
- 当前版本在新增断言处失败
- 失败信息明确指向“连续执行/不暂停”语义缺失

**Step 3: 在 skill 文档中引入连续执行语义，但保留 Horspowers 现有文档上下文集成**

修改 `skills/subagent-driven-development/SKILL.md`：
- 增加类似 upstream 的“Continuous execution”原则
- 明确禁止中途进度汇报式停顿
- 保留当前 Horspowers 的 `TASK_DOC / docs/active / documentation.enabled` 相关步骤

必要时同步微调 `implementer-prompt.md` 中对完成后汇报的措辞，避免鼓励过度汇报。

建议目标表达：

```markdown
**Continuous execution:** Do not pause to check in with the user between tasks.
Only stop for BLOCKED status, genuine ambiguity, or all tasks complete.
```

**Step 4: 再跑单测，确认通过**

Run:

```bash
bash tests/claude-code/test-subagent-driven-development.sh
```

Expected:
- `=== All subagent-driven-development skill tests passed ===`

**Step 5: 提交本任务**

```bash
git add skills/subagent-driven-development/SKILL.md \
        skills/subagent-driven-development/implementer-prompt.md \
        tests/claude-code/test-subagent-driven-development.sh
git commit -m "feat: align sdd continuous execution behavior"
```

### Task 2: 重构 using-git-worktrees 为 detect-and-defer 模型

**Files:**
- Modify: `skills/using-git-worktrees/SKILL.md`
- Reference: `docs/plans/2026-04-28-design-post-sync-roadmap.md`
- Reference only: upstream `docs/superpowers/specs/2026-04-06-worktree-rototill-design.md`

**Step 1: 先梳理当前 skill 与目标行为差异**

人工比对当前文件与上游关键设计，确认本轮要落的最小集：
- Step 0 检测当前是否已在隔离工作区
- 原生 worktree tool 优先
- `git worktree add` 仅作 fallback
- 保留当前仓库已有 `.worktrees/` 习惯
- 去掉旧版“必须询问目录位置”的硬流程

记录目标，不改代码。

**Step 2: 直接重写 skill 主流程草稿**

在 `skills/using-git-worktrees/SKILL.md` 中重构为以下逻辑：

1. Step 0: `GIT_DIR != GIT_COMMON` 检测是否已在 worktree
2. 若已隔离：直接复用，不再创建新的 worktree
3. 若未隔离：先征求是否创建隔离环境
4. Step 1a: 优先平台原生 worktree 工具
5. Step 1b: 无原生工具时才回退到 `git worktree add`

需要保留的本地约束：
- `.worktrees/` 优先于 `worktrees/`
- 项目内目录必须 `git check-ignore`
- baseline setup / test 仍保留

**Step 3: 把旧的目录选择和普通分支策略改成“兼容但不主推”的表述**

处理旧版 skill 中这些内容：
- 交互式目录选择
- 复杂的 simple/worktree 模式选择
- 针对 `CLAUDE.md` 的硬编码依赖

目标：
- 优先写成“已有目录 > 指令文件偏好 > 默认 `.worktrees/`”
- 不再把普通分支策略写成主流程中心
- 文案改成平台中性，不绑定单一宿主

**Step 4: 进行文本级自检**

人工检查 `SKILL.md`，确认没有以下冲突：
- 一边说“原生工具优先”，一边又直接给出 `git worktree add` 当默认答案
- 一边说“已在隔离环境不再创建”，一边又继续走创建流程
- 仍残留只适用于 Claude 的硬编码描述

如果发现矛盾，直接修正文案。

**Step 5: 提交本任务**

```bash
git add skills/using-git-worktrees/SKILL.md
git commit -m "feat: rewrite git worktree workflow with detect-and-defer"
```

### Task 3: 补 worktree 原生优先测试并验证新 skill

**Files:**
- Create: `tests/claude-code/test-worktree-native-preference.sh`
- Modify: `tests/claude-code/README.md`
- Modify: `tests/claude-code/TEST-RUNNERS.md`

**Step 1: 引入上游测试作为本地化起点**

参考 upstream 的 `tests/claude-code/test-worktree-native-preference.sh`，创建本地版本。

本地化要求：
- 保持路径与 `test-helpers.sh` 兼容
- 文案可以继续保留中文注释或双语说明
- 目标仍是验证 agent 在有原生 worktree 工具语境时，不应优先输出 `git worktree add`

**Step 2: 先运行一次新测试，确认它在旧/半成品状态下能暴露问题**

Run:

```bash
bash tests/claude-code/test-worktree-native-preference.sh green
```

Expected:
- 如果 skill 仍偏向 `git worktree add`，测试失败
- 如果当前已经足够接近，也至少确认输出与预期一致

**Step 3: 根据测试结果微调 using-git-worktrees 文案**

如果测试失败，只改 `skills/using-git-worktrees/SKILL.md` 中最小必要文案，例如：
- 明确点名 `EnterWorktree / WorktreeCreate / /worktree / --worktree`
- 明确“用户同意创建隔离工作区 = 可使用原生工具”
- 在 red flags 里明确写出“有原生工具时直接用 git worktree add 是错误”

**Step 4: 更新测试说明文档**

更新：
- `tests/claude-code/README.md`
- `tests/claude-code/TEST-RUNNERS.md`

至少补充：
- 新增 worktree native preference 测试的用途
- 推荐执行命令
- 它验证的是“原生工具优先”而不是“真的创建 worktree”

**Step 5: 提交本任务**

```bash
git add tests/claude-code/test-worktree-native-preference.sh \
        tests/claude-code/README.md \
        tests/claude-code/TEST-RUNNERS.md \
        skills/using-git-worktrees/SKILL.md
git commit -m "test: add native worktree preference coverage"
```

### Task 4: 跑回归并做第 1 轮收尾

**Files:**
- Review: `skills/subagent-driven-development/SKILL.md`
- Review: `skills/using-git-worktrees/SKILL.md`
- Review: `tests/claude-code/*`
- Review: `tests/codex/*`

**Step 1: 跑定向 Claude 测试**

Run:

```bash
bash tests/claude-code/test-subagent-driven-development.sh
bash tests/claude-code/test-worktree-native-preference.sh green
```

Expected:
- 两个脚本都通过

**Step 2: 跑 Claude full 套件**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --suite full
```

Expected:
- `STATUS: PASSED`

注意：如果出现明确的 API/server 瞬时错误，先重试一次；只有在可复现时才按代码问题处理。

**Step 3: 跑 Codex 回归**

Run:

```bash
bash tests/codex/run-tests.sh
```

Expected:
- Codex 相关测试保持通过

**Step 4: 做一轮人工回顾**

检查要点：
- `using-git-worktrees` 没有破坏当前 `.worktrees/` 本地惯例
- `subagent-driven-development` 仍保留 Horspowers 文档集成能力
- 没有提前混入第 2/3 轮功能

如发现越界改动，先删回到第 1 轮范围内。

**Step 5: 提交收尾**

```bash
git add skills/subagent-driven-development/SKILL.md \
        skills/subagent-driven-development/implementer-prompt.md \
        skills/using-git-worktrees/SKILL.md \
        tests/claude-code/test-subagent-driven-development.sh \
        tests/claude-code/test-worktree-native-preference.sh \
        tests/claude-code/README.md \
        tests/claude-code/TEST-RUNNERS.md
git commit -m "test: verify workflow optimization round 1"
```

---

## 参考资料

- 设计文档: `docs/plans/2026-04-28-design-post-sync-roadmap.md`
- 当前技能:
  - `skills/subagent-driven-development/SKILL.md`
  - `skills/using-git-worktrees/SKILL.md`
- 上游参考:
  - commit `49bcb34` `fix: prevent subagent-driven-development from pausing every 3 tasks`
  - commit `4652e65` `feat: rewrite using-git-worktrees with detect-and-defer`
  - `docs/superpowers/specs/2026-04-06-worktree-rototill-design.md`
  - `tests/claude-code/test-worktree-native-preference.sh`

## 验收标准

1. `subagent-driven-development` 明确连续执行，不再鼓励每几个任务暂停汇报
2. `using-git-worktrees` 先检测现有隔离环境，再优先原生工具，最后才回退 git worktree
3. 新增 worktree native preference 测试
4. Claude full 套件通过
5. Codex 回归通过
