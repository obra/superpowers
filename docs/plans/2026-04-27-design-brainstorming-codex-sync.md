# Horspowers 对齐上游 Brainstorming / Codex 能力设计文档

**设计时间**: 2026-04-27
**状态**: 设计完成，待实施
**适用分支**: `codex/upstream-brainstorm-codex-sync`

---

## 1. 背景与结论

本次目标不是把 fork 直接追到上游最新状态，而是让 Horspowers 在保留本地特性的前提下，吸收上游在以下两个方向上的有效演进：

1. `brainstorming` 工作流增强
2. Codex 原生适配与技能发现

经过分叉分析，当前 `main` 与 `upstream/dev` 的真实共同祖先是：

- `b9e16498b9b6b06defa34cf0d6d345cd2c13ad31`
- 时间: 2025-12-26
- 上游标记: `v4.0.3`

这意味着本地后续的 `v4.1.x / v4.3.x` 不是共同基线，而是 fork 后的独立演进。因此本次同步不能以版本号为依据，也不适合直接执行大范围 `merge` / `rebase`。

**核心结论：**

- `brainstorming` 主技能文件应采用“参考上游最终行为，手工融合到本地流程”的方式。
- `codex` 适配应采用“迁移到原生 skill discovery 优先，旧 bootstrap 兼容保留一段时间”的方式。
- `brainstorm server` 这类新增且相对独立的能力，适合按上游最终文件状态引入，而不是 replay 整段提交历史。

---

## 2. 本次设计目标

### 2.1 目标

1. 让 Horspowers 获得上游新版 `brainstorming` 的关键行为约束
2. 让 Horspowers 在 Codex 中可以通过原生 skills 发现机制直接使用
3. 保留 Horspowers 已有的中文化、文档驱动、配置驱动、本地命名体系
4. 在不破坏现有用户安装方式的前提下，提供迁移路径

### 2.2 非目标

1. 不追求提交历史与上游完全一致
2. 不在本次同步中整体替换 `hooks/`、`commands/`、`README.md`
3. 不强制删除旧的 Codex bootstrap/CLI 兼容层
4. 不把上游所有目录结构和命名原样搬入 Horspowers

---

## 3. 上游改动拆解

## 3.1 Brainstorming 相关改动

上游在 `brainstorming` 方向上的有效改动可以分为三层。

### A. 流程层

关键提交：

- `7f2ee61` Enforce brainstorming workflow with hard gates and process flow
- `ee14cae` add spec document reviewer prompt template
- `daa3fb2` architecture guidance and capability-aware escalation
- `d48b14e` project-level scope assessment
- `aba2542` visual companion offer language broadening
- `ec3f7f1` user review gate between spec and writing-plans
- `9d2b886` spec review loop added to checklist and flow
- `2c6a8a3` tone down review loops / lightweight self-review

这些改动的本质是把 `brainstorming` 从“建议性对话流程”提升为“强约束设计前置流程”。

### B. 可视化陪伴层

关键提交：

- `866f2bd` visual companion integration
- `81acbcd` per-platform launch instructions
- `7f8edd9` write server-info for background launch discovery

这些改动为 brainstorming 增加了浏览器可视化工作流，但不是每轮都会启用，而是按问题逐次判断是否需要视觉呈现。

### C. Brainstorm Server 运行时层

关键提交：

- `419889b` move brainstorm-server into skill directory
- `7446c84` bundle dependencies / no extra npm install
- `7f6380d` WebSocket protocol layer
- `8d9b94e` HTTP server + file watching
- `7619570` zero-dep server.js
- `263e326` idle auto-exit + liveness check
- `ec99b7c` exit when owner dies
- `c6a2b1b` Codex / Windows foreground behavior
- `61a64d7` verify stop-server succeeded
- `f34ee47` Windows lifecycle fixes
- `3128a2c` ESM / CommonJS fix
- `94b2bcb` split content/state peer dirs
- `af025aa` owner PID lifecycle reliability fix

这些改动最终形成了一套较完整、可跨平台运行的可视化 companion server。

## 3.2 Codex 相关改动

上游在 Codex 方向上的关键演进是“从 bootstrap CLI 转向原生 skill discovery”。

### A. 早期过渡态

- `d41f951` add minimal Codex installer
- `47d3df7` rewrite INSTALL for native discovery
- `0771fd7` installer path fixes

### B. 最终方向

- `6a07692` drop installer script and AGENTS.md gatekeeper
- `8dd31c3` migration / uninstall notes
- `7820adc` named agent dispatch mapping for Codex
- `687a661` deprecated collab flag fix

这些改动说明上游的最终目标不是继续维护 `.codex/superpowers-codex bootstrap` 作为主入口，而是：

1. 通过 `~/.agents/skills/...` 让 Codex 原生发现 skills
2. 用独立的 tool mapping 文档说明 Codex 与 Claude Code 的语义差异
3. 把 subagent 能力映射到 Codex 自己的 agent 机制，而不是简单宣布“不可用”

