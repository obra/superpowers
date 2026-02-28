# 技能编写最佳实践

> 了解如何编写有效的技能，使 Claude 能够发现并成功使用它们。

好的技能应当简洁、结构良好，并经过实际使用测试。本指南提供实用的编写决策，帮助你编写 Claude 能够发现并有效使用的技能。

有关技能工作原理的概念背景，请参阅[技能概述](/en/docs/agents-and-tools/agent-skills/overview)。

## 核心原则

### 简洁是关键

[上下文窗口](https://platform.claude.com/docs/en/build-with-claude/context-windows)是一种公共资源。你的技能与 Claude 需要了解的所有其他内容共享上下文窗口，包括：

* 系统提示
* 对话历史
* 其他技能的元数据
* 你的实际请求

并非技能中的每个 token 都有即时成本。启动时，仅预加载所有技能的元数据（名称和描述）。Claude 仅在技能变得相关时才读取 SKILL.md，并且仅在需要时才读取其他文件。然而，SKILL.md 中的简洁性仍然很重要：一旦 Claude 加载了它，每个 token 都会与对话历史和其他上下文竞争。

**默认假设**：Claude 已经非常智能

只添加 Claude 尚未具备的上下文。对每条信息提出质疑：

* "Claude 真的需要这个解释吗？"
* "我能假设 Claude 知道这个吗？"
* "这段内容值得占用 token 吗？"

**好的示例：简洁**（大约 50 个 token）：

````markdown  theme={null}
## Extract PDF text

Use pdfplumber for text extraction:

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**反面示例：过于冗长**（大约 150 个 token）：

```markdown  theme={null}
## Extract PDF text

PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available for PDF processing, but we
recommend pdfplumber because it's easy to use and handles most cases well.
First, you'll need to install it using pip. Then you can use the code below...
```

简洁版本假设 Claude 知道什么是 PDF 以及库是如何工作的。

### 设定适当的自由度

将具体程度与任务的脆弱性和可变性相匹配。

**高自由度**（基于文本的指令）：

适用场景：

* 多种方法都是有效的
* 决策取决于上下文
* 启发式方法指导处理方式

示例：

```markdown  theme={null}
## Code review process

1. Analyze the code structure and organization
2. Check for potential bugs or edge cases
3. Suggest improvements for readability and maintainability
4. Verify adherence to project conventions
```

**中等自由度**（伪代码或带参数的脚本）：

适用场景：

* 存在首选模式
* 允许一些变化
* 配置影响行为

示例：

````markdown  theme={null}
## Generate report

Use this template and customize as needed:

```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data
    # Generate output in specified format
    # Optionally include visualizations
```
````

**低自由度**（特定脚本，很少或没有参数）：

适用场景：

* 操作脆弱且容易出错
* 一致性至关重要
* 必须遵循特定顺序

示例：

````markdown  theme={null}
## Database migration

Run exactly this script:

```bash
python scripts/migrate.py --verify --backup
```

Do not modify the command or add additional flags.
````

**类比**：将 Claude 想象成一个探索路径的机器人：

* **两侧是悬崖的窄桥**：只有一条安全的前进路径。提供具体的护栏和精确的指令（低自由度）。示例：必须按精确顺序运行的数据库迁移。
* **没有障碍的开阔地**：多条路径都能到达成功。给出大致方向，信任 Claude 找到最佳路线（高自由度）。示例：由上下文决定最佳方法的代码审查。

### 使用你计划使用的所有模型进行测试

技能是对模型的补充，因此效果取决于底层模型。使用你计划配合使用的所有模型来测试你的技能。

**按模型进行的测试考虑**：

* **Claude Haiku**（快速、经济）：技能是否提供了足够的指导？
* **Claude Sonnet**（平衡）：技能是否清晰且高效？
* **Claude Opus**（强大的推理能力）：技能是否避免了过度解释？

对 Opus 完美适用的内容可能需要为 Haiku 提供更多细节。如果你计划在多个模型中使用你的技能，请以在所有模型中都能良好工作的指令为目标。

## 技能结构

<Note>
  **YAML 前置元数据**：SKILL.md 的前置元数据支持两个字段：

  * `name` - 技能的可读名称（最多 64 个字符）
  * `description` - 技能功能及使用时机的单行描述（最多 1024 个字符）

  有关完整的技能结构详情，请参阅[技能概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure)。
</Note>

### 命名规范

使用一致的命名模式，使技能更容易引用和讨论。我们建议使用**动名词形式**（动词 + -ing）作为技能名称，因为这能清楚地描述技能提供的活动或能力。

**好的命名示例（动名词形式）**：

* "Processing PDFs"
* "Analyzing spreadsheets"
* "Managing databases"
* "Testing code"
* "Writing documentation"

**可接受的替代方案**：

* 名词短语："PDF Processing"、"Spreadsheet Analysis"
* 面向操作："Process PDFs"、"Analyze Spreadsheets"

**避免**：

* 模糊的名称："Helper"、"Utils"、"Tools"
* 过于笼统："Documents"、"Data"、"Files"
* 技能集合内命名模式不一致

一致的命名使以下方面变得更容易：

* 在文档和对话中引用技能
* 一眼了解技能的功能
* 组织和搜索多个技能
* 维护专业、连贯的技能库

### 编写有效的描述

`description` 字段用于启用技能发现，应同时包含技能的功能和使用时机。

<Warning>
  **始终使用第三人称**。描述会被注入系统提示，不一致的人称视角会导致发现问题。

  * **好的：** "Processes Excel files and generates reports"
  * **避免：** "I can help you process Excel files"
  * **避免：** "You can use this to process Excel files"
</Warning>

**具体并包含关键术语**。同时包含技能的功能和使用时的具体触发条件/上下文。

每个技能只有一个描述字段。描述对于技能选择至关重要：Claude 使用它从可能 100 多个可用技能中选择正确的技能。你的描述必须提供足够的细节，让 Claude 知道何时选择此技能，而 SKILL.md 的其余部分则提供实现细节。

有效示例：

**PDF 处理技能：**

```yaml  theme={null}
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Excel 分析技能：**

```yaml  theme={null}
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Git 提交助手技能：**

```yaml  theme={null}
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

避免如下模糊的描述：

```yaml  theme={null}
description: Helps with documents
```

```yaml  theme={null}
description: Processes data
```

```yaml  theme={null}
description: Does stuff with files
```

### 渐进式披露模式

SKILL.md 作为概述，根据需要将 Claude 指向详细资料，就像入职指南中的目录一样。有关渐进式披露工作原理的解释，请参阅概述中的[技能工作原理](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

**实用指导：**

* 将 SKILL.md 正文保持在 500 行以内以获得最佳性能
* 当接近此限制时将内容拆分到单独的文件中
* 使用以下模式有效地组织指令、代码和资源

#### 可视化概览：从简单到复杂

一个基本的技能从仅包含元数据和指令的 SKILL.md 文件开始：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=87782ff239b297d9a9e8e1b72ed72db9" alt="Simple SKILL.md file showing YAML frontmatter and markdown body" data-og-width="2048" width="2048" data-og-height="1153" height="1153" data-path="images/agent-skills-simple-file.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=c61cc33b6f5855809907f7fda94cd80e 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=90d2c0c1c76b36e8d485f49e0810dbfd 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=ad17d231ac7b0bea7e5b4d58fb4aeabb 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f5d0a7a3c668435bb0aee9a3a8f8c329 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0e927c1af9de5799cfe557d12249f6e6 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=46bbb1a51dd4c8202a470ac8c80a893d 2500w" />

随着你的技能增长，你可以捆绑 Claude 仅在需要时才加载的附加内容：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=a5e0aa41e3d53985a7e3e43668a33ea3" alt="Bundling additional reference files like reference.md and forms.md." data-og-width="2048" width="2048" data-og-height="1327" height="1327" data-path="images/agent-skills-bundling-content.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f8a0e73783e99b4a643d79eac86b70a2 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=dc510a2a9d3f14359416b706f067904a 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=82cd6286c966303f7dd914c28170e385 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=56f3be36c77e4fe4b523df209a6824c6 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=d22b5161b2075656417d56f41a74f3dd 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=3dd4bdd6850ffcc96c6c45fcb0acd6eb 2500w" />

完整的技能目录结构可能如下所示：

```
pdf/
├── SKILL.md              # 主要指令（触发时加载）
├── FORMS.md              # 表单填写指南（按需加载）
├── reference.md          # API 参考（按需加载）
├── examples.md           # 使用示例（按需加载）
└── scripts/
    ├── analyze_form.py   # 实用脚本（执行，不加载）
    ├── fill_form.py      # 表单填写脚本
    └── validate.py       # 验证脚本
```

#### 模式 1：带引用的高层指南

````markdown  theme={null}
---
name: PDF Processing
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

# PDF Processing

## Quick start

Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Advanced features

**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
**Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
````

Claude 仅在需要时加载 FORMS.md、REFERENCE.md 或 EXAMPLES.md。

#### 模式 2：特定领域的组织

对于具有多个领域的技能，按领域组织内容以避免加载无关的上下文。当用户询问销售指标时，Claude 只需要读取与销售相关的架构，而不需要财务或营销数据。这使 token 使用量保持在较低水平，上下文保持专注。

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

````markdown SKILL.md theme={null}
# BigQuery Data Analysis

## Available datasets

**Finance**: Revenue, ARR, billing → See [reference/finance.md](reference/finance.md)
**Sales**: Opportunities, pipeline, accounts → See [reference/sales.md](reference/sales.md)
**Product**: API usage, features, adoption → See [reference/product.md](reference/product.md)
**Marketing**: Campaigns, attribution, email → See [reference/marketing.md](reference/marketing.md)

## Quick search

Find specific metrics using grep:

```bash
grep -i "revenue" reference/finance.md
grep -i "pipeline" reference/sales.md
grep -i "api usage" reference/product.md
```
````

#### 模式 3：条件性细节

展示基础内容，链接到高级内容：

```markdown  theme={null}
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

Claude 仅在用户需要这些功能时才读取 REDLINING.md 或 OOXML.md。

### 避免深层嵌套引用

当文件从其他被引用的文件中被引用时，Claude 可能会部分读取这些文件。遇到嵌套引用时，Claude 可能会使用 `head -100` 等命令来预览内容，而不是读取完整文件，这会导致信息不完整。

**保持引用从 SKILL.md 起只有一层深度**。所有参考文件应直接从 SKILL.md 链接，以确保 Claude 在需要时能读取完整文件。

**反面示例：层次过深**：

```markdown  theme={null}
# SKILL.md
See [advanced.md](advanced.md)...

# advanced.md
See [details.md](details.md)...

# details.md
Here's the actual information...
```

**好的示例：一层深度**：

```markdown  theme={null}
# SKILL.md

**Basic usage**: [instructions in SKILL.md]
**Advanced features**: See [advanced.md](advanced.md)
**API reference**: See [reference.md](reference.md)
**Examples**: See [examples.md](examples.md)
```

### 为较长的参考文件添加目录结构

对于超过 100 行的参考文件，在顶部包含目录。这确保了即使 Claude 进行部分读取预览时也能看到可用信息的完整范围。

**示例**：

```markdown  theme={null}
# API Reference

## Contents
- Authentication and setup
- Core methods (create, read, update, delete)
- Advanced features (batch operations, webhooks)
- Error handling patterns
- Code examples

## Authentication and setup
...

## Core methods
...
```

Claude 可以读取完整文件或根据需要跳转到特定部分。

有关此基于文件系统的架构如何实现渐进式披露的详细信息，请参阅下方高级部分中的[运行时环境](#runtime-environment)章节。

## 工作流和反馈循环

### 为复杂任务使用工作流

将复杂操作分解为清晰的顺序步骤。对于特别复杂的工作流，提供一个清单，Claude 可以将其复制到响应中并在完成时逐项打勾。

**示例 1：研究综合工作流**（适用于无代码的技能）：

````markdown  theme={null}
## Research synthesis workflow

Copy this checklist and track your progress:

```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```

**Step 1: Read all source documents**

Review each document in the `sources/` directory. Note the main arguments and supporting evidence.

**Step 2: Identify key themes**

Look for patterns across sources. What themes appear repeatedly? Where do sources agree or disagree?

**Step 3: Cross-reference claims**

For each major claim, verify it appears in the source material. Note which source supports each point.

**Step 4: Create structured summary**

Organize findings by theme. Include:
- Main claim
- Supporting evidence from sources
- Conflicting viewpoints (if any)

**Step 5: Verify citations**

Check that every claim references the correct source document. If citations are incomplete, return to Step 3.
````

此示例展示了工作流如何应用于不需要代码的分析任务。清单模式适用于任何复杂的多步骤流程。

**示例 2：PDF 表单填写工作流**（适用于有代码的技能）：

````markdown  theme={null}
## PDF form filling workflow

Copy this checklist and check off items as you complete them:

```
Task Progress:
- [ ] Step 1: Analyze the form (run analyze_form.py)
- [ ] Step 2: Create field mapping (edit fields.json)
- [ ] Step 3: Validate mapping (run validate_fields.py)
- [ ] Step 4: Fill the form (run fill_form.py)
- [ ] Step 5: Verify output (run verify_output.py)
```

**Step 1: Analyze the form**

Run: `python scripts/analyze_form.py input.pdf`

This extracts form fields and their locations, saving to `fields.json`.

**Step 2: Create field mapping**

Edit `fields.json` to add values for each field.

**Step 3: Validate mapping**

Run: `python scripts/validate_fields.py fields.json`

Fix any validation errors before continuing.

**Step 4: Fill the form**

Run: `python scripts/fill_form.py input.pdf fields.json output.pdf`

**Step 5: Verify output**

Run: `python scripts/verify_output.py output.pdf`

If verification fails, return to Step 2.
````

清晰的步骤可以防止 Claude 跳过关键验证。清单帮助 Claude 和你跟踪多步骤工作流的进度。

### 实现反馈循环

**常见模式**：运行验证器 → 修复错误 → 重复

这种模式能大幅提高输出质量。

**示例 1：风格指南合规性**（适用于无代码的技能）：

```markdown  theme={null}
## Content review process

1. Draft your content following the guidelines in STYLE_GUIDE.md
2. Review against the checklist:
   - Check terminology consistency
   - Verify examples follow the standard format
   - Confirm all required sections are present
3. If issues found:
   - Note each issue with specific section reference
   - Revise the content
   - Review the checklist again
4. Only proceed when all requirements are met
5. Finalize and save the document
```

这展示了使用参考文档而非脚本的验证循环模式。"验证器"是 STYLE\_GUIDE.md，Claude 通过读取和比较来执行检查。

**示例 2：文档编辑流程**（适用于有代码的技能）：

```markdown  theme={null}
## Document editing process

1. Make your edits to `word/document.xml`
2. **Validate immediately**: `python ooxml/scripts/validate.py unpacked_dir/`
3. If validation fails:
   - Review the error message carefully
   - Fix the issues in the XML
   - Run validation again
4. **Only proceed when validation passes**
5. Rebuild: `python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. Test the output document
```

验证循环能够及早发现错误。

## 内容指南

### 避免时效性信息

不要包含会过时的信息：

**反面示例：时效性信息**（会变得不正确）：

```markdown  theme={null}
If you're doing this before August 2025, use the old API.
After August 2025, use the new API.
```

**好的示例**（使用"旧模式"部分）：

```markdown  theme={null}
## Current method

Use the v2 API endpoint: `api.example.com/v2/messages`

## Old patterns

<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>

The v1 API used: `api.example.com/v1/messages`

This endpoint is no longer supported.
</details>
```

旧模式部分提供历史上下文，而不会使主要内容变得杂乱。

### 使用一致的术语

选择一个术语并在整个技能中一致使用：

**好的 - 一致**：

* 始终使用 "API endpoint"
* 始终使用 "field"
* 始终使用 "extract"

**差的 - 不一致**：

* 混用 "API endpoint"、"URL"、"API route"、"path"
* 混用 "field"、"box"、"element"、"control"
* 混用 "extract"、"pull"、"get"、"retrieve"

一致性帮助 Claude 理解和遵循指令。

## 常见模式

### 模板模式

提供输出格式的模板。将严格程度与你的需求相匹配。

**对于严格要求**（如 API 响应或数据格式）：

````markdown  theme={null}
## Report structure

ALWAYS use this exact template structure:

```markdown
# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```
````

**对于灵活指导**（当需要适应性时）：

````markdown  theme={null}
## Report structure

Here is a sensible default format, but use your best judgment based on the analysis:

```markdown
# [Analysis Title]

## Executive summary
[Overview]

## Key findings
[Adapt sections based on what you discover]

## Recommendations
[Tailor to the specific context]
```

Adjust sections as needed for the specific analysis type.
````

### 示例模式

对于输出质量取决于查看示例的技能，像常规提示一样提供输入/输出对：

````markdown  theme={null}
## Commit message format

Generate commit messages following these examples:

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly in reports
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

**Example 3:**
Input: Updated dependencies and refactored error handling
Output:
```
chore: update dependencies and refactor error handling

- Upgrade lodash to 4.17.21
- Standardize error response format across endpoints
```

Follow this style: type(scope): brief description, then detailed explanation.
````

示例帮助 Claude 比单纯的描述更清晰地理解所需的风格和详细程度。

### 条件工作流模式

引导 Claude 通过决策点：

```markdown  theme={null}
## Document modification workflow

1. Determine the modification type:

   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow:
   - Use docx-js library
   - Build document from scratch
   - Export to .docx format

3. Editing workflow:
   - Unpack existing document
   - Modify XML directly
   - Validate after each change
   - Repack when complete
```

<Tip>
  如果工作流变得庞大或步骤繁多，考虑将它们推送到单独的文件中，并告诉 Claude 根据当前任务读取适当的文件。
</Tip>

## 评估和迭代

### 先建立评估

**在编写大量文档之前先创建评估。**这确保你的技能解决的是真实问题，而不是记录想象中的问题。

**评估驱动的开发：**

1. **识别差距**：在没有技能的情况下对代表性任务运行 Claude。记录具体的失败或缺失的上下文
2. **创建评估**：建立三个测试这些差距的场景
3. **建立基线**：衡量没有技能时 Claude 的表现
4. **编写最少的指令**：创建刚好足够的内容来解决差距并通过评估
5. **迭代**：执行评估，与基线比较，并改进

这种方法确保你正在解决实际问题，而不是预测可能永远不会出现的需求。

**评估结构**：

```json  theme={null}
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
  此示例展示了带有简单测试评分标准的数据驱动评估。我们目前不提供运行这些评估的内置方式。用户可以创建自己的评估系统。评估是衡量技能有效性的真实来源。
</Note>

### 与 Claude 迭代开发技能

最有效的技能开发流程涉及 Claude 自身。与一个 Claude 实例（"Claude A"）合作创建技能，该技能将被其他实例（"Claude B"）使用。Claude A 帮助你设计和改进指令，而 Claude B 在真实任务中测试它们。这之所以有效，是因为 Claude 模型既理解如何编写有效的智能体指令，也理解智能体需要什么信息。

**创建新技能：**

1. **在没有技能的情况下完成任务**：使用普通提示与 Claude A 一起解决问题。在工作过程中，你会自然地提供上下文、解释偏好并分享程序知识。注意你反复提供的信息。

2. **识别可重用的模式**：完成任务后，确定你提供的哪些上下文对类似的未来任务有用。

   **示例**：如果你完成了一个 BigQuery 分析，你可能提供了表名、字段定义、过滤规则（如"始终排除测试账户"）和常见查询模式。

3. **让 Claude A 创建技能**："创建一个技能来捕获我们刚才使用的 BigQuery 分析模式。包括表架构、命名约定和关于过滤测试账户的规则。"

   <Tip>
     Claude 模型天然理解技能格式和结构。你不需要特殊的系统提示或"编写技能"的技能来让 Claude 帮助创建技能。只需让 Claude 创建技能，它就会生成结构正确的 SKILL.md 内容，包含适当的前置元数据和正文内容。
   </Tip>

4. **审查简洁性**：检查 Claude A 是否添加了不必要的解释。问："删除关于胜率含义的解释——Claude 已经知道了。"

5. **改进信息架构**：让 Claude A 更有效地组织内容。例如："组织这些内容，使表架构在单独的参考文件中。我们以后可能会添加更多表。"

6. **在类似任务上测试**：在相关用例上使用 Claude B（加载了技能的新实例）的技能。观察 Claude B 是否找到了正确的信息，是否正确应用了规则，以及是否成功处理了任务。

7. **根据观察迭代**：如果 Claude B 遇到困难或遗漏了什么，带着具体信息回到 Claude A："当 Claude 使用这个技能时，它忘记了按 Q4 日期过滤。我们是否应该添加一个关于日期过滤模式的部分？"

**迭代现有技能：**

改进技能时，同样的层次模式继续进行。你在以下之间交替：

* **与 Claude A 合作**（帮助改进技能的专家）
* **使用 Claude B 测试**（使用技能执行实际工作的智能体）
* **观察 Claude B 的行为**并将洞察带回 Claude A

1. **在真实工作流中使用技能**：给 Claude B（加载了技能的）实际任务，而不是测试场景

2. **观察 Claude B 的行为**：注意它在哪里遇到困难、成功或做出意外选择

   **观察示例**："当我要求 Claude B 提供区域销售报告时，它编写了查询但忘记过滤测试账户，尽管技能中提到了这条规则。"

3. **回到 Claude A 进行改进**：分享当前的 SKILL.md 并描述你观察到的情况。问："我注意到 Claude B 在我要求区域报告时忘记过滤测试账户。技能中提到了过滤，但也许它不够突出？"

4. **审查 Claude A 的建议**：Claude A 可能建议重新组织以使规则更突出，使用更强的措辞如 "MUST filter" 而不是 "always filter"，或重构工作流部分。

5. **应用并测试更改**：使用 Claude A 的改进更新技能，然后在类似请求上再次使用 Claude B 测试

6. **根据使用情况重复**：在遇到新场景时继续此观察-改进-测试循环。每次迭代都基于真实的智能体行为而非假设来改进技能。

**收集团队反馈：**

1. 与队友分享技能并观察他们的使用情况
2. 问：技能是否在预期时激活？指令是否清晰？缺少什么？
3. 结合反馈以解决你自己使用模式中的盲点

**为什么这种方法有效**：Claude A 理解智能体需求，你提供领域专业知识，Claude B 通过真实使用揭示差距，迭代改进基于观察到的行为而非假设来提升技能。

### 观察 Claude 如何导航技能

在迭代技能时，关注 Claude 在实践中如何实际使用它们。注意以下情况：

* **意外的探索路径**：Claude 是否以你未预料的顺序读取文件？这可能表明你的结构不如你想象的那样直观
* **遗漏的连接**：Claude 是否未能跟随对重要文件的引用？你的链接可能需要更明确或更突出
* **过度依赖某些部分**：如果 Claude 反复读取同一文件，考虑该内容是否应放在主 SKILL.md 中
* **被忽略的内容**：如果 Claude 从未访问捆绑文件，它可能是不必要的或在主要指令中信号不明确

根据这些观察而非假设进行迭代。技能元数据中的 'name' 和 'description' 尤为关键。Claude 在决定是否响应当前任务触发技能时会使用这些信息。确保它们清楚地描述技能的功能和使用时机。

## 应避免的反模式

### 避免 Windows 风格路径

始终在文件路径中使用正斜杠，即使在 Windows 上也是如此：

* ✓ **好的**：`scripts/helper.py`、`reference/guide.md`
* ✗ **避免**：`scripts\helper.py`、`reference\guide.md`

Unix 风格路径在所有平台上都有效，而 Windows 风格路径在 Unix 系统上会导致错误。

### 避免提供过多选项

除非必要，不要呈现多种方法：

````markdown  theme={null}
**Bad example: Too many choices** (confusing):
"You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or..."

**Good example: Provide a default** (with escape hatch):
"Use pdfplumber for text extraction:
```python
import pdfplumber
```

For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."
````

## 高级：包含可执行代码的技能

以下部分重点介绍包含可执行脚本的技能。如果你的技能仅使用 markdown 指令，请跳至[有效技能清单](#checklist-for-effective-skills)。

### 解决问题，不要推卸

编写技能脚本时，应处理错误条件而不是推给 Claude。

**好的示例：显式处理错误**：

```python  theme={null}
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

**反面示例：推给 Claude**：

```python  theme={null}
def process_file(path):
    # Just fail and let Claude figure it out
    return open(path).read()
```

配置参数也应当合理解释和记录，以避免"巫术常量"（Ousterhout 定律）。如果你不知道正确的值，Claude 又怎么能确定呢？

**好的示例：自文档化**：

```python  theme={null}
# HTTP requests typically complete within 30 seconds
# Longer timeout accounts for slow connections
REQUEST_TIMEOUT = 30

# Three retries balances reliability vs speed
# Most intermittent failures resolve by the second retry
MAX_RETRIES = 3
```

**反面示例：魔术数字**：

```python  theme={null}
TIMEOUT = 47  # Why 47?
RETRIES = 5   # Why 5?
```

### 提供实用脚本

即使 Claude 可以编写脚本，预制脚本也有其优势：

**实用脚本的好处**：

* 比生成的代码更可靠
* 节省 token（无需在上下文中包含代码）
* 节省时间（无需代码生成）
* 确保跨使用的一致性

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=4bbc45f2c2e0bee9f2f0d5da669bad00" alt="Bundling executable scripts alongside instruction files" data-og-width="2048" width="2048" data-og-height="1154" height="1154" data-path="images/agent-skills-executable-scripts.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=9a04e6535a8467bfeea492e517de389f 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=e49333ad90141af17c0d7651cca7216b 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=954265a5df52223d6572b6214168c428 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=2ff7a2d8f2a83ee8af132b29f10150fd 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=48ab96245e04077f4d15e9170e081cfb 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0301a6c8b3ee879497cc5b5483177c90 2500w" />

上图展示了可执行脚本如何与指令文件协同工作。指令文件（forms.md）引用脚本，Claude 可以在不将其内容加载到上下文中的情况下执行它。

**重要区分**：在指令中明确 Claude 应该：

* **执行脚本**（最常见）："运行 `analyze_form.py` 来提取字段"
* **作为参考阅读**（用于复杂逻辑）："参见 `analyze_form.py` 了解字段提取算法"

对于大多数实用脚本，执行是首选，因为它更可靠和高效。有关脚本执行工作原理的详细信息，请参阅下方的[运行时环境](#runtime-environment)部分。

**示例**：

````markdown  theme={null}
## Utility scripts

**analyze_form.py**: Extract all form fields from PDF

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

Output format:
```json
{
  "field_name": {"type": "text", "x": 100, "y": 200},
  "signature": {"type": "sig", "x": 150, "y": 500}
}
```

**validate_boxes.py**: Check for overlapping bounding boxes

```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```

**fill_form.py**: Apply field values to PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```
````

### 使用视觉分析

当输入可以渲染为图像时，让 Claude 进行分析：

````markdown  theme={null}
## Form layout analysis

1. Convert PDF to images:
   ```bash
   python scripts/pdf_to_images.py form.pdf
   ```

2. Analyze each page image to identify form fields
3. Claude can see field locations and types visually
````

<Note>
  在此示例中，你需要编写 `pdf_to_images.py` 脚本。
</Note>

Claude 的视觉能力有助于理解布局和结构。

### 创建可验证的中间输出

当 Claude 执行复杂的开放式任务时，可能会犯错。"计划-验证-执行"模式通过让 Claude 首先以结构化格式创建计划，然后在执行前用脚本验证该计划来及早发现错误。

**示例**：想象一下让 Claude 根据电子表格更新 PDF 中的 50 个表单字段。如果没有验证，Claude 可能引用不存在的字段、创建冲突的值、遗漏必填字段或错误地应用更新。

**解决方案**：使用上面展示的工作流模式（PDF 表单填写），但添加一个中间的 `changes.json` 文件，在应用更改之前进行验证。工作流变为：分析 → **创建计划文件** → **验证计划** → 执行 → 验证。

**为什么这种模式有效：**

* **及早发现错误**：验证在更改应用之前发现问题
* **机器可验证**：脚本提供客观验证
* **可逆计划**：Claude 可以在不触及原件的情况下迭代计划
* **清晰的调试**：错误消息指向具体问题

**何时使用**：批量操作、破坏性更改、复杂验证规则、高风险操作。

**实现提示**：使验证脚本输出详细的错误消息，如 "Field 'signature\_date' not found. Available fields: customer\_name, order\_total, signature\_date\_signed"，以帮助 Claude 修复问题。

### 包依赖

技能在代码执行环境中运行，具有特定于平台的限制：

* **claude.ai**：可以从 npm 和 PyPI 安装包，并从 GitHub 仓库拉取
* **Anthropic API**：没有网络访问权限，也没有运行时包安装功能

在 SKILL.md 中列出所需的包，并在[代码执行工具文档](/en/docs/agents-and-tools/tool-use/code-execution-tool)中验证它们是否可用。

### 运行时环境

技能在具有文件系统访问、bash 命令和代码执行能力的代码执行环境中运行。有关此架构的概念解释，请参阅概述中的[技能架构](/en/docs/agents-and-tools/agent-skills/overview#the-skills-architecture)。

**这如何影响你的编写：**

**Claude 如何访问技能：**

1. **元数据预加载**：启动时，所有技能 YAML 前置元数据中的名称和描述被加载到系统提示中
2. **按需读取文件**：Claude 使用 bash Read 工具在需要时从文件系统访问 SKILL.md 和其他文件
3. **高效执行脚本**：实用脚本可以通过 bash 执行，而无需将其完整内容加载到上下文中。只有脚本的输出消耗 token
4. **大文件无上下文惩罚**：参考文件、数据或文档在实际读取之前不消耗上下文 token

* **文件路径很重要**：Claude 像文件系统一样导航你的技能目录。使用正斜杠（`reference/guide.md`），不要用反斜杠
* **文件命名要有描述性**：使用表明内容的名称：`form_validation_rules.md`，而不是 `doc2.md`
* **为发现而组织**：按领域或功能构建目录结构
  * 好的：`reference/finance.md`、`reference/sales.md`
  * 差的：`docs/file1.md`、`docs/file2.md`
* **捆绑全面的资源**：包含完整的 API 文档、丰富的示例、大型数据集；在访问之前没有上下文惩罚
* **确定性操作优先使用脚本**：编写 `validate_form.py` 而不是让 Claude 生成验证代码
* **明确执行意图**：
  * "运行 `analyze_form.py` 来提取字段"（执行）
  * "参见 `analyze_form.py` 了解提取算法"（作为参考阅读）
* **测试文件访问模式**：通过真实请求测试来验证 Claude 能否导航你的目录结构

**示例：**

```
bigquery-skill/
├── SKILL.md (overview, points to reference files)
└── reference/
    ├── finance.md (revenue metrics)
    ├── sales.md (pipeline data)
    └── product.md (usage analytics)
```

当用户询问收入时，Claude 读取 SKILL.md，看到对 `reference/finance.md` 的引用，然后调用 bash 仅读取该文件。sales.md 和 product.md 文件保留在文件系统上，在需要之前消耗零上下文 token。这种基于文件系统的模型正是实现渐进式披露的关键。Claude 可以导航并选择性地加载每个任务所需的确切内容。

有关技术架构的完整详情，请参阅技能概述中的[技能工作原理](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

### MCP 工具引用

如果你的技能使用 MCP（模型上下文协议）工具，始终使用完全限定的工具名称以避免"工具未找到"错误。

**格式**：`ServerName:tool_name`

**示例**：

```markdown  theme={null}
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
Use the GitHub:create_issue tool to create issues.
```

其中：

* `BigQuery` 和 `GitHub` 是 MCP 服务器名称
* `bigquery_schema` 和 `create_issue` 是这些服务器中的工具名称

没有服务器前缀，Claude 可能无法定位工具，尤其是在有多个 MCP 服务器可用时。

### 避免假设工具已安装

不要假设包是可用的：

````markdown  theme={null}
**Bad example: Assumes installation**:
"Use the pdf library to process the file."

**Good example: Explicit about dependencies**:
"Install required package: `pip install pypdf`

Then use it:
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```"
````

## 技术说明

### YAML 前置元数据要求

SKILL.md 的前置元数据仅包含 `name`（最多 64 个字符）和 `description`（最多 1024 个字符）字段。有关完整结构详情，请参阅[技能概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure)。

### Token 预算

将 SKILL.md 正文保持在 500 行以内以获得最佳性能。如果你的内容超过此限制，请使用前面描述的渐进式披露模式将其拆分到单独的文件中。有关架构详情，请参阅[技能概述](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

## 有效技能清单

分享技能之前，请验证：

### 核心质量

* [ ] 描述具体且包含关键术语
* [ ] 描述同时包含技能的功能和使用时机
* [ ] SKILL.md 正文在 500 行以内
* [ ] 额外细节在单独的文件中（如果需要）
* [ ] 没有时效性信息（或放在"旧模式"部分）
* [ ] 全文术语一致
* [ ] 示例具体，而非抽象
* [ ] 文件引用仅一层深度
* [ ] 适当使用渐进式披露
* [ ] 工作流步骤清晰

### 代码和脚本

* [ ] 脚本解决问题而不是推给 Claude
* [ ] 错误处理明确且有帮助
* [ ] 没有"巫术常量"（所有值都有合理解释）
* [ ] 所需包在指令中列出并验证可用
* [ ] 脚本有清晰的文档
* [ ] 没有 Windows 风格路径（全部使用正斜杠）
* [ ] 关键操作有验证/确认步骤
* [ ] 质量关键任务包含反馈循环

### 测试

* [ ] 至少创建了三个评估
* [ ] 使用 Haiku、Sonnet 和 Opus 进行了测试
* [ ] 使用真实使用场景进行了测试
* [ ] 纳入了团队反馈（如适用）

## 后续步骤

<CardGroup cols={2}>
  <Card title="开始使用智能体技能" icon="rocket" href="/en/docs/agents-and-tools/agent-skills/quickstart">
    创建你的第一个技能
  </Card>

  <Card title="在 Claude Code 中使用技能" icon="terminal" href="/en/docs/claude-code/skills">
    在 Claude Code 中创建和管理技能
  </Card>

  <Card title="通过 API 使用技能" icon="code" href="/en/api/skills-guide">
    以编程方式上传和使用技能
  </Card>
</CardGroup>
