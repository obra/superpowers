---
description: 分析项目文档目录结构并生成迁移建议
disable-model-invocation: true
---

# 文档目录分析

使用 horspowers:document-management 技能来分析项目的文档结构。

此命令将：
1. 检测所有文档目录（docs/, doc/, .docs/, .doc/, documentation/）
2. 统计每个目录的文件数量
3. 分类文档类型（designs, plans, tasks, bugs, decisions）
4. 生成迁移计划以合并到 docs/

示例输出：
```
检测到以下文档目录：

docs/
├── plans/          12 个文件（designs, plans）
└── (empty)

.docs/
├── active/         5 个文件（tasks, bugs）
└── context/        2 个文件（contexts）

建议迁移：
- .docs/active/* → docs/active/
- .docs/context/* → docs/context/

运行 /docs-migrate 开始迁移
```
