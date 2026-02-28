---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# 编写技能

## 概述

**编写技能就是将测试驱动开发（TDD）应用于流程文档。**

**个人技能存放在代理特定目录中（Claude Code 使用 `~/.claude/skills`，Codex 使用 `~/.agents/skills/`）**

你编写测试用例（使用子代理的压力场景），观察它们失败（基准行为），编写技能（文档），观察测试通过（代理遵守），然后重构（堵住漏洞）。

**核心原则：** 如果你没有观察到代理在没有技能的情况下失败，你就不知道技能是否教了正确的内容。

**必要背景知识：** 在使用此技能之前，你必须理解 superpowers:test-driven-development。该技能定义了基本的红-绿-重构循环。本技能将 TDD 适配到文档编写中。

**官方指南：** 有关 Anthropic 官方的技能编写最佳实践，请参阅 anthropic-best-practices.md。该文档提供了补充本技能中 TDD 导向方法的额外模式和指南。

## 什么是技能？

**技能**是经过验证的技术、模式或工具的参考指南。技能帮助未来的 Claude 实例找到并应用有效的方法。

**技能是：** 可复用的技术、模式、工具、参考指南

**技能不是：** 关于你曾经如何解决某个问题的叙事

## 技能的 TDD 映射

| TDD 概念 | 技能创建 |
|-------------|----------------|
| **测试用例** | 使用子代理的压力场景 |
| **生产代码** | 技能文档（SKILL.md） |
| **测试失败（红色）** | 代理在没有技能时违反规则（基准） |
| **测试通过（绿色）** | 代理在技能存在时遵守规则 |
| **重构** | 在保持合规的同时堵住漏洞 |
| **先写测试** | 在编写技能之前运行基准场景 |
| **观察失败** | 记录代理使用的确切合理化借口 |
| **最小代码** | 编写针对那些特定违规行为的技能 |
| **观察通过** | 验证代理现在遵守规则 |
| **重构循环** | 发现新的合理化借口 → 堵住 → 重新验证 |

整个技能创建过程遵循红-绿-重构循环。

## 何时创建技能

**在以下情况创建：**
- 技术对你来说不是直觉上显而易见的
- 你会在多个项目中再次引用它
- 模式具有广泛适用性（非项目特定）
- 其他人也会受益

**不要为以下情况创建：**
- 一次性解决方案
- 已在其他地方有充分文档的标准实践
- 项目特定的约定（放在 CLAUDE.md 中）
- 机械性约束（如果可以用正则表达式/验证来强制执行，就自动化——把文档留给需要判断力的场景）

## 技能类型

### 技术
具有可遵循步骤的具体方法（condition-based-waiting、root-cause-tracing）

### 模式
思考问题的方式（flatten-with-flags、test-invariants）

### 参考
API 文档、语法指南、工具文档（office docs）

## 目录结构


```
skills/
  skill-name/
    SKILL.md              # 主参考文件（必需）
    supporting-file.*     # 仅在需要时添加
```

**扁平命名空间** - 所有技能在一个可搜索的命名空间中

**单独文件用于：**
1. **大量参考资料**（100+ 行）- API 文档、全面的语法
2. **可复用工具** - 脚本、工具、模板

**保持内联：**
- 原则和概念
- 代码模式（< 50 行）
- 其他所有内容

## SKILL.md 结构

**前置元数据（YAML）：**
- 仅支持两个字段：`name` 和 `description`
- 总计最多 1024 个字符
- `name`：仅使用字母、数字和连字符（不使用括号、特殊字符）
- `description`：第三人称，仅描述何时使用（不描述做什么）
  - 以 "Use when..." 开头，聚焦于触发条件
  - 包含具体的症状、情境和上下文
  - **绝不总结技能的流程或工作流**（原因见 CSO 部分）
  - 尽量保持在 500 个字符以内

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---

# 技能名称

## 概述
这是什么？用 1-2 句话说明核心原则。

## 何时使用
[如果决策不明显，使用小型内联流程图]

症状和用例的项目符号列表
何时不使用

## 核心模式（用于技术/模式）
前后代码对比

## 快速参考
用于快速浏览常见操作的表格或项目符号

## 实现
简单模式使用内联代码
大量参考或可复用工具使用文件链接

## 常见错误
什么会出错 + 修复方法

