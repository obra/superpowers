# Memory 重命名实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 fork 中这套以 `progress` 命名的项目记录框架一次性重命名为 `memory`，并移除旧的正式命名与 canonical 路径。

**Architecture:** 严格按 spec 的顺序执行：先改公开定义层，再改物理结构和模板，最后做全仓验证。正则只用于发现候选命中；每个命中点都必须逐条人工复核并记录结论，拿捏不准时请求用户复核。

**Tech Stack:** Markdown 文档、Superpowers skill 文档、shell 验证命令（`rg`, `test`, `git diff --check`）

**Spec:** `docs/superpowers/specs/2026-03-21-memory-rename-design.md`

**Existing verification targets:** `README.md`、`skills/progress-bootstrap/SKILL.md`、`skills/progress-tracker/SKILL.md`、`skills/progress-bootstrap/template/*.md`、`skills/progress-tracker/template/*.md`

---

## File Map

- **Modify:** `README.md` — 更新 skill 名、canonical path、索引文件名与公开术语
- **Modify then Rename:** `skills/progress-bootstrap/SKILL.md` -> `skills/memory-bootstrap/SKILL.md`
- **Modify then Rename:** `skills/progress-tracker/SKILL.md` -> `skills/memory-tracker/SKILL.md`
- **Rename Directory:** `skills/progress-bootstrap/` -> `skills/memory-bootstrap/`
- **Rename Directory:** `skills/progress-tracker/` -> `skills/memory-tracker/`
- **Rename/Modify:** `skills/memory-bootstrap/template/milestone-progress-template.md` -> `skills/memory-bootstrap/template/milestone-memory-template.md`
- **Rename/Modify:** `skills/memory-bootstrap/template/debug-progress-template.md` -> `skills/memory-bootstrap/template/debug-memory-template.md`
- **Rename/Modify:** `skills/memory-bootstrap/template/refactor-progress-template.md` -> `skills/memory-bootstrap/template/refactor-memory-template.md`
- **Rename/Modify:** `skills/memory-bootstrap/template/category-progress-template.md` -> `skills/memory-bootstrap/template/category-memory-template.md`
- **Modify:** `skills/memory-tracker/template/entry-template.md`
- **Inspect:** `skills/memory-tracker/template/toc-table-template.md`
- **Create:** `docs/superpowers/memory/milestone/MEMORY.md`
- **Create:** `docs/superpowers/memory/debug/MEMORY.md`
- **Create:** `docs/superpowers/memory/refactor/MEMORY.md`
- **Create:** `docs/superpowers/memory/milestone/entries/2026-03/.gitkeep`
- **Create:** `docs/superpowers/memory/debug/entries/2026-03/.gitkeep`
- **Create:** `docs/superpowers/memory/refactor/entries/2026-03/.gitkeep`
- **Potential Modify:** 任何通过 repo 级正则扫描发现、且经人工复核确认属于“公开框架文档”的 tracked 文件
- **Potential Modify:** 指向旧 skill 路径 `skills/progress-bootstrap/`、`skills/progress-tracker/` 的仓库链接、catalog 引用或公开说明文档

---

## Chunk 1: 公开定义层先行切换

### Task 1: 先更新 README 与两份 skill 文档中的正式命名

**Files:**
- Modify: `README.md`
- Modify: `skills/progress-bootstrap/SKILL.md`
- Modify: `skills/progress-tracker/SKILL.md`

- [ ] **Step 1: 运行 repo 级候选扫描，建立公开文档候选清单**

Run:

```bash
rg -n "progress-bootstrap|progress-tracker|skills/progress-bootstrap/|skills/progress-tracker/|docs/superpowers/progress/|\bPROGRESS\.md\b|progress entry|progress record|progress category|project progress memory" .
```

Expected: 命中当前旧正式命名，形成候选点集合。

- [ ] **Step 2: 对 Step 1 的每个命中点逐条复核，并记录其是否属于公开框架文档**

复核输出必须留痕：

```text
[path] -> 候选公开文档 / 非公开文档
[path:line] -> 修改 / 保留 / 请求用户复核
```

判定标准：

```text
1. 是否在向用户或 agent 解释如何发现、调用、存储或理解这套框架
2. 是否属于正式 skill 名、canonical path、索引文件名或正式术语
3. 无法稳定判断时，请求用户复核
```

