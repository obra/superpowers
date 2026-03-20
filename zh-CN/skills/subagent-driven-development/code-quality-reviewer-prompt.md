# 代码质量审查员提示模板

在分派代码质量审查员子代理时使用此模板。

**目的：** 验证实现是否构建良好（整洁、经过测试、可维护）

**仅在规范合规性审查通过后分派。**

```
Task tool (superpowers:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**除了标准的代码质量问题外，审查员还应检查：**

* 每个文件是否具有一个明确的职责和定义良好的接口？
* 单元是否被分解，以便能够独立理解和测试？
* 实现是否遵循计划中的文件结构？
* 此实现是否创建了已经很大的新文件，或显著增大了现有文件？（不要标记预先存在的文件大小——重点关注本次变更带来的影响。）

**代码审查员返回：** 优点、问题（严重/重要/轻微）、评估