## 实际影响（可选）
具体结果
```


## Claude 搜索优化（CSO）

**对发现至关重要：** 未来的 Claude 需要能够找到你的技能

### 1. 丰富的描述字段

**目的：** Claude 读取描述来决定为给定任务加载哪些技能。让它回答："我现在应该读这个技能吗？"

**格式：** 以 "Use when..." 开头，聚焦于触发条件

**关键：描述 = 何时使用，而非技能做什么**

描述应该仅描述触发条件。不要在描述中总结技能的流程或工作流。

**为什么这很重要：** 测试发现，当描述总结了技能的工作流时，Claude 可能会跟随描述而不是阅读完整的技能内容。一个说"任务之间进行代码审查"的描述导致 Claude 只做了一次审查，尽管技能的流程图清楚地显示了两次审查（规范合规性检查然后代码质量检查）。

当描述改为仅包含"Use when executing implementation plans with independent tasks"（没有工作流摘要）时，Claude 正确地阅读了流程图并遵循了两阶段审查流程。

**陷阱：** 总结工作流的描述会创建一个 Claude 会走的捷径。技能正文变成了 Claude 会跳过的文档。

```yaml
# ❌ 错误：总结了工作流 - Claude 可能会跟随这个而不是阅读技能
description: Use when executing plans - dispatches subagent per task with code review between tasks

# ❌ 错误：包含过多流程细节
description: Use for TDD - write test first, watch it fail, write minimal code, refactor

# ✅ 正确：仅包含触发条件，没有工作流摘要
description: Use when executing implementation plans with independent tasks in the current session

# ✅ 正确：仅包含触发条件
description: Use when implementing any feature or bugfix, before writing implementation code
```

**内容：**
- 使用具体的触发器、症状和表明此技能适用的情境
- 描述*问题*（竞态条件、不一致行为）而不是*语言特定的症状*（setTimeout、sleep）
- 除非技能本身是特定技术的，否则保持触发器与技术无关
- 如果技能是特定技术的，在触发器中明确说明
- 使用第三人称（注入系统提示中）
- **绝不总结技能的流程或工作流**

```yaml
# ❌ 错误：太抽象、模糊，没有包含何时使用
description: For async testing

# ❌ 错误：第一人称
description: I can help you with async tests when they're flaky

# ❌ 错误：提到了技术但技能并非特定于该技术
description: Use when tests use setTimeout/sleep and are flaky

# ✅ 正确：以 "Use when" 开头，描述问题，没有工作流
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently

# ✅ 正确：特定技术的技能，带有明确的触发器
description: Use when using React Router and handling authentication redirects
```

### 2. 关键词覆盖

使用 Claude 会搜索的词汇：
- 错误消息："Hook timed out"、"ENOTEMPTY"、"race condition"
- 症状："flaky"、"hanging"、"zombie"、"pollution"
- 同义词："timeout/hang/freeze"、"cleanup/teardown/afterEach"
- 工具：实际命令、库名称、文件类型

### 3. 描述性命名

**使用主动语态，动词优先：**
- ✅ `creating-skills` 而非 `skill-creation`
- ✅ `condition-based-waiting` 而非 `async-test-helpers`

### 4. Token 效率（关键）

**问题：** getting-started 和经常引用的技能会加载到每个对话中。每个 token 都很重要。

**目标字数：**
- getting-started 工作流：每个 <150 词
- 经常加载的技能：总计 <200 词
- 其他技能：<500 词（仍要简洁）

**技巧：**

**将详细信息移到工具帮助中：**
```bash
# ❌ 错误：在 SKILL.md 中列出所有标志
search-conversations supports --text, --both, --after DATE, --before DATE, --limit N

# ✅ 正确：引用 --help
search-conversations supports multiple modes and filters. Run --help for details.
```

**使用交叉引用：**
```markdown
# ❌ 错误：重复工作流细节
When searching, dispatch subagent with template...
[20 lines of repeated instructions]

# ✅ 正确：引用其他技能
Always use subagents (50-100x context savings). REQUIRED: Use [other-skill-name] for workflow.
```

**压缩示例：**
```markdown
# ❌ 错误：冗长的示例（42 词）
your human partner: "How did we handle authentication errors in React Router before?"
You: I'll search past conversations for React Router authentication patterns.
[Dispatch subagent with search query: "React Router authentication error handling 401"]