- [ ] **Step 3: 先只修改公开定义层，不改目录名与模板文件名**

本步应完成：

```text
README.md:
- progress-bootstrap -> memory-bootstrap
- progress-tracker -> memory-tracker
- docs/superpowers/progress/ -> docs/superpowers/memory/
- PROGRESS.md -> MEMORY.md
- project progress memory -> project memory

skills/progress-bootstrap/SKILL.md:
- name/description/heading 改为 memory-bootstrap
- canonical root 改为 docs/superpowers/memory/
- PROGRESS.md 改为 MEMORY.md
- 文案明确不再承认 docs/superpowers/progress/ 为 canonical root

skills/progress-tracker/SKILL.md:
- name/description/heading 改为 memory-tracker
- canonical root 改为 docs/superpowers/memory/
- PROGRESS.md 改为 MEMORY.md
- progress entry / record / category 改为 memory entry / record / category
- 文案明确不再承认 docs/superpowers/progress/ 为 canonical root
```

- [ ] **Step 4: 运行公开定义层校验，确认 README 与两份 skill 文档已切换到新术语**

Run:

```bash
rg -n "progress-bootstrap|progress-tracker|docs/superpowers/progress/|\bPROGRESS\.md\b|project progress memory|progress entry|progress record|progress category" README.md skills/progress-bootstrap/SKILL.md skills/progress-tracker/SKILL.md
```

Expected: 不再命中这三份文件中的旧正式命名。

- [ ] **Step 5: 人工复核 canonical-root 语义**

复核要求：

```text
- 只承认 docs/superpowers/memory/ 为 canonical root
- 不再把 docs/superpowers/progress/ 当作受支持路径
- 遇到旧 progress 结构时，应要求 bootstrap 或显式迁移，而不是做 fallback
```

- [ ] **Step 6: 提交本任务改动**

```bash
git add README.md skills/progress-bootstrap/SKILL.md skills/progress-tracker/SKILL.md
git commit -m "docs: rename progress framework terminology to memory"
```

---

## Chunk 2: 物理结构与 canonical 路径切换

### Task 2: 重命名 skill 目录，并落地 canonical memory 根路径与索引文件

**Files:**
- Rename: `skills/progress-bootstrap/` -> `skills/memory-bootstrap/`
- Rename: `skills/progress-tracker/` -> `skills/memory-tracker/`
- Create: `docs/superpowers/memory/milestone/MEMORY.md`
- Create: `docs/superpowers/memory/debug/MEMORY.md`
- Create: `docs/superpowers/memory/refactor/MEMORY.md`
- Rename/Modify: `skills/memory-bootstrap/template/milestone-progress-template.md` -> `skills/memory-bootstrap/template/milestone-memory-template.md`
- Rename/Modify: `skills/memory-bootstrap/template/debug-progress-template.md` -> `skills/memory-bootstrap/template/debug-memory-template.md`
- Rename/Modify: `skills/memory-bootstrap/template/refactor-progress-template.md` -> `skills/memory-bootstrap/template/refactor-memory-template.md`
- Rename/Modify: `skills/memory-bootstrap/template/category-progress-template.md` -> `skills/memory-bootstrap/template/category-memory-template.md`

- [ ] **Step 1: 运行目录与模板候选检查**

Run:

```bash
rg -n "progress-bootstrap|progress-tracker|milestone-progress-template|debug-progress-template|refactor-progress-template|category-progress-template" skills
```

Expected: 命中旧目录与旧模板文件名引用。

- [ ] **Step 2: 对 Step 1 的每个命中点逐条记录处理结论**

复核输出：

```text
[path:line] -> 修改 / 保留 / 请求用户复核
```

- [ ] **Step 3: 重命名 skill 目录和模板文件名，并同步更新目录内引用**

需要完成的结果：

```text
skills/progress-bootstrap/ -> skills/memory-bootstrap/
skills/progress-tracker/ -> skills/memory-tracker/
若 docs/superpowers/progress/ 已存在，则将其内容迁移/重命名到 docs/superpowers/memory/，并移除旧根路径
若 docs/superpowers/progress/ 不存在，则直接创建 docs/superpowers/memory/<category>/MEMORY.md
docs/superpowers/memory/<category>/MEMORY.md 创建完成
*-progress-template.md -> *-memory-template.md
目录内对旧模板文件名的引用同步改为新名字
```

