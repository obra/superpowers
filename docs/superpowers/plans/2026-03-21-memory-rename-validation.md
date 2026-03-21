# Memory 重命名 Task 4 验收记录

## 目的

本记录用于沉淀 `docs/superpowers/plans/2026-03-21-memory-rename.md` 中 Task 4 的 repo 级验收证据，补齐校验命令、结果摘要，以及 Step 1 / Step 2 每个命中点的人工复核结论。

## 本次执行的校验命令

### 1. Repo 级旧正式命名残留检查

```bash
rg -n "\bprogress-bootstrap\b|\bprogress-tracker\b|docs/superpowers/progress/|\bPROGRESS\.md\b|progress entry|progress record|progress category|project progress memory" .
```

### 2. Repo 级混合命名检查

```bash
rg -n "memory-progress|progress-memory|docs/superpowers/memory/.+PROGRESS\.md" .
```

### 3. 文件系统结构校验

```bash
test ! -d skills/progress-bootstrap && test ! -d skills/progress-tracker && test -d skills/memory-bootstrap && test -d skills/memory-tracker && test ! -e docs/superpowers/progress && test -d docs/superpowers/memory && test -f docs/superpowers/memory/milestone/MEMORY.md && test -f docs/superpowers/memory/debug/MEMORY.md && test -f docs/superpowers/memory/refactor/MEMORY.md && test ! -e docs/superpowers/memory/milestone/PROGRESS.md && test ! -e docs/superpowers/memory/debug/PROGRESS.md && test ! -e docs/superpowers/memory/refactor/PROGRESS.md && test -f skills/memory-bootstrap/template/milestone-memory-template.md && test -f skills/memory-bootstrap/template/debug-memory-template.md && test -f skills/memory-bootstrap/template/refactor-memory-template.md && test -f skills/memory-bootstrap/template/category-memory-template.md
```

### 4. Patch 安全检查

```bash
git diff --check
```

## 校验结果摘要

- Task 4 的 Step 1 初检命中当前框架公开表面的旧正式命名残留 5 处：`README.md:117`、`skills/memory-bootstrap/SKILL.md:40`、`skills/memory-bootstrap/SKILL.md:41`、`skills/memory-tracker/SKILL.md:56`、`skills/memory-tracker/SKILL.md:104`。
- `README.md:144` 与 `README.md:145` 的旧命名替换发生在更早的 Task 1，不属于 Task 4 初检阶段新增发现的问题，因此不计入这里的 5 处统计。
- 上述 5 处已改为不再直接暴露旧 `progress` 正式命名，但仍保留“旧布局不受支持、需迁移到 `docs/superpowers/memory/`”这一当前语义。
- Step 1 在写入本验收记录前复检时，仅剩 `docs/superpowers/specs/2026-03-21-memory-rename-design.md` 与 `docs/superpowers/plans/2026-03-21-memory-rename.md` 的历史讨论命中；写入本记录后，repo 级搜索还会命中当前文件中的命令示例与结果摘要，这些同样属于验收留痕。
- Step 2 全程未命中当前框架公开表面的混合命名残留；命中仅来自 `spec/plan` 与本验收记录中对校验 regex、反例与结果的历史记录。
- 文件系统结构校验成功：旧 skill 目录不存在，新 skill 目录存在，`docs/superpowers/progress` 不存在，`docs/superpowers/memory/{milestone,debug,refactor}/MEMORY.md` 存在，`docs/superpowers/memory/{milestone,debug,refactor}/PROGRESS.md` 不存在，`skills/memory-bootstrap/template/` 下四个 memory 模板文件存在。
- `git diff --check` 无输出，当前补充文档未引入 trailing whitespace、冲突标记或 patch 格式问题。

## 为什么 spec/plan/validation log 中的旧命名命中被保留

- 这些命中位于 `docs/superpowers/specs/2026-03-21-memory-rename-design.md`、`docs/superpowers/plans/2026-03-21-memory-rename.md` 与当前验收记录中，用途是讨论这次重命名的目标、迁移边界、验证规则、验收标准与验收证据。
- 这些文本属于历史设计与实施留痕，不是当前框架的运行时契约、对外公开入口、技能名、目录名或索引文件名的现行声明。
- 如果删除这些历史引用，会损失本次 rename 的设计上下文、验收依据以及对“为何需要迁移”的可追溯性。
- 因此，这些命中按 Task 4 判定原则保留为历史引用，而不视为当前框架公开表面的残留问题。

## Step 1 逐命中人工复核记录

### 已修改的当前框架公开表面命中

- `[README.md:117] -> 修改`：从直接提及旧路径正式命名，改为 `legacy pre-memory layout` 泛化表述。
- `[skills/memory-bootstrap/SKILL.md:40] -> 修改`：不再直接写旧根路径正式命名，改为“older pre-memory layouts”。
- `[skills/memory-bootstrap/SKILL.md:41] -> 修改`：不再直接写旧结构正式命名，保留“需迁移到 `docs/superpowers/memory/`”语义。
- `[skills/memory-tracker/SKILL.md:56] -> 修改`：不再直接写旧结构正式命名，改为 pre-memory 结构表述。
- `[skills/memory-tracker/SKILL.md:104] -> 修改`：不再直接写旧根路径正式命名，改为“older pre-memory layouts”。

### 保留的 spec 历史引用

- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:7] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:8] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:9] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:40] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:41] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:50] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:59] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:60] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:64] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:65] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:84] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:85] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:116] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:117] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:118] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:119] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:121] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:132] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:133] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:160] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:188] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:190] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:214] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:223] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:225] -> 保留`
- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:235] -> 保留`

### 保留的 plan 历史引用

- `[docs/superpowers/plans/2026-03-21-memory-rename.md:13] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:20] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:21] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:22] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:23] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:37] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:47] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:48] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:55] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:83] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:84] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:85] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:86] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:87] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:89] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:92] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:93] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:95] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:98] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:99] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:100] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:108] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:119] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:126] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:137] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:138] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:152] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:170] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:171] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:172] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:173] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:186] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:194] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:204] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:257] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:284] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:287] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:315] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:351] -> 保留`

### 保留的 validation log 历史引用

- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:12] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:24] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:40] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:161] -> 保留`

## Step 2 逐命中人工复核记录

### 保留的 spec 历史引用

- `[docs/superpowers/specs/2026-03-21-memory-rename-design.md:196] -> 保留`

### 保留的 plan 历史引用

- `[docs/superpowers/plans/2026-03-21-memory-rename.md:287] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:325] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename.md:351] -> 保留`

### 保留的 validation log 历史引用

- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:18] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:24] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:40] -> 保留`
- `[docs/superpowers/plans/2026-03-21-memory-rename-validation.md:161] -> 保留`

## 最终结论

- 当前框架公开表面已无旧 `progress` 正式命名残留。
- 当前仓库中剩余命中仅存在于本次 rename 的 `spec`、`plan` 与当前 validation log 历史文档中，属于设计、实施与验收留痕，可保留。
- 当前仓库不存在 `memory-progress`、`progress-memory` 或 `docs/superpowers/memory/.../PROGRESS.md` 这类新旧混合命名残留。
- 当前文件系统结构与 memory 命名约束一致。
