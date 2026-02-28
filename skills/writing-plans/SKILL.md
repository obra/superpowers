---
name: writing-plans
description: 当你有规格说明或多步骤任务的需求时，在接触代码之前使用
---

# 编写计划

## 概述

编写全面的实施计划，假设工程师对我们的代码库完全没有上下文，且审美水平存疑。记录他们需要了解的一切：每个任务需要修改哪些文件、代码、测试、可能需要查阅的文档、如何进行测试。以小步骤任务的形式给出完整计划。遵循 DRY（不要重复自己）、YAGNI（你不会需要它）、TDD（测试驱动开发）原则，频繁提交。

假设他们是熟练的开发者，但对我们的工具集或问题领域几乎一无所知。假设他们不太擅长良好的测试设计。

**开始时宣布：** "我正在使用 writing-plans 技能来创建实施计划。"

**上下文：** 应在专用的工作树中运行（由 brainstorming 技能创建）。

**计划保存至：** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 小步骤任务粒度

**每个步骤是一个操作（2-5 分钟）：**
- "编写失败的测试" - 步骤
- "运行测试确保它失败" - 步骤
- "编写最少的代码使测试通过" - 步骤
- "运行测试确保它们通过" - 步骤
- "提交" - 步骤

## 计划文档头部

**每个计划必须以此头部开始：**

```markdown
# [功能名称] 实施计划

> **致 Claude：** 必需子技能：使用 superpowers:executing-plans 逐任务实施此计划。

**目标：** [一句话描述构建的内容]

**架构：** [2-3 句关于实现方法的描述]

**技术栈：** [关键技术/库]

---
```

## 任务结构

````markdown
### 任务 N：[组件名称]

**文件：**
- 创建：`exact/path/to/file.py`
- 修改：`exact/path/to/existing.py:123-145`
- 测试：`tests/exact/path/to/test.py`

**步骤 1：编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤 2：运行测试验证它失败**

运行：`pytest tests/path/test.py::test_name -v`
预期结果：失败，提示 "function not defined"

**步骤 3：编写最少的实现代码**

```python
def function(input):
    return expected
```

**步骤 4：运行测试验证它通过**

运行：`pytest tests/path/test.py::test_name -v`
预期结果：通过

**步骤 5：提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: 添加特定功能"
```
````

## 注意事项
- 始终使用精确的文件路径
- 计划中包含完整代码（不要写"添加验证"这样的模糊描述）
- 精确的命令及预期输出
- 使用 @ 语法引用相关技能
- 遵循 DRY、YAGNI、TDD 原则，频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划已完成并保存至 `docs/plans/<filename>.md`。两种执行方式：**

**1. 子代理驱动（当前会话）** - 我为每个任务分派新的子代理，在任务之间进行审查，快速迭代

**2. 并行会话（单独进行）** - 打开新会话使用 executing-plans，批量执行并设置检查点

**选择哪种方式？"**

**如果选择子代理驱动：**
- **必需子技能：** 使用 superpowers:subagent-driven-development
- 留在当前会话
- 每个任务使用新的子代理 + 代码审查

**如果选择并行会话：**
- 引导他们在工作树中打开新会话
- **必需子技能：** 新会话使用 superpowers:executing-plans