- [ ] **Step 4: 复核模板正文，只做术语切换，不改变分类规则和 TOC 结构**

复核重点：

```text
- milestone / debug / refactor 分类不变
- Admission Rule 语义不变
- 只把 progress 术语与 PROGRESS.md 文件名切到 memory / MEMORY.md
```

- [ ] **Step 5: 运行定向校验，确认旧目录与旧模板文件名已清理**

Run:

```bash
rg -n "progress-bootstrap|progress-tracker|milestone-progress-template|debug-progress-template|refactor-progress-template|category-progress-template" skills/memory-bootstrap skills/memory-tracker README.md
```

Expected: 不再命中旧目录或旧模板文件名。

- [ ] **Step 6: 运行文件系统校验**

Run:

```bash
test ! -d skills/progress-bootstrap && test ! -d skills/progress-tracker && test -d skills/memory-bootstrap && test -d skills/memory-tracker && test -d docs/superpowers/memory && test -f docs/superpowers/memory/milestone/MEMORY.md && test -f docs/superpowers/memory/debug/MEMORY.md && test -f docs/superpowers/memory/refactor/MEMORY.md && test ! -e skills/memory-bootstrap/template/milestone-progress-template.md && test ! -e skills/memory-bootstrap/template/debug-progress-template.md && test ! -e skills/memory-bootstrap/template/refactor-progress-template.md && test ! -e skills/memory-bootstrap/template/category-progress-template.md
```

Expected: 命令成功退出。

- [ ] **Step 7: 提交本任务改动**

```bash
git add skills/memory-bootstrap skills/memory-tracker docs/superpowers/memory
git commit -m "refactor(skills): rename progress paths to memory"
```

---

## Chunk 3: 模板正文与月份桶收尾

### Task 3: 完成模板正文迁移、tracker 模板语义更新与当前月份桶创建

**Files:**
- Create: `docs/superpowers/memory/milestone/entries/2026-03/.gitkeep`
- Create: `docs/superpowers/memory/debug/entries/2026-03/.gitkeep`
- Create: `docs/superpowers/memory/refactor/entries/2026-03/.gitkeep`
- Modify: `skills/memory-bootstrap/template/milestone-memory-template.md`
- Modify: `skills/memory-bootstrap/template/debug-memory-template.md`
- Modify: `skills/memory-bootstrap/template/refactor-memory-template.md`
- Modify: `skills/memory-bootstrap/template/category-memory-template.md`
- Modify: `skills/memory-tracker/template/entry-template.md`
- Inspect if needed: `skills/memory-tracker/template/toc-table-template.md`

- [ ] **Step 1: 确认 canonical memory 索引文件已经在上一任务落地**

Run:

```bash
test -f docs/superpowers/memory/milestone/MEMORY.md && test -f docs/superpowers/memory/debug/MEMORY.md && test -f docs/superpowers/memory/refactor/MEMORY.md
```

Expected: 命令成功退出。

- [ ] **Step 2: 完成 bootstrap 模板正文迁移，并创建三个分类的 `entries/2026-03/.gitkeep`**

创建目标：

```text
docs/superpowers/memory/<category>/entries/2026-03/.gitkeep
```

- [ ] **Step 3: 更新 tracker 的 entry 模板与 TOC 相关检查**

本步应完成：

```text
entry-template.md:
- progress entry / record / category -> memory entry / record / category

若 toc-table-template.md 仅为表格骨架且无旧术语，可保持不变；
若有命中，逐条复核后再改。
```

对 `toc-table-template.md` 的命中也必须记录：

```text
[path:line] -> 修改 / 保留 / 请求用户复核
```

- [ ] **Step 4: 运行 canonical structure 校验**

Run:

```bash
test -d docs/superpowers/memory && test -f docs/superpowers/memory/milestone/MEMORY.md && test -f docs/superpowers/memory/debug/MEMORY.md && test -f docs/superpowers/memory/refactor/MEMORY.md && test -f docs/superpowers/memory/milestone/entries/2026-03/.gitkeep && test -f docs/superpowers/memory/debug/entries/2026-03/.gitkeep && test -f docs/superpowers/memory/refactor/entries/2026-03/.gitkeep
```

