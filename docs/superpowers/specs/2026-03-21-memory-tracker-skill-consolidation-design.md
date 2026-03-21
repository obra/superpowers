# Memory Skill 合并设计

将 `skills/memory-bootstrap/` 合并进 `skills/memory-tracker/`，把当前“两个 skill 串行协作”的模式改为“单 skill 内按条件渐进补结构”。

## 动机

当前 memory 体系的主要耦合点在于：`memory-tracker` 明确要求先运行 `memory-bootstrap`，而 `memory-bootstrap` 又内置了目录初始化、默认 type、月 bucket 等结构知识。这样会带来两个问题：

- **触发割裂**：agent 需要先判断是否该用 `memory-bootstrap`，再切回 `memory-tracker` 完成真正的记录；记录动作被拆成两个 skill，调用链不自然。
- **规则分散**：结构初始化规则在一个 skill，记录规则在另一个 skill，维护和演进时需要同时修改两份文档。

本次设计目标是降低 skill 间耦合，同时保留当前“由 agent 自行发现仓库结构和 type 语义”的设计思路。

## 目标

- 保留单一入口：只保留 `memory-tracker`
- 仅在目录结构缺失或确实需要新增 type 时，才引导 agent 做渐进式结构引入
- `SKILL.md` 只保留必要信息，不在 skill 本体里硬编码过多仓库知识
- 保持 memory 的核心定义不变：记录闭合、可独立审阅的 change unit，而不是工作日志

## 非目标

- 不改变 memory entry 的核心格式与记录边界
- 不把 type 业务语义重新写死回 skill 文本
- 不引入新的独立 bootstrap skill 或额外中间层

## 核心设计

### 1. 单 skill 模型

保留 `skills/memory-tracker/` 作为唯一入口，删除 `skills/memory-bootstrap/` 作为独立 skill。

`memory-tracker` 同时承担两类职责：

- **主职责**：为闭合、可审阅的 change unit 记录 memory
- **辅助职责**：在发现结构缺失时，仅补齐继续记录所需的最小结构

这样 agent 不再需要在两个 skill 之间切换，而是在同一 skill 内根据仓库现状走不同分支。

### 2. 渐进式引入，而非预先 bootstrap

`memory-tracker` 不再要求预先完整初始化 `docs/superpowers/memory/`。新的原则是：

- 若根目录、router、目标 type 索引、目标月 bucket 中有缺失，只补齐当前记录所需的最小结构
- 若结构已经齐全，则直接记录，不做额外初始化
- 不为了“将来可能会用到”而预创建无关 type 或无关月份目录

这使结构创建从“预先铺满”变成“按需引入”。

对于从零开始、`docs/superpowers/memory/` 尚不存在的仓库，仍需要一套最小可用初始 taxonomy 作为 router 和首次记录的落点。该初始 taxonomy 可以继续沿用当前默认集合 `milestone`、`debug`、`refactor`，但这些知识应主要沉淀在模板资源中，而不是作为 `SKILL.md` 的大段规则正文展开说明。

### 3. type 语义继续由仓库发现

`memory-tracker` 继续维持当前设计哲学：type 的业务含义由仓库中的 memory 文档定义，而不是由 skill 自身硬编码。

因此，agent 的发现顺序保持为：

1. 读取 `docs/superpowers/memory/TYPE.md`
2. 依据其中的 `Use When` / `Avoid When` 选择候选 type
3. 读取目标 `docs/superpowers/memory/<type>/MEMORY.md`
4. 从该 type 文档中发现 entry template 和 TOC 更新方式

skill 只要求“按仓库定义发现”，不在 `SKILL.md` 中展开具体 type 语义。

### 4. 新增 type 的处理

当现有 type 都不合适时，`memory-tracker` 不应擅自把新的业务分类写入仓库。

推荐流程：

1. agent 先基于现有 router 与 type 文档判断“无匹配 type”
2. 明确提示需要扩展 type taxonomy
3. 与用户确认新增 type 的语义后，在同一 skill 的流程中补齐新 type 的最小结构
4. 然后继续写入该 entry

也就是说，新增 type 仍属于 `memory-tracker` 的职责范围，但它是一个需要明确确认的“渐进式扩展分支”，不是默认自动行为。