# ✅ 正确：精简的示例（20 词）
Partner: "How did we handle auth errors in React Router?"
You: Searching...
[Dispatch subagent → synthesis]
```

**消除冗余：**
- 不要重复交叉引用的技能中已有的内容
- 不要解释从命令本身就能明显看出的内容
- 不要包含同一模式的多个示例

**验证：**
```bash
wc -w skills/path/SKILL.md
# getting-started 工作流：目标每个 <150
# 其他经常加载的：目标总计 <200
```

**以你做的事情或核心洞察来命名：**
- ✅ `condition-based-waiting` > `async-test-helpers`
- ✅ `using-skills` 而非 `skill-usage`
- ✅ `flatten-with-flags` > `data-structure-refactoring`
- ✅ `root-cause-tracing` > `debugging-techniques`

**动名词（-ing）适用于流程：**
- `creating-skills`、`testing-skills`、`debugging-with-logs`
- 主动式，描述你正在执行的操作

### 4. 交叉引用其他技能

**编写引用其他技能的文档时：**

仅使用技能名称，并带有明确的要求标记：
- ✅ 好：`**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development`
- ✅ 好：`**REQUIRED BACKGROUND:** You MUST understand superpowers:systematic-debugging`
- ❌ 差：`See skills/testing/test-driven-development`（不清楚是否必需）
- ❌ 差：`@skills/testing/test-driven-development/SKILL.md`（强制加载，消耗上下文）

**为什么不使用 @ 链接：** `@` 语法会立即强制加载文件，在你需要之前消耗 200k+ 的上下文。

## 流程图使用

```dot
digraph when_flowchart {
    "需要展示信息？" [shape=diamond];
    "可能会做错决策？" [shape=diamond];
    "使用 markdown" [shape=box];
    "小型内联流程图" [shape=box];

    "需要展示信息？" -> "可能会做错决策？" [label="是"];
    "可能会做错决策？" -> "小型内联流程图" [label="是"];
    "可能会做错决策？" -> "使用 markdown" [label="否"];
}
```

**仅在以下情况使用流程图：**
- 不明显的决策点
- 可能过早停止的流程循环
- "何时使用 A 还是 B"的决策

**绝不为以下内容使用流程图：**
- 参考资料 → 表格、列表
- 代码示例 → Markdown 代码块
- 线性指令 → 编号列表
- 没有语义含义的标签（step1、helper2）

有关 graphviz 样式规则，请参阅 @graphviz-conventions.dot。

**为你的人类伙伴可视化：** 使用此目录中的 `render-graphs.js` 将技能的流程图渲染为 SVG：
```bash
./render-graphs.js ../some-skill           # 每个图表单独渲染
./render-graphs.js ../some-skill --combine # 所有图表合并为一个 SVG
```

## 代码示例

**一个优秀的示例胜过许多平庸的示例**

选择最相关的语言：
- 测试技术 → TypeScript/JavaScript
- 系统调试 → Shell/Python
- 数据处理 → Python

**好的示例：**
- 完整且可运行
- 注释清楚，解释为什么
- 来自真实场景
- 清晰展示模式
- 可以直接适配（不是通用模板）

**不要：**
- 用 5 种以上语言实现
- 创建填空模板
- 编写虚构的示例

你擅长移植——一个优秀的示例就够了。

## 文件组织

### 自包含技能
```
defense-in-depth/
  SKILL.md    # 所有内容内联
```
适用场景：所有内容都能放下，不需要大量参考资料

### 带可复用工具的技能
```
condition-based-waiting/
  SKILL.md    # 概述 + 模式
  example.ts  # 可适配的工作辅助工具
```
适用场景：工具是可复用的代码，而不仅是叙述

### 带大量参考资料的技能
```
pptx/
  SKILL.md       # 概述 + 工作流
  pptxgenjs.md   # 600 行 API 参考
  ooxml.md       # 500 行 XML 结构
  scripts/       # 可执行工具
