# Progress 到 Memory 的重命名设计

## 背景

这个 fork 当前引入了一套按分类组织的项目记录体系，但它使用的正式术语是 `progress`。这一命名已经进入当前框架的公开表面：

- skill 名称：`progress-bootstrap`、`progress-tracker`
- 规范存储路径：`docs/superpowers/progress/`
- 分类索引文件：`PROGRESS.md`
- README 与 skill 文档中对该机制的说明

你希望在相关 PR merge 之前，将整套命名统一改为 `memory`。由于这项工作仍处于 pre-merge 阶段，现在正是做一次干净的破坏性重命名的最佳窗口，不需要为了兼容旧名字而保留过渡层。

## 目标

让 `memory` 成为这一框架能力的唯一正式术语，替换 skill 名、目录名、索引文件名、模板命名以及所有面向用户的公开文档中的 `progress`。

## 非目标

- 不重做现有的分类模型
- 不修改 `milestone`、`debug`、`refactor` 的准入规则
- 不为旧的 `progress` 命名保留兼容 alias 或 fallback
- 不重写历史 git 元数据，例如旧 commit message、旧分支名或 `.git` 内部记录

## 决策摘要

### 1. 正式术语

`memory` 成为这一子系统的唯一正式术语。

- `progress` 不再作为正式 skill 名、目录名、索引文件名或规范文档术语存在
- 历史 git 记录中保留 `progress` 不算当前框架术语的一部分
- 普通英语语境里的 `progress` 如果并不是在指代这套框架，可以继续保留

### 2. 重命名边界

本次更名是一次性、全表面的切换。

- skill 从 `progress-*` 改为 `memory-*`
- 存储路径从 `docs/superpowers/progress/` 改为 `docs/superpowers/memory/`
- 分类索引文件从 `PROGRESS.md` 改为 `MEMORY.md`
- 模板、示例和描述文案从 progress 术语切换到 memory 术语
- README 以及相关公开框架文档只暴露新的 `memory` 名称

### 3. 不保留兼容层

本次重命名明确不保留旧名字的兼容支持。

- 不提供 `progress-*` skill alias
- 不从 `docs/superpowers/progress/` 做 fallback 读取
- 不在运行时继续承认旧名字为受支持接口

这样可以避免临时兼容层演变成长期设计债务，并确保这个 fork 在 merge 前就形成干净、一致的命名体系。

## 信息架构

### Skill 命名

- `progress-bootstrap` -> `memory-bootstrap`
- `progress-tracker` -> `memory-tracker`

skill 源码目录也要一起改名，避免仓库路径本身继续暴露旧术语。

- `skills/progress-bootstrap/` -> `skills/memory-bootstrap/`
- `skills/progress-tracker/` -> `skills/memory-tracker/`

每个重命名后的 skill 都必须同步更新：

- frontmatter `name`
- frontmatter `description`
- 顶层标题
- 对自身或配套 skill 的内部引用
- skill 目录名
- 指向旧 skill 路径的仓库链接或 catalog 引用
- README 或技能清单中的列举项

### 存储结构

分类模型保持不变，但根路径切换到 `memory`。

旧结构：

```text
docs/superpowers/progress/<category>/PROGRESS.md
docs/superpowers/progress/<category>/entries/<YYYY-MM>/
```

新结构：

```text
docs/superpowers/memory/<category>/MEMORY.md
docs/superpowers/memory/<category>/entries/<YYYY-MM>/
```

保留的分类仍然是：

- `milestone`
- `debug`
- `refactor`

### 模板命名

模板文件名也要同步切到 memory 术语。例如：

- `milestone-progress-template.md` -> `milestone-memory-template.md`
- `debug-progress-template.md` -> `debug-memory-template.md`
- `refactor-progress-template.md` -> `refactor-memory-template.md`
- `category-progress-template.md` -> `category-memory-template.md`

模板正文也要统一调整，确保最终生成的文档使用的是 `memory`、`memory entry`、`memory category` 这套术语，而不是新旧混写。

### 概念映射

本次不改变概念模型，只改变命名系统。

- `progress entry` -> `memory entry`
- `progress record` -> `memory record`
- `progress category` -> `memory category`
- `project progress memory` -> `project memory`

`PROGRESS.md` 这个文件名不能在重命名后继续保留。否则会出现目录已经是 `memory/`，但核心索引文件仍叫 `PROGRESS.md` 的明显不一致。因此每个分类的索引文件都应改为 `MEMORY.md`。

## 执行设计

### 变更顺序

1. 先更新公开定义层：
   - skill 名称
   - skill frontmatter 与描述
   - README 中的技能清单与框架说明
2. 再更新物理结构：
   - `docs/superpowers/progress/` -> `docs/superpowers/memory/`
   - `PROGRESS.md` -> `MEMORY.md`
3. 再更新模板与示例：
   - 模板文件名
   - 模板正文文案
   - 示例路径与示例术语
4. 最后做基于正则的全仓验证

这个顺序可以降低“文档已经改名，但文件系统和 skill contract 仍是旧名字”的半迁移状态风险。

### 范围控制

只修改当前框架里的正式命名，不做机械式全局替换。

- 当前代码、文档、模板、示例里，只要是在定义这套子系统，都必须改为 `memory`
- 历史 git 记录保持不动
- 普通英语里的 `progress` 如果与这套子系统无关，不应强行改写