---

## 4. Horspowers 当前状态与冲突点

## 4.1 本地 Brainstorming 现状

当前 `skills/brainstorming/SKILL.md` 已包含以下本地特性：

- 中文触发说明
- 文档驱动设计流程
- `.horspowers-config.yaml` 配置感知
- `documentation.enabled` 条件判断
- 与本地文档系统、计划系统的集成

因此该文件不能直接用上游版本覆盖，否则会丢失 Horspowers 的差异化能力。

## 4.2 本地 Codex 现状

当前 Codex 相关文件仍然围绕旧模式组织：

- `.codex/INSTALL.md` 仍使用 `AGENTS.md + bootstrap` 模式
- `.codex/superpowers-bootstrap.md` 仍假设 `Task` 子代理在 Codex 中不可用
- `.codex/superpowers-codex` 仍作为主技能入口
- `docs/README.codex.md` 仍在介绍 `find-skills / use-skill / bootstrap`

这套模型与当前 Codex 的原生 skills 发现机制不一致，也与本地实际可用的 `spawn_agent / wait_agent / close_agent / update_plan` 能力不一致。

## 4.3 Hooks 与命名差异

本地与上游在以下方面已经分叉：

- `hooks/` 执行方式
- `session-start` 包装方式
- `superpowers` 到 `horspowers` 的命名迁移
- 文档目录与配置文件命名

因此 `hooks/` 和安装文档都应采用“行为级吸收”，而不是整文件替换。

---

## 5. 设计决策

## 5.1 总体同步策略

本次采用三种同步方式混合进行：

1. **手工融合**
   - 适用于 `skills/brainstorming/SKILL.md`
   - 适用于 `skills/using-horspowers/SKILL.md`
   - 适用于 `.codex/INSTALL.md`、`docs/README.codex.md`

2. **按最终文件状态引入**
   - 适用于 `skills/brainstorming/scripts/*`
   - 适用于 `skills/brainstorming/visual-companion.md`
   - 适用于 `skills/brainstorming/spec-document-reviewer-prompt.md`
   - 适用于 `tests/brainstorm-server/*`

3. **选择性 pick 小修复**
   - 仅适用于局部、低耦合、不会覆盖本地语义的修复
   - 本次前两阶段不依赖该方式

## 5.2 Brainstorming 目标状态

Horspowers 的 `brainstorming` 应保留本地文档/配置体系，同时吸收上游以下行为：

1. 在任何实施动作前必须先完成设计并获得批准
2. 对大范围需求先做拆分，再对单个子问题开展 brainstorming
3. 在设计文档落盘后执行一次轻量级 spec self-review
4. 在进入 `writing-plans` 前增加 user review gate
5. 对视觉问题提供 visual companion，可按题目粒度启用

### 明确保留的本地行为

1. 中文触发描述
2. `.horspowers-config.yaml` 和 `documentation.enabled` 流程
3. 与本地 `docs/` 体系的集成
4. 本地的设计文档命名与目录习惯

### 明确不直接照搬的上游行为

1. 上游 `docs/superpowers/specs/...` 路径
2. 上游 `using-superpowers` 的原样文本
3. 对本地文档系统不兼容的固定措辞

## 5.3 Brainstorm Server 目标状态

将 visual companion 及 server 以 Horspowers 方式落地：

1. 技能文件位于 `skills/brainstorming/`
2. server 运行脚本位于 `skills/brainstorming/scripts/`
3. 保留对 Codex 的前台运行说明
4. 使用 Horspowers 自己的持久化目录命名

### 目录命名决策

上游默认将持久化目录写入 `.superpowers/brainstorm/`。  
Horspowers 应改为：

- `.horspowers/brainstorm/`

原因：

1. 与项目命名一致
2. 与已有配置/文档命名保持统一
3. 避免在 fork 中继续生成上游品牌目录

## 5.4 Codex 目标状态

Codex 方向的最终目标是：

1. Codex 通过原生 skills discovery 发现 Horspowers
2. `Skill` 语义不再依赖 shell 包装器作为主入口
3. `TodoWrite`、`Task`、命名子代理等在 Codex 中有明确、正确的映射说明
4. 旧 bootstrap/CLI 仍可保留作为兼容入口，但不再是主路径

### Codex 行为决策

1. **主路径**
   - `~/.agents/skills/horspowers -> <repo>/skills`
   - Codex 重启后自动发现 skills

2. **兼容路径**
   - 继续保留 `.codex/superpowers-codex`
   - 继续保留 `.codex/superpowers-bootstrap.md`
   - 文档中明确其为迁移/兼容方案，而非推荐方案

3. **子代理映射**
   - 不再使用“Codex 不支持子代理”的旧说法
   - 改为说明 `spawn_agent / wait_agent / close_agent` 的使用方式
   - 命名 agent 类型采用“读取 prompt 文件 + 构造 worker message”方式适配

---

## 6. 文件级实施方案

## 6.1 第一阶段：Codex 最小可用闭环