```
适用场景：参考资料太大，无法内联

## 铁律（与 TDD 相同）

```
没有失败测试就没有技能
```

这适用于新技能和对现有技能的编辑。

先写技能再测试？删除它。重新开始。
不测试就编辑技能？同样的违规。

**没有例外：**
- 不适用于"简单添加"
- 不适用于"只是添加一个部分"
- 不适用于"文档更新"
- 不要保留未经测试的更改作为"参考"
- 不要在运行测试时"调整"
- 删除就是删除

**必要背景知识：** superpowers:test-driven-development 技能解释了为什么这很重要。相同的原则适用于文档。

## 测试所有技能类型

不同的技能类型需要不同的测试方法：

### 纪律执行型技能（规则/要求）

**示例：** TDD、完成前验证、编码前设计

**测试方法：**
- 学术问题：他们理解规则吗？
- 压力场景：在压力下他们遵守吗？
- 多重压力组合：时间 + 沉没成本 + 疲劳
- 识别合理化借口并添加明确的反驳

**成功标准：** 代理在最大压力下遵循规则

### 技术型技能（操作指南）

**示例：** condition-based-waiting、root-cause-tracing、defensive-programming

**测试方法：**
- 应用场景：他们能正确应用技术吗？
- 变体场景：他们能处理边缘情况吗？
- 缺失信息测试：指令是否有缺口？

**成功标准：** 代理成功将技术应用于新场景

### 模式型技能（思维模型）

**示例：** reducing-complexity、information-hiding 概念

**测试方法：**
- 识别场景：他们能识别模式何时适用吗？
- 应用场景：他们能使用思维模型吗？
- 反面示例：他们知道何时不应用吗？

**成功标准：** 代理正确识别何时/如何应用模式

### 参考型技能（文档/API）

**示例：** API 文档、命令参考、库指南

**测试方法：**
- 检索场景：他们能找到正确的信息吗？
- 应用场景：他们能正确使用找到的信息吗？
- 缺口测试：常见用例是否被覆盖？

**成功标准：** 代理找到并正确应用参考信息

## 跳过测试的常见合理化借口

| 借口 | 现实 |
|--------|---------|
| "技能显然很清楚" | 对你清楚 ≠ 对其他代理清楚。测试它。 |
| "这只是参考资料" | 参考资料可能有缺口、不清楚的部分。测试检索。 |
| "测试太过了" | 未经测试的技能都有问题。永远如此。15 分钟测试节省数小时。 |
| "出了问题再测试" | 问题 = 代理无法使用技能。部署前测试。 |
| "测试太繁琐" | 测试比在生产中调试糟糕的技能要少繁琐得多。 |
| "我对它很有信心" | 过度自信保证会出问题。无论如何都要测试。 |
| "学术审查就够了" | 阅读 ≠ 使用。测试应用场景。 |
| "没时间测试" | 部署未经测试的技能会浪费更多时间来修复它。 |

**以上所有意味着：部署前测试。没有例外。**

## 使技能抵御合理化借口

执行纪律的技能（如 TDD）需要抵抗合理化。代理很聪明，在压力下会找到漏洞。

**心理学说明：** 了解说服技术为什么有效有助于你系统地应用它们。有关权威、承诺、稀缺性、社会证明和统一性原则的研究基础，请参阅 persuasion-principles.md（Cialdini, 2021; Meincke et al., 2025）。

### 明确堵住每个漏洞

不要只陈述规则——禁止具体的变通方法：

<Bad>
```markdown
先写代码再写测试？删除它。
```
</Bad>

<Good>
```markdown
先写代码再写测试？删除它。重新开始。

**没有例外：**
- 不要保留它作为"参考"
- 不要在写测试时"调整"它
- 不要查看它
- 删除就是删除
```
</Good>

### 处理"精神与字面"的争论

尽早添加基础原则：

```markdown
**违反规则的字面意思就是违反规则的精神。**
```

这可以切断整类"我在遵循精神"的合理化借口。

### 建立合理化借口表

从基准测试中捕获合理化借口（见下面的测试部分）。代理提出的每个借口都进入表格：

```markdown
| 借口 | 现实 |
|--------|---------|
| "太简单了不需要测试" | 简单的代码也会出错。测试只需 30 秒。 |
| "我以后再测试" | 立即通过的测试什么也证明不了。 |
| "事后测试达到同样的目标" | 事后测试 = "这做了什么？" 先写测试 = "这应该做什么？" |
```

### 创建红旗列表

让代理在合理化时容易自检：

```markdown
## 红旗 - 停下来重新开始

- 在测试之前写代码
- "我已经手动测试过了"
- "事后测试达到同样的目的"
- "这是精神而非仪式"
- "这种情况不同，因为..."