也就是说，这次更名必须是“按语义判断后重命名”，而不是盲目的全局 search-and-replace。

正则搜索只用于发现候选命中，不代表这些命中都应该被直接改写。每个命中点都需要逐一人工复核，确认它是否真的属于这套框架的正式命名。如果存在边界模糊、语义不确定或我无法稳定判断的命中点，应暂停该处修改并请求你复核，而不是擅自替换。

### 旧仓库数据的处理规则

重命名后的框架不应继续静默支持旧的 `progress` 存储结构。

- `memory-bootstrap` 只在 `docs/superpowers/memory/` 下初始化规范结构
- `memory-tracker` 只把 `docs/superpowers/memory/` 视为唯一 canonical root
- 如果目标仓库里只存在旧的 `docs/superpowers/progress/` 结构，新 skill 不应把它当成受支持的运行时路径
- 框架可以报告“canonical memory structure 缺失，需要 bootstrap 或显式迁移”，但不能继续静默从旧路径读写

这样才能确保这是一次真正的 breaking rename，而不是把旧路径变成长期隐性兼容负担。

## 验证策略

本次更名的主验收机制是基于正则的全仓扫描，再辅以文件系统层面的结构校验。

这里的正则扫描是“发现候选点”的工具，不是“自动决定修改”的工具。正则命中之后，必须逐点复核，再决定是否修改。

### 必改文档范围

这次变更至少必须覆盖：

- `README.md`
- 两个重命名后的 skill 文档
- 这两个 skill 使用到的模板文件
- 任何会向用户或 agent 暴露旧 skill 名、旧 canonical path、旧索引文件名的仓库文档或引用说明

这里的“公开框架文档”指的是：任何被追踪、并且用于指导用户或 agent 如何发现、调用、存储或理解这套子系统的文件。

### 第一轮：框架残留检查

搜索必须消失的正式框架引用：

- `\bprogress-bootstrap\b`
- `\bprogress-tracker\b`
- `docs/superpowers/progress/`
- `\bPROGRESS\.md\b`
- `progress entry|progress record|progress category|project progress memory`

### 第二轮：混合命名检查

搜索迁移过程中可能引入的新旧混合命名：

- `memory-progress|progress-memory`
- `docs/superpowers/memory/.+PROGRESS\.md`
- 任何公开引用中出现 `memory` 术语却仍指向旧路径或旧文件命名的情况

### 第三轮：人工复核模糊命中

人工检查 README、skill 描述和模板文案中的模糊匹配，确保最终表达自然、准确，而不是机械替换后的生硬句子。

对于每个正则命中点，都要做以下判断：

- 它是否确实在指代这套框架，而不是普通英语语义
- 它是否属于正式命名、canonical path、索引文件名、模板名或公开框架文档
- 它是否应该重命名，还是应该保留原样
- 如果判断标准不清晰，是否需要升级给你人工确认

重点检查：

- 机械替换导致的不自然措辞
- `project progress memory` 这类残留混合表达
- `memory` 标签仍然指向旧 `progress` 路径的情况
- 我无法稳定判断是否属于框架术语的边界命中

### 第四轮：文件系统校验

除了文本扫描，还要确认旧的 canonical artifact 已经从仓库树中消失。

- 旧的 skill 目录不再存在
- `docs/superpowers/progress/` 不再作为当前框架根路径存在
- 带有 subsystem 含义的旧 `progress` 模板文件名不再存在
- 没有任何分类仍使用 `PROGRESS.md`
- `docs/superpowers/memory/` 下的每个默认分类都存在 `MEMORY.md`

## 完成判定

当以下条件全部满足时，才算这次重命名完成：

- 框架表面不再存在正式的 `progress-*` skill 名
- 仓库中不再保留旧的 `skills/progress-*` 目录
- canonical storage root 已切换为 `docs/superpowers/memory/`
- 旧的 `docs/superpowers/progress/` 根路径不再作为受支持结构存在于当前仓库树中
- 分类索引文件统一命名为 `MEMORY.md`
- `milestone`、`debug`、`refactor` 三个分类在 `docs/superpowers/memory/` 下都各自拥有 `MEMORY.md`
- 模板和示例全面使用 memory 术语
- README 与 skill 文档对外只暴露 `memory` 这一正式名称
- 正则验证后，除历史 git 元数据或普通英语语境外，不再残留框架层面的 `progress` 命名

## 风险与应对

### 风险一：替换过度

如果直接做粗暴替换，可能会把与该子系统无关的自然语言 `progress` 也错误改掉。

应对方式：

- 对 canonical 结构和正式文档做定点修改
- 用正则搜索做候选发现和残留检测，而不是把命中结果直接当成改写清单
- 在宣布完成前，对每个命中点做人工复核
- 对无法稳定判断的命中点请求你复核，而不是擅自替换

### 风险二：路径与契约漂移

可能出现路径已经改名，但示例、错误处理或 companion skill 引用仍然指向旧名字的情况。

应对方式：

- 把 README、两个 skill、模板文件视为一个统一变更单元
- 在同一轮验证中同时检查精确路径和概念术语

## 预期结果

完成后，这个 fork 将对外呈现一套干净、一致的 `memory` 体系：

- 用户看到的是 `memory-bootstrap` 和 `memory-tracker`
- canonical 文档指向 `docs/superpowers/memory/`
- 分类索引文件统一为 `MEMORY.md`
- 旧的 `progress` 不再作为当前框架的正式术语存在
