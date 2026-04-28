# 第 2 轮：文档审查与测试体系 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-04-28

## 目标

将 Horspowers 当前的 `brainstorming -> writing-plans` 文档驱动链路补成更严格的 review 闭环：设计文档写完后有明确的 spec reviewer 参考模板与审查门，计划文档写完后有 plan reviewer 模板与审查门，并补齐 Claude/Codex 侧的验证。

## 架构方案

本轮不直接照搬上游的 chunked plan / checkbox 语法，而是在现有本地化 `docs/plans` 体系上做最小增量适配。`brainstorming` 保持“先文档、再用户确认、再进入计划”的主线，但将 spec self-review 升级为可复用的 reviewer 模板驱动检查；`writing-plans` 则新增本地化 plan reviewer prompt，并在 execution handoff 前增加计划审查环节。测试上，Claude 侧增加真实 reviewer 行为验证，Codex 侧增加技能语义兼容验证。

## 技术栈

Markdown skill 文档、reviewer prompt 模板、Bash 测试脚本、Claude Code skill 测试、Codex 兼容测试、git 上游参考比对

---

### Task 1: 强化 brainstorming 的 spec review 闭环

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/brainstorming/spec-document-reviewer-prompt.md`

**Step 1: 对比当前 spec reviewer 模板与本地 skill 语义**

检查 `skills/brainstorming/spec-document-reviewer-prompt.md` 与 `skills/brainstorming/SKILL.md` 的对应关系，确认以下三点是否一致：
- reviewer 针对的是 `docs/plans/` 下的设计文档，而不是 upstream 的 `docs/superpowers/specs/`
- reviewer 只拦会影响后续 planning 的问题，不放大到措辞洁癖
- spec self-review / user review gate / writing-plans 交接的顺序没有冲突

Run:

```bash
sed -n '1,240p' skills/brainstorming/spec-document-reviewer-prompt.md
sed -n '140,240p' skills/brainstorming/SKILL.md
```

Expected:
- 能明确找出当前 wording 与本地流程的缺口

**Step 2: 最小化更新 spec reviewer prompt 模板**

修改 `skills/brainstorming/spec-document-reviewer-prompt.md`，要求它：
- 明确审查对象是写入 `docs/plans/` 的设计文档
- 补上对“延后定义”“占位符”“实现前会导致误解的歧义”的关注
- 保持输出格式稳定，便于 Claude/Codex 复用

**Step 3: 强化 brainstorming 中的 spec review gate**

修改 `skills/brainstorming/SKILL.md` 中 “Spec Self-Review / User Review Gate” 段落，要求：
- 写完设计文档后，先用 `spec-document-reviewer-prompt.md` 的检查标准做 structured self-review
- 若宿主支持子代理，可按该模板派发 reviewer；若不支持，则本地按同一标准自检
- 只有 reviewer 问题修正后，才进入用户 review gate

目标表达应保持本地双客户端中立，不把单一宿主工具写死。

**Step 4: 进行文本级自检**

检查 `brainstorming` 是否仍满足：
- 先设计、再文档、再 review、再 writing-plans
- 没有把实现动作提前到 brainstorming
- 没有引入 visual companion / server 范围

Run:

```bash
rg -n "Spec Self-Review|User Review Gate|writing-plans|subagent|reviewer" skills/brainstorming/SKILL.md
```

Expected:
- 新的 review gate 文案存在，且顺序正确

**Step 5: 提交本任务**

```bash
git add skills/brainstorming/SKILL.md \
        skills/brainstorming/spec-document-reviewer-prompt.md
git commit -m "feat: strengthen brainstorming spec review gate"
```

### Task 2: 为 writing-plans 增加 plan reviewer 闭环

**Files:**
- Create: `skills/writing-plans/plan-document-reviewer-prompt.md`
- Modify: `skills/writing-plans/SKILL.md`

**Step 1: 创建本地化 plan reviewer prompt 模板**

新增 `skills/writing-plans/plan-document-reviewer-prompt.md`，要求：
- 审查完整计划文档，而不是强行引入 upstream 的 chunk 模型
- 同时接收 plan 路径与 spec/design 路径作为参考
- 重点检查 placeholders、spec 覆盖缺口、任务不可执行点、作用域漂移

参考输出格式：

```markdown
## Plan Review

**Status:** Approved | Issues Found

**Issues (if any):**
- [Task X, Step Y]: [具体问题] - [为什么会阻塞实现]