Expected: 命令成功退出。

- [ ] **Step 5: 运行 tracker 模板语义校验**

Run:

```bash
rg -n "docs/superpowers/(progress|memory)/|\bPROGRESS\.md\b|progress entry|progress record|progress category" skills/memory-tracker && rg -n "MEMORY\.md" skills/memory-tracker
```

Expected: 第一条搜索只允许命中 `docs/superpowers/memory/`，不允许命中旧 root、`PROGRESS.md` 或旧术语；第二条搜索应命中 `MEMORY.md` 引用。若结果不符合预期，逐条复核后修正。

- [ ] **Step 6: 提交本任务改动**

```bash
git add docs/superpowers/memory skills/memory-bootstrap/template skills/memory-tracker/template/entry-template.md skills/memory-tracker/template/toc-table-template.md
git commit -m "feat(docs): add canonical memory structure"
```

---

## Chunk 4: 全仓验收与边界复核

### Task 4: 对全仓做 regex + 文件系统验收，并记录每个命中点的处理结论

**Files:**
- Inspect: `README.md`
- Inspect: `skills/memory-bootstrap/SKILL.md`
- Inspect: `skills/memory-tracker/SKILL.md`
- Inspect: `skills/memory-bootstrap/template/*.md`
- Inspect: `skills/memory-tracker/template/*.md`
- Inspect/Modify if needed: 任意经复核确认属于公开框架文档的 tracked 文件

- [ ] **Step 1: 运行第一轮框架残留检查（repo 级）**

Run:

```bash
rg -n "\bprogress-bootstrap\b|\bprogress-tracker\b|docs/superpowers/progress/|\bPROGRESS\.md\b|progress entry|progress record|progress category|project progress memory" .
```

Expected: 可能命中历史设计说明或计划文本；当前框架公开表面不应再命中旧正式命名。

- [ ] **Step 2: 运行第二轮混合命名检查（repo 级）**

Run:

```bash
rg -n "memory-progress|progress-memory|docs/superpowers/memory/.+PROGRESS\.md" .
```

Expected: 当前公开框架表面不命中新旧混合命名；若 `spec`、`plan` 或验收留痕文档因记录校验规则而命中，应逐条复核后作为历史引用保留。

- [ ] **Step 3: 对 Step 1 和 Step 2 的每一个命中点逐条记录处理结论**

复核输出必须留痕：

```text
[path:line] -> 修改 / 保留 / 请求用户复核
```

判定原则：

```text
- 历史设计/计划文档中讨论旧命名，可保留
- 当前框架公开表面的旧命名，必须改
- 无法稳定判断的边界命中，请求用户复核
```

- [ ] **Step 4: 运行最终文件系统校验**

Run:

```bash
test ! -d skills/progress-bootstrap && test ! -d skills/progress-tracker && test -d skills/memory-bootstrap && test -d skills/memory-tracker && test ! -e docs/superpowers/progress && test -d docs/superpowers/memory && test -f docs/superpowers/memory/milestone/MEMORY.md && test -f docs/superpowers/memory/debug/MEMORY.md && test -f docs/superpowers/memory/refactor/MEMORY.md && test ! -e docs/superpowers/memory/milestone/PROGRESS.md && test ! -e docs/superpowers/memory/debug/PROGRESS.md && test ! -e docs/superpowers/memory/refactor/PROGRESS.md && test -f skills/memory-bootstrap/template/milestone-memory-template.md && test -f skills/memory-bootstrap/template/debug-memory-template.md && test -f skills/memory-bootstrap/template/refactor-memory-template.md && test -f skills/memory-bootstrap/template/category-memory-template.md
```

Expected: 命令成功退出。

- [ ] **Step 5: 运行 patch 安全检查**

Run:

```bash
git diff --check
```

Expected: 无 trailing whitespace、无冲突标记、无 patch 格式问题。

- [ ] **Step 6: 如本任务在验收中产生了额外修正，只提交这些收尾修正；若没有新增改动则跳过 commit**

```bash
git add [仅本轮验收修正涉及的文件]
git commit -m "chore: finalize memory rename validation fixes"
```