**以上所有意味着：删除代码。从 TDD 重新开始。**
```

### 更新 CSO 以包含违规症状

在描述中添加：你即将违反规则的症状：

```yaml
description: use when implementing any feature or bugfix, before writing implementation code
```

## 技能的红-绿-重构

遵循 TDD 循环：

### 红色：编写失败测试（基准）

在没有技能的情况下使用子代理运行压力场景。记录确切行为：
- 他们做了什么选择？
- 他们使用了什么合理化借口（逐字记录）？
- 哪些压力触发了违规？

这是"观察测试失败"——你必须在编写技能之前看到代理自然会做什么。

### 绿色：编写最小技能

编写针对那些特定合理化借口的技能。不要为假设情况添加额外内容。

使用技能运行相同的场景。代理现在应该遵守。

### 重构：堵住漏洞

代理找到了新的合理化借口？添加明确的反驳。重新测试直到无懈可击。

**测试方法论：** 有关完整的测试方法论，请参阅 @testing-skills-with-subagents.md：
- 如何编写压力场景
- 压力类型（时间、沉没成本、权威、疲劳）
- 系统性地堵住漏洞
- 元测试技术

## 反模式

### ❌ 叙事示例
"在 2025-10-03 的会话中，我们发现空的 projectDir 导致了..."
**为什么不好：** 太具体，不可复用

### ❌ 多语言稀释
example-js.js、example-py.py、example-go.go
**为什么不好：** 质量平庸，维护负担

### ❌ 流程图中的代码
```dot
step1 [label="import fs"];
step2 [label="read file"];
```
**为什么不好：** 无法复制粘贴，难以阅读

### ❌ 通用标签
helper1、helper2、step3、pattern4
**为什么不好：** 标签应该有语义含义

## 停下来：在转到下一个技能之前

**编写任何技能后，你必须停下来完成部署流程。**

**不要：**
- 批量创建多个技能而不逐一测试
- 在当前技能验证之前转到下一个技能
- 因为"批处理更高效"而跳过测试

**以下部署检查清单对每个技能都是强制性的。**

部署未经测试的技能 = 部署未经测试的代码。这违反了质量标准。

## 技能创建检查清单（TDD 适配版）

**重要：使用 TodoWrite 为以下每个检查项创建待办事项。**

**红色阶段 - 编写失败测试：**
- [ ] 创建压力场景（纪律型技能需要 3 个以上组合压力）
- [ ] 在没有技能的情况下运行场景 - 逐字记录基准行为
- [ ] 识别合理化借口/失败中的模式

**绿色阶段 - 编写最小技能：**
- [ ] 名称仅使用字母、数字、连字符（不使用括号/特殊字符）
- [ ] YAML 前置元数据仅包含 name 和 description（最多 1024 个字符）
- [ ] 描述以 "Use when..." 开头，包含具体的触发器/症状
- [ ] 描述使用第三人称
- [ ] 全文包含搜索关键词（错误、症状、工具）
- [ ] 清晰的概述和核心原则
- [ ] 处理在红色阶段识别的特定基准失败
- [ ] 代码内联或链接到单独文件
- [ ] 一个优秀的示例（不是多语言）
- [ ] 使用技能运行场景 - 验证代理现在遵守

**重构阶段 - 堵住漏洞：**
- [ ] 识别测试中的新合理化借口
- [ ] 添加明确的反驳（如果是纪律型技能）
- [ ] 从所有测试迭代中建立合理化借口表
- [ ] 创建红旗列表
- [ ] 重新测试直到无懈可击

**质量检查：**
- [ ] 仅在决策不明显时使用小流程图
- [ ] 快速参考表
- [ ] 常见错误部分
- [ ] 没有叙事故事
- [ ] 支持文件仅用于工具或大量参考

**部署：**
- [ ] 将技能提交到 git 并推送到你的 fork（如果已配置）
- [ ] 考虑通过 PR 贡献回来（如果广泛有用）

## 发现工作流

未来的 Claude 如何找到你的技能：

1. **遇到问题**（"测试不稳定"）
3. **找到技能**（描述匹配）
4. **扫描概述**（这相关吗？）
5. **阅读模式**（快速参考表）
6. **加载示例**（仅在实现时）

**针对此流程优化** - 将可搜索的术语尽早且频繁地放置。

## 总结

**创建技能就是流程文档的 TDD。**

相同的铁律：没有失败测试就没有技能。
相同的循环：红色（基准）→ 绿色（编写技能）→ 重构（堵住漏洞）。
相同的好处：更好的质量、更少的意外、无懈可击的结果。

如果你对代码遵循 TDD，就对技能也遵循 TDD。这是将相同的纪律应用于文档。
