# 技能创作最佳实践

> 学习如何编写有效的技能，以便 Claude 能够成功发现和使用。

好的技能应该简洁、结构良好，并经过实际使用测试。本指南提供了实用的创作决策，帮助您编写 Claude 能够有效发现和使用的技能。

关于技能工作原理的概念背景，请参阅[技能概述](../../../../../../../en/docs/agents-and-tools/agent-skills/overview)。

## 核心原则

### 简洁是关键

[上下文窗口](https://platform.claude.com/docs/en/build-with-claude/context-windows)是公共资源。您的技能需要与 Claude 需要知道的所有其他内容共享上下文窗口，包括：

* 系统提示
* 对话历史
* 其他技能的元数据
* 您的实际请求

并非技能中的每个令牌都会立即产生成本。启动时，只会预加载所有技能的元数据（名称和描述）。Claude 只有在技能变得相关时才会读取 SKILL.md，并且仅在需要时读取其他文件。然而，保持 SKILL.md 的简洁仍然很重要：一旦 Claude 加载了它，每个令牌都会与对话历史和其他上下文竞争。

**默认假设**：Claude 已经非常智能

只添加 Claude 尚未掌握的上下文。挑战每一条信息：

* “Claude 真的需要这个解释吗？”
* “我可以假设 Claude 知道这个吗？”
* “这个段落是否值得其令牌成本？”

**良好示例：简洁**（约 50 个令牌）：

````markdown
## 提取 PDF 文本

使用 pdfplumber 进行文本提取：

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**不良示例：过于冗长**（约 150 个令牌）：

```markdown
## 提取 PDF 文本

PDF（便携式文档格式）文件是一种常见的文件格式，其中包含文本、图像和其他内容。要从 PDF 中提取文本，你需要使用一个库。有许多可用于 PDF 处理的库，但我们推荐 pdfplumber，因为它易于使用且能很好地处理大多数情况。首先，你需要使用 pip 安装它。然后你可以使用下面的代码...
```

简洁版本假设 Claude 知道 PDF 是什么以及库如何工作。

### 设置适当的自由度

将详细程度与任务的脆弱性和可变性相匹配。

**高自由度**（基于文本的指令）：

适用于：

* 多种方法都有效
* 决策取决于上下文
* 启发式方法指导操作

示例：

```markdown
## 代码审查流程

1. 分析代码结构与组织方式
2. 检查潜在缺陷与边界情况
3. 提出可读性与可维护性改进建议
4. 验证是否符合项目规范
```

**中等自由度**（带参数的伪代码或脚本）：

适用于：

* 存在首选模式
* 接受一定的变化
* 配置影响行为

示例：

````markdown
## 生成报告

使用此模板并根据需要自定义：

```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data
    # Generate output in specified format
    # Optionally include visualizations
```
````

**低自由度**（特定脚本，参数很少或没有）：

适用于：

* 操作脆弱且容易出错
* 一致性至关重要
* 必须遵循特定顺序

示例：

````markdown
## 数据库迁移

请严格运行以下脚本：

```bash
python scripts/migrate.py --verify --backup
```

请勿修改命令或添加额外参数。
````

**类比**：将 Claude 想象成一个探索路径的机器人：

* **两侧是悬崖的狭窄桥梁**：只有一种安全的前进方式。提供具体的防护栏和确切的指令（低自由度）。示例：必须按确切顺序运行的数据库迁移。
* **没有危险的开放田野**：许多路径都能通向成功。给出大致方向，并相信 Claude 能找到最佳路线（高自由度）。示例：代码审查，其中上下文决定了最佳方法。

### 使用计划使用的所有模型进行测试

技能作为模型的补充，因此其有效性取决于底层模型。请使用您计划使用的所有模型测试您的技能。

**按模型划分的测试注意事项**：

* **Claude Haiku**（快速、经济）：技能是否提供了足够的指导？
* **Claude Sonnet**（平衡）：技能是否清晰高效？
* **Claude Opus**（强大的推理能力）：技能是否避免了过度解释？

对 Opus 完美有效的内容可能需要对 Haiku 提供更多细节。如果您计划在多个模型中使用您的技能，请力求指令在所有模型上都能良好工作。

## 技能结构

<Note>
  **YAML Frontmatter**：SKILL.md 前置元数据支持两个字段：

* `name` - 技能的人类可读名称（最多 64 个字符）
  * `description` - 对技能功能及使用场景的单行描述（最多 1024 个字符）

有关完整技能结构详情，请参阅[技能概述](../../../../../../../en/docs/agents-and-tools/agent-skills/overview#skill-structure)。</Note>

### 命名规范

使用一致的命名模式，使技能更容易引用和讨论。我们建议在技能名称中使用**动名词形式**（动词 + -ing），因为这能清晰地描述技能提供的活动或能力。

**良好的命名示例（动名词形式）**：

* “Processing PDFs”
* “Analyzing spreadsheets”
* “Managing databases”
* “Testing code”
* “Writing documentation”

**可接受的替代方案**：

* 名词短语：“PDF Processing”、“Spreadsheet Analysis”
* 面向行动的：“Process PDFs”、“Analyze Spreadsheets”

**避免**：

* 模糊的名称：“Helper”、“Utils”、“Tools”
* 过于通用：“Documents”、“Data”、“Files”
* 在您的技能集合中使用不一致的模式

一致的命名使得：

* 在文档和对话中引用技能更容易
* 一目了然地理解技能的功能
* 组织和搜索多个技能更容易
* 保持专业、连贯的技能库

### 编写有效的描述

`description` 字段支持技能发现，应同时包含技能的功能和使用时机。

<Warning>
  **始终使用第三人称写作**。描述信息会被注入系统提示中，人称不一致可能导致发现错误。

* **良好：** “Processes Excel files and generates reports”
  * **避免：** “I can help you process Excel files”
  * **避免：** “You can use this to process Excel files” </Warning>

**具体并包含关键术语**。包含技能的功能以及何时使用它的具体触发条件/上下文。

每个技能只有一个描述字段。描述对于技能选择至关重要：Claude 使用它从可能 100 多个可用技能中选择正确的技能。您的描述必须提供足够的细节，以便 Claude 知道何时选择此技能，而 SKILL.md 的其余部分则提供实现细节。

有效示例：

**PDF 处理技能：**

```yaml theme={null}
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Excel 分析技能：**

```yaml theme={null}
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Git 提交助手技能：**

```yaml theme={null}
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

避免像这样的模糊描述：

```yaml theme={null}
description: Helps with documents
```

```yaml theme={null}
description: Processes data
```

```yaml theme={null}
description: Does stuff with files
```

### 渐进式披露模式

SKILL.md 作为一个概述，根据需要将 Claude 指向详细资料，就像入职指南中的目录一样。关于渐进式披露工作原理的解释，请参阅概述中的[技能工作原理](../../../../../../../en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

**实用指南**：

* 为获得最佳性能，保持 SKILL.md 主体在 500 行以内
* 接近此限制时，将内容拆分为单独的文件
* 使用以下模式有效地组织指令、代码和资源

#### 视觉概述：从简单到复杂

一个基本的技能开始时只有一个包含元数据和指令的 SKILL.md 文件：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=87782ff239b297d9a9e8e1b72ed72db9" alt="展示YAML前置元数据和Markdown正文的简单SKILL.md文件" data-og-width="2048" width="2048" data-og-height="1153" height="1153" data-path="images/agent-skills-simple-file.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=c61cc33b6f5855809907f7fda94cd80e 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=90d2c0c1c76b36e8d485f49e0810dbfd 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=ad17d231ac7b0bea7e5b4d58fb4aeabb 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f5d0a7a3c668435bb0aee9a3a8f8c329 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0e927c1af9de5799cfe557d12249f6e6 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=46bbb1a51dd4c8202a470ac8c80a893d 2500w" />

随着技能的增长，您可以捆绑 Claude 仅在需要时加载的额外内容：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=a5e0aa41e3d53985a7e3e43668a33ea3" alt="捆绑额外的参考文件，如reference.md和forms.md。" data-og-width="2048" width="2048" data-og-height="1327" height="1327" data-path="images/agent-skills-bundling-content.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f8a0e73783e99b4a643d79eac86b70a2 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=dc510a2a9d3f14359416b706f067904a 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=82cd6286c966303f7dd914c28170e385 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=56f3be36c77e4fe4b523df209a6824c6 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=d22b5161b2075656417d56f41a74f3dd 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=3dd4bdd6850ffcc96c6c45fcb0acd6eb 2500w" />

完整的技能目录结构可能如下所示：

```
pdf/
├── SKILL.md              # Main instructions (loaded when triggered)
├── FORMS.md              # Form-filling guide (loaded as needed)
├── reference.md          # API reference (loaded as needed)
├── examples.md           # Usage examples (loaded as needed)
└── scripts/
    ├── analyze_form.py   # Utility script (executed, not loaded)
    ├── fill_form.py      # Form filling script
    └── validate.py       # Validation script
```

#### 模式 1：带引用的高级指南

````markdown
---
name: PDF Processing
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

# PDF 处理

## 快速开始

使用 pdfplumber 提取文本：
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## 高级功能

**表单填写**：完整指南请参见 [FORMS.md](FORMS.md)
**API 参考**：所有方法请参见 [REFERENCE.md](REFERENCE.md)
**示例**：常见模式请参见 [EXAMPLES.md](EXAMPLES.md)
````

Claude 仅在需要时加载 FORMS.md、REFERENCE.md 或 EXAMPLES.md。

#### 模式 2：特定领域组织

对于具有多个领域的技能，按领域组织内容，以避免加载不相关的上下文。当用户询问销售指标时，Claude 只需要读取与销售相关的模式，而不是财务或营销数据。这可以保持令牌使用量低且上下文集中。

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

````markdown
# BigQuery 数据分析

## 可用数据集

**财务**：收入、年度经常性收入、账单 → 参见 [reference/finance.md](reference/finance.md)
**销售**：商机、销售管道、客户 → 参见 [reference/sales.md](reference/sales.md)
**产品**：API 使用情况、功能、采用率 → 参见 [reference/product.md](reference/product.md)
**营销**：营销活动、归因分析、电子邮件 → 参见 [reference/marketing.md](reference/marketing.md)

## 快速搜索

使用 grep 查找特定指标：

```bash
grep -i "revenue" reference/finance.md
grep -i "pipeline" reference/sales.md
grep -i "api usage" reference/product.md
```
````

#### 模式 3：条件性细节

显示基本内容，链接到高级内容：

```markdown
# DOCX 文档处理

## 创建文档

新建文档请使用 docx-js。详见 [DOCX-JS.md](DOCX-JS.md)。

## 编辑文档

简单编辑可直接修改 XML。

**修订追踪功能**：参见 [REDLINING.md](REDLINING.md)
**OOXML 技术细节**：参见 [OOXML.md](OOXML.md)
```

Claude 仅在用户需要这些功能时读取 REDLINING.md 或 OOXML.md。

### 避免深度嵌套引用

当从其他引用的文件引用时，Claude 可能会部分读取文件。遇到嵌套引用时，Claude 可能会使用像 `head -100` 这样的命令来预览内容，而不是读取整个文件，从而导致信息不完整。

**保持引用从 SKILL.md 开始只有一级深度**。所有引用文件都应直接从 SKILL.md 链接，以确保 Claude 在需要时读取完整的文件。

**不良示例：太深**：

```markdown
# SKILL.md
参见 [advanced.md](advanced.md)...

# advanced.md
参见 [details.md](details.md)...

# details.md
以下是实际信息...
```

**良好示例：一级深度**：

```markdown
# SKILL.md

**基本用法**： [SKILL.md 中的说明]
**高级功能**： 参见 [advanced.md](advanced.md)
**API 参考**： 参见 [reference.md](reference.md)
**示例**： 参见 [examples.md](examples.md)
```

### 使用目录结构组织较长的引用文件

对于超过 100 行的引用文件，在顶部包含一个目录。这确保即使在部分读取预览时，Claude 也能看到可用信息的完整范围。

**示例**：

```markdown
# API 参考

## 目录
- 身份验证与设置
- 核心方法（创建、读取、更新、删除）
- 高级功能（批量操作、Webhooks）
- 错误处理模式
- 代码示例

## 身份验证与设置
...

## 核心方法
...
```

然后，Claude 可以根据需要读取完整文件或跳转到特定部分。

有关这种基于文件系统的架构如何实现渐进式披露的详细信息，请参阅下面高级部分中的[运行时环境](#运行时环境)部分。

## 工作流和反馈循环

### 对复杂任务使用工作流

将复杂操作分解为清晰、连续的步骤。对于特别复杂的工作流，提供一个检查清单，Claude 可以将其复制到其响应中，并在进展过程中勾选。

**示例 1：研究综合工作流**（适用于无代码技能）：

````markdown
## 研究综合工作流程

复制此清单并追踪进度：

```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```

**步骤 1：阅读所有源文件**

审阅 `sources/` 目录中的每份文件。记录主要论点及支撑证据。

**步骤 2：识别关键主题**

寻找各来源间的模式。哪些主题反复出现？来源间在何处达成一致或存在分歧？

**步骤 3：交叉核对主张**

针对每个主要主张，核实其是否出现于源材料中。注明每个观点由哪个来源支撑。

**步骤 4：创建结构化摘要**

按主题组织发现。包含：
- 核心主张
- 来自来源的支撑证据
- 冲突观点（如有）

**步骤 5：核对引用**

检查每个主张是否引用了正确的源文件。若引用不完整，则返回步骤 3。
````

此示例展示了工作流如何应用于不需要代码的分析任务。检查清单模式适用于任何复杂的多步骤过程。

**示例 2：PDF 表单填写工作流**（适用于有代码技能）：

````markdown
## PDF 表单填写工作流程

复制此清单，并在完成各项时勾选：

```
Task Progress:
- [ ] Step 1: Analyze the form (run analyze_form.py)
- [ ] Step 2: Create field mapping (edit fields.json)
- [ ] Step 3: Validate mapping (run validate_fields.py)
- [ ] Step 4: Fill the form (run fill_form.py)
- [ ] Step 5: Verify output (run verify_output.py)
```

**步骤 1：分析表单**

运行：`python scripts/analyze_form.py input.pdf`

这将提取表单字段及其位置，并保存到 `fields.json`。

**步骤 2：创建字段映射**

编辑 `fields.json` 以添加每个字段的值。

**步骤 3：验证映射**

运行：`python scripts/validate_fields.py fields.json`

在继续之前修复任何验证错误。

**步骤 4：填写表单**

运行：`python scripts/fill_form.py input.pdf fields.json output.pdf`

**步骤 5：验证输出**

运行：`python scripts/verify_output.py output.pdf`

如果验证失败，请返回步骤 2。
````

清晰的步骤可以防止 Claude 跳过关键验证。检查清单帮助 Claude 和您跟踪多步骤工作流的进度。

### 实现反馈循环

**常见模式**：运行验证器 → 修复错误 → 重复

这种模式极大地提高了输出质量。

**示例 1：风格指南合规性**（适用于无代码技能）：

```markdown
## 内容审核流程

1. 根据 STYLE_GUIDE.md 中的指南起草内容
2. 对照检查清单进行审核：
   - 检查术语一致性
   - 验证示例是否符合标准格式
   - 确认所有必需章节均已包含
3. 若发现问题：
   - 记录每个问题并注明具体章节位置
   - 修订内容
   - 再次审核检查清单
4. 仅在所有要求均满足时继续
5. 定稿并保存文档
```

这展示了使用参考文档而非脚本的验证循环模式。“验证器”是 STYLE\_GUIDE.md，Claude 通过读取和比较来执行检查。

**示例 2：文档编辑过程**（适用于有代码技能）：

```markdown
## 文档编辑流程

1. 在 `word/document.xml` 中进行编辑
2. **立即验证**：`python ooxml/scripts/validate.py unpacked_dir/`
3. 若验证失败：
   - 仔细查看错误信息
   - 修复 XML 中的问题
   - 重新运行验证
4. **仅当验证通过后方可继续**
5. 重新构建：`python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. 测试输出文档
```

验证循环能及早发现错误。

## 内容指南

### 避免时间敏感信息

不要包含会过时的信息：

**不良示例：时间敏感**（会变得错误）：

```markdown
如果你在 2025 年 8 月之前进行此操作，请使用旧版 API。
2025 年 8 月之后，请使用新版 API。
```

**良好示例**（使用“旧模式”部分）：

```markdown
## 当前方法

使用 v2 API 端点：`api.example.com/v2/messages`

## 旧模式

<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>

v1 API 曾使用：`api.example.com/v1/messages`

该端点不再受支持。
</details>
```

旧模式部分提供了历史背景，而不会使主要内容变得杂乱。

### 使用一致的术语

选择一个术语并在整个技能中一致使用：

**良好 - 一致**：

* 始终使用“API endpoint”
* 始终使用“field”
* 始终使用“extract”

**不良 - 不一致**：

* 混合使用“API endpoint”、“URL”、“API route”、“path”
* 混合使用“field”、“box”、“element”、“control”
* 混合使用“extract”、“pull”、“get”、“retrieve”

一致性有助于 Claude 理解和遵循指令。

## 常见模式

### 模板模式

为输出格式提供模板。根据需求匹配严格程度。

**对于严格要求**（如 API 响应或数据格式）：

````markdown
## 报告结构

请始终使用以下确切的模板结构：

```markdown
# [分析标题]

## 执行摘要
[关键发现的一段概述]

## 关键发现
- 发现 1 及支持数据
- 发现 2 及支持数据
- 发现 3 及支持数据

## 建议
1. 具体的、可操作的建议
2. 具体的、可操作的建议
```
````

**对于灵活指导**（当适应有用时）：

````markdown
## 报告结构

以下是一个合理的默认格式，但请根据分析内容运用最佳判断进行调整：

```markdown
# [分析标题]

## 执行摘要
[概述]

## 主要发现
[根据发现的内容调整章节]

## 建议
[根据具体情境定制]
```

请根据具体分析类型的需要调整相应章节。
````

### 示例模式

对于输出质量取决于看到示例的技能，提供输入/输出对，就像在常规提示中一样：

````markdown
## 提交信息格式

请按照以下示例生成提交信息：

**示例 1：**
输入：Added user authentication with JWT tokens
输出：
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**示例 2：**
输入：Fixed bug where dates displayed incorrectly in reports
输出：
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

**示例 3：**
输入：Updated dependencies and refactored error handling
输出：
```
chore: update dependencies and refactor error handling

- Upgrade lodash to 4.17.21
- Standardize error response format across endpoints
```

遵循此风格：type(scope): 简要描述，然后详细说明。
````

示例比单独的描述更能帮助 Claude 理解所需的风格和详细程度。

### 条件工作流模式

指导 Claude 通过决策点：

```markdown
## 文档修改工作流程

1. 确定修改类型：

   **创建新内容？** → 遵循下方的“创建流程”
   **编辑现有内容？** → 遵循下方的“编辑流程”

2. 创建流程：
   - 使用 docx-js 库
   - 从零开始构建文档
   - 导出为 .docx 格式

3. 编辑流程：
   - 解包现有文档
   - 直接修改 XML
   - 每次更改后进行验证
   - 完成后重新打包
```

<Tip>
  如果工作流程变得庞大或复杂，包含许多步骤，请考虑将它们推送到单独的文件中，并指示Claude根据当前任务读取相应的文件。
</Tip>

## 评估与迭代

### 先构建评估

**在编写大量文档之前创建评估**。这确保您的技能解决的是真实问题，而不是记录想象中的问题。

**评估驱动开发**：

1. **识别差距**：在没有技能的情况下，让 Claude 处理代表性任务。记录具体的失败或缺失的上下文
2. **创建评估**：构建三个测试这些差距的场景
3. **建立基线**：衡量没有技能时 Claude 的表现
4. **编写最小指令**：创建刚好足够的内容来弥补差距并通过评估
5. **迭代**：执行评估，与基线比较，并完善

这种方法确保您解决的是实际问题，而不是预测可能永远不会出现的要求。

**评估结构**：

```json theme={null}
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using an appropriate PDF processing library or command-line tool",
    "Extracts text content from all pages in the document without missing any pages",
    "Saves the extracted text to a file named output.txt in a clear, readable format"
  ]
}
```

<Note>
  本示例展示了一个基于数据驱动的评估，采用简单的测试评分标准。目前我们未提供内置方式来运行这些评估。用户可以创建自己的评估系统。评估是衡量技能有效性的真实来源。
</Note>

### 通过迭代方式开发技能

最有效的技能开发过程需要Claude自身的参与。与一个Claude实例（“Claude A”）协作创建一个技能，供其他实例（“Claude B”）使用。Claude A帮助你设计和优化指令，而Claude B在真实任务中测试它们。这种方式之所以有效，是因为Claude模型既理解如何编写有效的智能体指令，也了解智能体需要哪些信息。

**创建新技能：**

1. **在没有技能的情况下完成任务**：与Claude A一起，使用常规提示方式解决一个问题。在协作过程中，你自然会提供上下文、解释偏好并分享过程性知识。留意你反复提供了哪些信息。

2. **识别可复用的模式**：完成任务后，识别你提供的、对类似未来任务有用的上下文信息。

   **示例**：如果你处理了一个BigQuery分析任务，你可能提供了表名、字段定义、过滤规则（如“始终排除测试账户”）以及常见的查询模式。

3. **请Claude A创建技能**：“创建一个技能，捕捉我们刚刚使用的这个BigQuery分析模式。包括表结构、命名约定以及关于过滤测试账户的规则。”

   <Tip>
     Claude模型天生理解技能的格式和结构。你不需要特殊的系统提示或“编写技能”的技能来让Claude帮助创建技能。只需请Claude创建一个技能，它就会生成结构正确的SKILL.md内容，包含适当的前置元数据和主体内容。
   </Tip>

4. **审查简洁性**：检查Claude A是否添加了不必要的解释。询问：“删除关于胜率含义的解释——Claude已经知道这一点。”

5. **改进信息架构**：请Claude A更有效地组织内容。例如：“重新组织一下，把表结构放在一个单独的参考文件中。我们以后可能会添加更多的表。”

6. **在类似任务上测试**：将技能与Claude B（一个加载了该技能的新实例）一起用于相关用例。观察Claude B是否能找到正确的信息、正确应用规则并成功完成任务。

7. **根据观察进行迭代**：如果Claude B遇到困难或遗漏了什么，带着具体问题回到Claude A：“当Claude使用这个技能时，它忘记为第四季度按日期过滤。我们是否应该添加一个关于日期过滤模式的部分？”

**迭代现有技能：**

改进技能时，同样的分层模式会继续。你在以下两者之间交替：

* **与Claude A协作**（帮助优化技能的专家）
* **与Claude B测试**（使用技能执行实际工作的智能体）
* **观察Claude B的行为**，并将见解带回给Claude A

1. **在真实工作流中使用技能**：给Claude B（已加载技能）分配实际任务，而不是测试场景。

2. **观察Claude B的行为**：注意它在何处遇到困难、取得成功或做出意外选择。

   **观察示例**：“当我请Claude B提供区域销售报告时，它编写了查询，但忘记了过滤掉测试账户，即使技能提到了这个规则。”

3. **回到Claude A进行改进**：分享当前的SKILL.md并描述你的观察。询问：“我注意到当我请求区域报告时，Claude B忘记了过滤测试账户。技能提到了过滤，但也许它不够突出？”

4. **审查Claude A的建议**：Claude A可能会建议重组以使规则更突出，使用更强烈的语言如“必须过滤”而不是“始终过滤”，或者重构工作流程部分。

5. **应用并测试更改**：用Claude A的改进方案更新技能，然后在类似的请求上再次用Claude B测试。

6. **根据使用情况重复**：随着遇到新的场景，继续这个观察-优化-测试的循环。每次迭代都会根据智能体的实际行为（而非假设）来改进技能。

**收集团队反馈：**

1. 与团队成员分享技能并观察他们的使用情况。
2. 询问：技能是否在预期时被激活？指令是否清晰？缺少什么？
3. 整合反馈，以解决你自己使用模式中的盲点。

**为什么这种方法有效**：Claude A理解智能体的需求，你提供领域专业知识，Claude B通过实际使用揭示差距，而迭代优化则基于观察到的行为（而非假设）来改进技能。

### 观察Claude如何使用技能

在迭代技能时，注意Claude在实践中实际如何使用它们。观察：

* **意外的探索路径**：Claude是否以你未预料到的顺序读取文件？这可能表明你的结构不如你想象的直观。
* **错过的连接**：Claude是否未能遵循对重要文件的引用？你的链接可能需要更明确或更突出。
* **过度依赖某些部分**：如果Claude反复读取同一个文件，请考虑该内容是否应该放在主SKILL.md中。
* **被忽略的内容**：如果Claude从未访问某个捆绑文件，它可能是不必要的，或者在主指令中信号传递不佳。

根据这些观察（而非假设）进行迭代。技能元数据中的`name`和`description`尤其关键。Claude在决定是否针对当前任务触发技能时会使用它们。确保它们清楚地描述了技能的作用以及何时应该使用它。

## 需要避免的反模式

### 避免使用Windows风格路径

即使在Windows上，也始终在文件路径中使用正斜杠：

* ✓ **正确**：`scripts/helper.py`，`reference/guide.md`
* ✗ **避免**：`scripts\helper.py`，`reference\guide.md`

Unix风格路径在所有平台上都有效，而Windows风格路径在Unix系统上会导致错误。

### 避免提供过多选项

除非必要，不要提供多种方法：

````markdown
**反面示例：选项过多**（令人困惑）：
“你可以使用 pypdf，或者 pdfplumber，或者 PyMuPDF，或者 pdf2image，或者……”

**正面示例：提供默认选项**（并预留替代方案）：
“使用 pdfplumber 进行文本提取：
```python
import pdfplumber
```

对于需要 OCR 的扫描版 PDF，请改用 pdf2image 配合 pytesseract。”
````

## 进阶：包含可执行代码的技能

以下部分重点介绍包含可执行脚本的技能。如果你的技能仅使用markdown指令，请跳转到[有效技能的清单](#有效技能的清单)。

### 解决问题，而非推诿

为技能编写脚本时，应处理错误条件，而不是推诿给Claude。

**良好示例：明确处理错误**：

```python theme={null}
def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        # Create file with default content instead of failing
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        # Provide alternative instead of failing
        print(f"Cannot access {path}, using default")
        return ''
```

**不良示例：推诿给Claude**：

```python theme={null}
def process_file(path):
    # Just fail and let Claude figure it out
    return open(path).read()
```

配置参数也应经过论证和记录，以避免“魔法常量”（Ousterhout定律）。如果你不知道正确的值，Claude如何确定它？

**良好示例：自文档化**：

```python theme={null}
# HTTP requests typically complete within 30 seconds
# Longer timeout accounts for slow connections
REQUEST_TIMEOUT = 30

# Three retries balances reliability vs speed
# Most intermittent failures resolve by the second retry
MAX_RETRIES = 3
```

**不良示例：魔法数字**：

```python theme={null}
TIMEOUT = 47  # Why 47?
RETRIES = 5   # Why 5?
```

### 提供实用脚本

即使Claude可以编写脚本，预先制作的脚本也有其优势：

**实用脚本的好处**：

* 比生成的代码更可靠
* 节省token（无需在上下文中包含代码）
* 节省时间（无需生成代码）
* 确保跨使用的一致性

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=4bbc45f2c2e0bee9f2f0d5da669bad00" alt="将可执行脚本与指令文件捆绑在一起" data-og-width="2048" width="2048" data-og-height="1154" height="1154" data-path="images/agent-skills-executable-scripts.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=9a04e6535a8467bfeea492e517de389f 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=e49333ad90141af17c0d7651cca7216b 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=954265a5df52223d6572b6214168c428 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=2ff7a2d8f2a83ee8af132b29f10150fd 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=48ab96245e04077f4d15e9170e081cfb 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0301a6c8b3ee879497cc5b5483177c90 2500w" />

上图展示了可执行脚本如何与指令文件协同工作。指令文件（forms.md）引用了脚本，Claude可以在不将其内容加载到上下文的情况下执行它。

**重要区别**：在你的指令中明确说明Claude应该：

* **执行脚本**（最常见）：“运行`analyze_form.py`以提取字段”
* **将其作为参考阅读**（针对复杂逻辑）：“查看`analyze_form.py`了解字段提取算法”

对于大多数实用脚本，首选执行方式，因为它更可靠和高效。有关脚本执行如何工作的详细信息，请参阅下面的[运行时环境](#运行时环境)部分。

**示例**：

````markdown
## 实用脚本

**analyze_form.py**：从 PDF 提取所有表单字段

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

输出格式：
```json
{
  "field_name": {"type": "text", "x": 100, "y": 200},
  "signature": {"type": "sig", "x": 150, "y": 500}
}
```

**validate_boxes.py**：检查是否存在重叠的边界框

```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```

**fill_form.py**：将字段值应用到 PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```
````

### 使用视觉分析

当输入可以渲染为图像时，让Claude对其进行分析：

````markdown
## 表单布局分析

1. 将PDF转换为图像：
   ```bash
   python scripts/pdf_to_images.py form.pdf
   ```

2. 分析每个页面图像以识别表单字段
3. Claude可以直观地查看字段位置和类型
````

<Note>
  在此示例中，您需要编写 `pdf_to_images.py` 脚本。
</Note>

Claude的视觉能力有助于理解布局和结构。

### 创建可验证的中间输出

当Claude执行复杂的、开放式任务时，它可能会出错。“计划-验证-执行”模式通过让Claude首先以结构化格式创建计划，然后在执行前用脚本验证该计划，从而及早发现错误。

**示例**：假设你要求Claude根据电子表格更新PDF中的50个表单字段。如果没有验证，Claude可能会引用不存在的字段、创建冲突的值、遗漏必填字段或错误地应用更新。

**解决方案**：使用上面显示的工作流模式（PDF表单填写），但添加一个中间`changes.json`文件，在应用更改前进行验证。工作流变为：分析 → **创建计划文件** → **验证计划** → 执行 → 验证。

**为什么这种模式有效：**

* **及早发现错误**：验证在应用更改前发现问题
* **机器可验证**：脚本提供客观验证
* **可逆规划**：Claude可以迭代计划，而无需触及原始文件
* **清晰的调试**：错误消息指向具体问题

**何时使用**：批量操作、破坏性更改、复杂验证规则、高风险操作。

**实现技巧**：使验证脚本详细，并提供具体的错误消息，如“未找到字段‘signature\_date’。可用字段：customer\_name, order\_total, signature\_date\_signed”，以帮助Claude修复问题。

### 打包依赖项

技能在代码执行环境中运行，存在平台特定的限制：

* **claude.ai**：可以从npm和PyPI安装包，并从GitHub仓库拉取
* **Anthropic API**：无网络访问权限，无法运行时安装包

在SKILL.md中列出所需的包，并在[代码执行工具文档](../../../../../../../en/docs/agents-and-tools/tool-use/code-execution-tool)中验证它们是否可用。

### 运行时环境

技能在具有文件系统访问权限、bash命令和代码执行能力的代码执行环境中运行。有关此架构的概念性解释，请参阅概述中的[技能架构](../../../../../../../en/docs/agents-and-tools/agent-skills/overview#the-skills-architecture)。

**这对你的创作有何影响：**

**Claude如何访问技能：**

1. **元数据预加载**：启动时，所有技能的YAML前置元数据中的名称和描述都会加载到系统提示中
2. **按需读取文件**：Claude使用bash读取工具在需要时从文件系统访问SKILL.md和其他文件
3. **高效执行脚本**：可以通过bash执行实用脚本，而无需将其全部内容加载到上下文中。只有脚本的输出会消耗token
4. **大文件无上下文惩罚**：参考文件、数据或文档在实际被读取之前不会消耗上下文token

* **文件路径很重要**：Claude像浏览文件系统一样浏览你的技能目录。使用正斜杠（`reference/guide.md`），而非反斜杠
* **描述性命名文件**：使用能指示内容的名称：`form_validation_rules.md`，而不是`doc2.md`
* **为发现而组织**：按领域或功能构建目录结构
  * 良好：`reference/finance.md`，`reference/sales.md`
  * 不良：`docs/file1.md`，`docs/file2.md`
* **捆绑全面的资源**：包含完整的API文档、大量示例、大型数据集；在被访问前无上下文惩罚
* **对于确定性操作，首选脚本**：编写`validate_form.py`，而不是要求Claude生成验证代码
* **明确执行意图**：
  * “运行`analyze_form.py`以提取字段”（执行）
  * “查看`analyze_form.py`了解提取算法”（作为参考阅读）
* **测试文件访问模式**：通过真实请求测试，验证Claude能否浏览你的目录结构

**示例：**

```
bigquery-skill/
├── SKILL.md (overview, points to reference files)
└── reference/
    ├── finance.md (revenue metrics)
    ├── sales.md (pipeline data)
    └── product.md (usage analytics)
```

当用户询问收入时，Claude 会读取 SKILL.md，看到对 `reference/finance.md` 的引用，并调用 bash 来读取该文件。sales.md 和 product.md 文件仍保留在文件系统中，在需要之前消耗零上下文令牌。这种基于文件系统的模型实现了渐进式披露。Claude 可以导航并选择性地加载每个任务所需的确切内容。

有关技术架构的完整详细信息，请参阅技能概述中的[技能如何工作](../../../../../../../en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

### MCP 工具引用

如果你的技能使用 MCP（模型上下文协议）工具，请始终使用完全限定的工具名称，以避免出现“找不到工具”的错误。

**格式**：`ServerName:tool_name`

**示例**：

```markdown
使用 BigQuery:bigquery_schema 工具来检索表结构。
使用 GitHub:create_issue 工具来创建问题。
```

其中：

* `BigQuery` 和 `GitHub` 是 MCP 服务器名称
* `bigquery_schema` 和 `create_issue` 是这些服务器内的工具名称

如果没有服务器前缀，Claude 可能无法定位到该工具，尤其是在有多个 MCP 服务器可用时。

### 避免假设工具已安装

不要假设软件包可用：

````markdown
**错误示例：假设已安装**：
"使用 pdf 库处理文件。"

**正确示例：明确说明依赖项**：
"安装所需包：`pip install pypdf`

然后使用：
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```"
````

## 技术说明

### YAML 前置元数据要求

SKILL.md 的前置元数据仅包含 `name`（最长 64 个字符）和 `description`（最长 1024 个字符）字段。有关完整结构详情，请参阅[技能概述](../../../../../../../en/docs/agents-and-tools/agent-skills/overview#skill-structure)。

### 令牌预算

为了获得最佳性能，请将 SKILL.md 正文控制在 500 行以内。如果你的内容超过此限制，请使用前面描述的渐进式披露模式将其拆分为单独的文件。有关架构详情，请参阅[技能概述](../../../../../../../en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

## 有效技能的清单

在分享技能之前，请验证：

### 核心质量

* \[ ] 描述具体并包含关键术语
* \[ ] 描述包含技能的作用以及何时使用它
* \[ ] SKILL.md 正文在 500 行以内
* \[ ] 附加细节在单独的文件中（如果需要）
* \[ ] 没有时间敏感信息（或在“旧模式”部分中）
* \[ ] 术语在整个文档中保持一致
* \[ ] 示例具体，而非抽象
* \[ ] 文件引用仅深一层
* \[ ] 适当使用渐进式披露
* \[ ] 工作流程步骤清晰

### 代码和脚本

* \[ ] 脚本解决问题，而非推给 Claude
* \[ ] 错误处理明确且有帮助
* \[ ] 没有“魔法常量”（所有值都有合理解释）
* \[ ] 所需软件包在说明中列出并验证为可用
* \[ ] 脚本有清晰的文档
* \[ ] 没有 Windows 风格的路径（全部使用正斜杠）
* \[ ] 对关键操作有验证/确认步骤
* \[ ] 包含对质量关键任务的反馈循环

### 测试

* \[ ] 至少创建了三个评估
* \[ ] 使用 Haiku、Sonnet 和 Opus 进行测试
* \[ ] 使用真实使用场景进行测试
* \[ ] 已纳入团队反馈（如果适用）

## 后续步骤

<CardGroup cols={2}>
  <Card title="开始使用代理技能" icon="rocket" href="/en/docs/agents-and-tools/agent-skills/quickstart">
    创建您的第一个技能
  </Card>

  <Card title="在Claude Code中使用技能" icon="terminal" href="/en/docs/claude-code/skills">
    在Claude Code中创建和管理技能
  </Card>

  <Card title="使用 API 技能" icon="code" href="/en/api/skills-guide">
    以编程方式上传和使用技能
  </Card>
</CardGroup>