### 需要修改/新增的文件

1. `.codex/INSTALL.md`
   - 改为原生 discovery 优先
   - 保留 bootstrap 迁移说明
   - 改为 Horspowers 命名和仓库地址

2. `docs/README.codex.md`
   - 改写为 Horspowers for Codex
   - 说明原生安装、迁移、工具映射、子代理适配

3. `skills/using-horspowers/SKILL.md`
   - 增加 Codex 专节
   - 明确 skills 原生发现与工具映射原则

4. `skills/using-horspowers/references/codex-tools.md`
   - 新增或补齐
   - 参考上游 `skills/using-superpowers/references/codex-tools.md`
   - 改为 Horspowers 语义与当前 Codex 能力

### 验收标准

1. 文档中不再把 bootstrap 作为主入口
2. 文档中不再声称 Codex 无法使用子代理
3. Codex 用户能按文档把 skills 挂载到 `~/.agents/skills/`
4. `using-horspowers` 对 Codex 的规则是明确且自洽的

## 6.2 第二阶段：Brainstorming 流程融合

### 需要修改的文件

1. `skills/brainstorming/SKILL.md`

### 目标改动

1. 增加 hard-gate
2. 增加大范围需求先拆解逻辑
3. 增加 spec self-review
4. 增加 user review gate
5. 引入 visual companion offer 规则
6. 保留本地文档驱动与中文说明

### 验收标准

1. 不会在设计前直接进入实现
2. 复杂需求能先拆解再规划
3. 设计文档写出后会先自检、再请用户确认
4. 与 Horspowers 文档系统不冲突

## 6.3 第三阶段：Visual Companion / Server 引入

### 需要新增/修改的文件

1. `skills/brainstorming/visual-companion.md`
2. `skills/brainstorming/spec-document-reviewer-prompt.md`
3. `skills/brainstorming/scripts/frame-template.html`
4. `skills/brainstorming/scripts/helper.js`
5. `skills/brainstorming/scripts/server.cjs`
6. `skills/brainstorming/scripts/start-server.sh`
7. `skills/brainstorming/scripts/stop-server.sh`
8. `tests/brainstorm-server/*`

### 本地适配要求

1. 路径中的 `.superpowers/` 改为 `.horspowers/`
2. 文案中的 `superpowers` 改为 `horspowers`
3. Codex 启动说明保留前台模式逻辑
4. 如果 README / `.gitignore` 需要提示，则在后续阶段补齐

### 验收标准

1. 可在项目目录下启动 brainstorm server
2. 可生成并持久化视觉会话状态
3. Codex 场景下不会因为后台进程被回收而立即失效
4. 用户可通过终端 + 浏览器组合完成视觉 brainstorming

---

## 7. 实施顺序

建议按以下顺序开发：

1. **Codex 最小闭环**
   - 先保证 Horspowers 能在 Codex 中被原生发现并正确理解工具映射

2. **Brainstorming 主流程**
   - 再把 hard-gate、spec review、user review gate 融进现有 brainstorming

3. **Visual Companion / Server**
   - 最后引入可视化能力和配套测试

原因：

1. Codex 适配是后续开发能否顺畅进行的前提
2. Brainstorming 主流程改动集中在一个文件，适合先稳定语义
3. Server 是附加能力，范围独立，放在后面更容易验证

---

## 8. 风险与控制

## 8.1 风险

1. `skills/brainstorming/SKILL.md` 语义过重，稍有不慎会打断本地文档工作流
2. Codex 文档迁移如果过于激进，可能让老用户失去 bootstrap 使用路径
3. Brainstorm server 的路径与平台差异容易引入跨平台问题
4. 上游文本直接复制过多会带入不适合 Horspowers 的命名或目录假设

## 8.2 控制策略

1. 对主技能文件采用手工改写，不直接覆盖
2. 对独立 server 文件采用“引入后再改名/改路径”的策略
3. 旧 bootstrap 先保留，待原生路径验证稳定后再评估下线
4. 每阶段结束后做定向验证，而不是攒一大批改动后统一测试

---

## 9. 本次开发的直接依据

当前 worktree 中后续开发应遵循以下原则：

1. 不追求与上游提交级一致，只追求能力级一致
2. 优先保持 Horspowers 的中文化、文档系统、配置系统完整
3. 先完成 Codex 原生可用，再继续扩展 brainstorming server
4. 只有局部低耦合修复才考虑直接 `cherry-pick`

---

## 10. 下一步实施建议

文档落地后，按以下顺序立即开始开发：

1. 修改 `.codex/INSTALL.md`
2. 修改 `docs/README.codex.md`
3. 新增 `skills/using-horspowers/references/codex-tools.md`
4. 更新 `skills/using-horspowers/SKILL.md`
5. 修改 `skills/brainstorming/SKILL.md`
6. 引入 `skills/brainstorming/scripts/*` 与相关测试

该顺序兼顾了“先让我在 Codex 里直接用起来”和“再逐步获得 brainstorming 新能力”两个目标。
