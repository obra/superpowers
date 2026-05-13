# Contributing to facio-superpowers (Fork Hygiene)

`@vattention/facio-superpowers` 是 [obra/superpowers](https://github.com/obra/superpowers) 的 fork。本文档规定 fork 改动的红线，**所有贡献者必须遵守**。

## 红线 1：不修改 upstream 文件

**永远不修改** 来自 upstream 的 `skills/*/SKILL.md`、`hooks/*`、`templates/*`（注：`templates/` 中 `docs-reference-decisions-readme.md` / `docs-reference-guidelines-readme.md` / `docs-reference-pitfalls-readme.md` / `docs-reference-catalog-stub.md` / `rebuild-catalog.sh` / `github-workflows-catalog-sync.yml` / `github-workflows-spec-sync.yml` 是 fork 新增、非 upstream 文件，可改）。

理由：

1. upstream 持续演进；本地改动与 merge 冲突
2. team-specific 行为塞入 upstream 文件 → 与其它 fork 工作流绑死
3. 历史教训：`writing-plans/SKILL.md` 被改过（commit c926d4e），后续多次 upstream merge 都要手工保留 fork 改动 → 4 次 revert/reapply

## 红线 2：扩展用 wrapper pattern

需要扩展某 upstream skill 行为时：

- **新建 wrapper skill** 在 `skills/<wrapper-name>/SKILL.md`，内部 invoke upstream skill
- **不要**在 upstream skill 末尾 / 中间插逻辑

范例：
- `spec-author` wraps `brainstorming`（意图模糊时 invoke）
- `expert-reviewer` wraps `requesting-code-review`

## 红线 3：chain 用 HARD-GATE，不改 upstream

需要在某 upstream skill 完成后强制 chain：

- 在 **Flow Skill**（facio-flow repo）或其它新 wrapper skill 内用 `<HARD-GATE>` 块覆盖
- **不要**改 upstream skill 的末尾 hint

## 审计

CI（M1 起）会跑：

```bash
for s in skills/*/SKILL.md; do
  git diff upstream/main -- "$s" || true
done
```

PR 触动 upstream 路径 + diff 非零 → auto-label `fork-warning`，至少 1 个 fork owner approve 才能 merge。

## Upstream 同步

```bash
git fetch upstream
git merge upstream/main
# 若冲突，遵循"upstream 永远胜"原则；fork 行为放到 wrapper / Flow Skill
```

## 例外登记

如确有不可避免的 upstream 改动（如修 critical bug），登记在本表（PR 同步更新）：

| 文件 | 行数 | 原因 | 上游 PR / Issue | 移除计划 |
|------|------|------|----------------|---------|
| _（空）_ | | | | |