**Recommendations (advisory, do not block approval):**
- [改进建议]
```

**Step 2: 在 writing-plans skill 中接入 plan review gate**

修改 `skills/writing-plans/SKILL.md`，在 `Execution Handoff` 之前新增 plan review 环节：
- 计划写完后，对照 spec/design 进行 structured self-review
- 若宿主支持子代理，可按 `plan-document-reviewer-prompt.md` 派发 reviewer
- 如果 reviewer 提出会阻塞实现的问题，先修计划，再进入 execution handoff

注意保持现有本地文档体系、中文模板与执行方式选择，不引入本轮未计划的 checkbox/chunk 语法迁移。

**Step 3: 文本级核对本地适配边界**

确认 `writing-plans` 没有出现以下越界：
- 引入 upstream `docs/superpowers/plans` 路径
- 引入 chunk-by-chunk review 流程
- 引入新的执行模式，替代现有 `subagent-driven-development / executing-plans`

Run:

```bash
rg -n "plan review|Execution Handoff|docs/superpowers|Chunk|checkbox|subagent-driven" skills/writing-plans/SKILL.md skills/writing-plans/plan-document-reviewer-prompt.md
```

Expected:
- 有 plan review gate，但没有不必要的 upstream 语法迁移

**Step 4: 提交本任务**

```bash
git add skills/writing-plans/SKILL.md \
        skills/writing-plans/plan-document-reviewer-prompt.md
git commit -m "feat: add writing-plans document review loop"
```

### Task 3: 增加 Claude 文档审查行为测试

**Files:**
- Create: `tests/claude-code/test-document-review-system.sh`
- Modify: `tests/claude-code/README.md`
- Modify: `tests/claude-code/TEST-RUNNERS.md`

**Step 1: 基于上游测试创建本地版本**

创建 `tests/claude-code/test-document-review-system.sh`，但适配到本地语义：
- 测试 spec reviewer 能识别设计文档中的 TODO、延后定义、关键歧义
- 测试 plan reviewer 能识别计划文档中的 placeholder、缺少验证步骤或与 spec 不对齐的问题
- 明确读取当前工作区内的 reviewer prompt 文件，而不是依赖已安装旧副本

**Step 2: 先跑 red/green 验证**

Run:

```bash
bash -n tests/claude-code/test-document-review-system.sh
bash tests/claude-code/test-document-review-system.sh
```

Expected:
- 语法通过
- live Claude 能根据当前分支 prompt 文件给出合理 reviewer 结果

若失败，先区分是 CLI 超时/宿主波动，还是断言/提示词本身问题。

**Step 3: 更新测试说明文档**

更新：
- `tests/claude-code/README.md`
- `tests/claude-code/TEST-RUNNERS.md`

至少说明：
- 这是文档审查系统的 targeted/integration test
- 它验证的是 reviewer 语义，不是完整实现流程
- 推荐运行时机：修改 `brainstorming` / `writing-plans` reviewer 相关文件之后

**Step 4: 提交本任务**

```bash
git add tests/claude-code/test-document-review-system.sh \
        tests/claude-code/README.md \
        tests/claude-code/TEST-RUNNERS.md
git commit -m "test: add document review system coverage"
```

### Task 4: 增加 Codex 文档审查兼容测试

**Files:**
- Create: `tests/codex/test-document-review-flow.sh`
- Modify: `tests/codex/run-tests.sh`
- Reference: `skills/using-horspowers/references/codex-tools.md`

**Step 1: 设计 Codex 侧的最小行为探针**

新增 `tests/codex/test-document-review-flow.sh`，通过 `codex exec` 验证：
- Codex 能从 `brainstorming` 中读出“设计文档后有 spec review gate”
- Codex 能从 `writing-plans` 中读出“执行前有 plan review gate”
- 回答不会退回到旧的“只做 inline self-review、无 reviewer prompt”语义

**Step 2: 将新测试纳入 Codex runner**

更新 `tests/codex/run-tests.sh`，保持现有 smoke 风格，把新测试作为新增段落运行。

**Step 3: 运行定向验证**

Run:

```bash
bash tests/codex/test-document-review-flow.sh
```

Expected:
- 在 `codex` CLI 可用时通过
- 不可用时给出一致的 skip 行为

**Step 4: 提交本任务**

```bash
git add tests/codex/test-document-review-flow.sh \
        tests/codex/run-tests.sh
git commit -m "test: cover codex document review flow"
```

### Task 5: 跑回归并完成 round 2 收口

**Files:**
- Review: `skills/brainstorming/*`
- Review: `skills/writing-plans/*`
- Review: `tests/claude-code/*`
- Review: `tests/codex/*`

**Step 1: 跑定向 Claude 测试**

Run:

```bash
bash tests/claude-code/test-document-review-system.sh
```

Expected:
- 文档 reviewer 相关断言通过

**Step 2: 跑 Claude full 套件**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --suite full
```

Expected:
- `STATUS: PASSED`

如遇明确的 Claude CLI 瞬时错误，可先重试一次；只有稳定复现时才按代码问题处理。

**Step 3: 跑 Codex 回归**

Run:

```bash
bash tests/codex/run-tests.sh
```

Expected:
- Codex 兼容测试保持通过

**Step 4: 进行人工范围复核**

确认没有混入以下范围外内容：
- visual companion / brainstorm server
- plan checkbox/chunk 体系大迁移
- 新客户端支持

**Step 5: 提交收尾**

```bash
git status --short
git log --oneline -5
```

Expected:
- 仅包含本轮 document review / testing 相关变更