这里的“最小结构”至少包括：

- 更新 `docs/superpowers/memory/TYPE.md`，使新 type 成为后续可发现的仓库事实
- 创建 `docs/superpowers/memory/<type>/MEMORY.md`
- 创建 `docs/superpowers/memory/<type>/entries/<YYYY-MM>/`

只有在这些结构齐备后，agent 才能继续将 entry 记录到该 type 下。

## `SKILL.md` 的最小信息边界

合并后的 `skills/memory-tracker/SKILL.md` 应只保留完成决策所必需的信息：

- 什么时候记录 memory
- 什么时候跳过或延后记录
- 什么情况下需要先补结构
- type 必须由仓库文档发现
- 无匹配 type 时如何引导新增 type
- 记录规则、路径规则、错误边界

以下信息不应继续作为核心规则硬编码在 `SKILL.md` 中：

- 默认 type 的业务语义展开
- 过多模板映射细节
- 过于具体的目录初始化步骤清单

这些内容应尽量下沉为模板资源、supporting file，或让 agent 在运行时自行发现。

## 模板与目录调整

为支持单 skill 模式，当前 `skills/memory-bootstrap/template/` 中的模板资源应并入 `skills/memory-tracker/template/`。

合并后，`memory-tracker` 持有的资源包括：

- router 模板
- base type 模板
- 默认 type 模板
- entry 模板（注入后由 type `MEMORY.md` 指向 `docs/superpowers/memory/<type>/entry.md`）
- TOC table 模板

这些资源是实现支撑，不意味着 `SKILL.md` 需要逐项解释它们。

对于 cold start / structure repair 这种低频异常路径，初始化说明应拆到独立 supporting file，而不是常驻在 `SKILL.md` 主体中。`SKILL.md` 只需在检测到结构缺失时，引导 agent 读取该 supporting file 再继续。

其中，默认初始 taxonomy 及其 router/type 模板也保留在这些资源里，用于“memory 结构完全缺失”的首次按需引入场景。

## 迁移方案

### 仓库结构

- 保留 `skills/memory-tracker/`
- 将 `skills/memory-bootstrap/template/` 合并至 `skills/memory-tracker/template/`
- 删除 `skills/memory-bootstrap/SKILL.md`
- 删除空的 `skills/memory-bootstrap/` 目录

### 文本引用

- 删除所有对 `memory-bootstrap` 的显式依赖描述
- 将相关文案统一改成：缺结构时由 `memory-tracker` 引导读取独立 bootstrap supporting file，再渐进式补齐
- 搜索仓库内所有 `memory-bootstrap` 引用并一并迁移

## 预期结果

合并完成后，agent 在处理 memory 时只需要判断一次：是否应使用 `memory-tracker`。

进入 `memory-tracker` 后：

- 结构齐全 -> 直接记录
- 结构缺失 -> 补齐最小结构后记录
- 无匹配 type -> 引导确认并渐进扩展 type 后记录

整个流程从“skill 间切换”变为“单 skill 内条件分支”，耦合更低，使用心智模型也更简单。

## 风险与约束

- 若 `SKILL.md` 写得过细，会把仓库结构知识重新耦合回 skill 本体，违背本次目标
- 若“新增 type”规则写得过弱，agent 可能擅自扩 taxonomy；因此需要明确“先判断、再确认、后创建”
- 若模板迁移不完整，后续 agent 可能找不到初始化资源；迁移时需要一起更新引用路径

## 验证标准

- 仓库中只剩一个 memory 相关入口 skill：`memory-tracker`
- `memory-tracker` 不再显式要求先运行 `memory-bootstrap`
- `memory-tracker/SKILL.md` 仍然保持精简，只描述必要规则与边界
- 结构缺失时，agent 能从同一 skill 中得到“按需补齐最小结构”的指引
- 无匹配 type 时，agent 会先引导确认，再扩 type，而不是自动发明新分类
- memory 结构完全缺失时，agent 仍能通过并入后的模板资源建立最小可用初始 taxonomy
- 新增 type 时，agent 会同步更新 `docs/superpowers/memory/TYPE.md` 与目标 type 结构，使其成为后续可发现的仓库事实
