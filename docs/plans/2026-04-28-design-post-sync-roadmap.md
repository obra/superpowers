# Horspowers 上游后续特性吸收路线设计

**设计时间**: 2026-04-28
**状态**: 设计完成，待评审
**适用分支**: `codex/upstream-brainstorm-codex-sync`

---

## 1. 背景

在当前分支中，Horspowers 已完成对上游两条关键能力的本地化吸收：

1. `brainstorming` 工作流增强
2. Codex 原生适配与技能发现

本轮的目标不是继续横向扩展客户端支持，也不是接入 Codex marketplace，而是在保持 **Claude Code + Codex** 双客户端可维护的前提下，继续吸收上游对日常使用体验真正有帮助的后续特性。

用户已明确：

1. 暂不考虑 `Cursor / OpenCode / Codex marketplace` 等分发与多宿主维护能力
2. 可以继续参考以下三类上游演进：
   - 工作流优化
   - 文档审查与测试体系
   - Visual Companion / brainstorm server

---

## 2. 设计目标

### 2.1 目标

1. 按优先级分轮次吸收上游后续能力，避免一次性大范围改造
2. 每一轮都能独立验证、独立提交、独立回归
3. 保持 Horspowers 现有的中文化、文档驱动、本地命名和测试体系
4. 优先强化实际高频使用路径，而不是先做展示性能力

### 2.2 非目标

1. 不引入新的长期维护客户端
2. 不接入 Codex marketplace / 插件分发链路
3. 不在本轮实现 Claude Agent Teams 或 Codex 原生 agent orchestration 深度对接
4. 不把 visual companion 强制变成 brainstorming 的默认路径

---

## 3. 可参考的上游后续能力

## 3.1 工作流优化

### A. SDD 不再周期性停顿

关键提交：

- `49bcb34` fix: prevent subagent-driven-development from pausing every 3 tasks

价值：

1. 直接改善长流程执行体验
2. 降低用户在复杂任务中的人工干预频率
3. 与当前已完成的 Claude/Codex 兼容工作天然衔接

### B. Worktree detect-and-defer / rototill

关键提交：

- `4652e65` feat: rewrite using-git-worktrees with detect-and-defer
- `79fee93` docs: add worktree rototill design spec
- `c6d66a0` docs: add worktree rototill implementation plan
- `4c49406` fix: remove incorrect hooks symlink step from worktree skill

价值：

1. 更稳地处理已有 worktree、脏工作树和延后决策场景
2. 更适合长期以 worktree 驱动的分支开发方式
3. 对 Claude/Codex 都是宿主无关的底层收益

## 3.2 文档审查与测试体系

### A. 文档审查系统

关键文件/能力：

- `skills/brainstorming/spec-document-reviewer-prompt.md`
- `skills/writing-plans/plan-document-reviewer-prompt.md`
- `tests/claude-code/test-document-review-system.sh`

价值：

1. 让 `brainstorming -> design/spec -> writing-plans` 形成更完整的质量闭环
2. 在进入实施前，提前抓出 TODO、占位符、延后定义、细节失衡等问题
3. 与 Horspowers 的文档驱动开发模型高度契合

### B. 宿主相关测试继续分层

上游在以下方向持续扩充了测试面：

- `tests/claude-code/*`
- `tests/brainstorm-server/*`
- `tests/opencode/*`
- `tests/codex-plugin-sync/*`

本项目不需要全部照搬，但可以参考其“每引入一个新能力，就补宿主相关验证”的组织方式。

## 3.3 Visual Companion / Brainstorm Server

### A. Visual Companion

关键文件：

- `skills/brainstorming/visual-companion.md`

价值：

1. 让 brainstorming 在需要时支持浏览器辅助选择
2. 对界面草图、布局比较、流程图、视觉层级等问题更直观
3. 可以作为可选能力，不强迫每次设计都进入视觉链路

### B. Zero-dep Brainstorm Server

关键文件/方向：

- `skills/brainstorming/scripts/server.cjs`
- `start-server.sh`
- `stop-server.sh`
- `tests/brainstorm-server/*`

关键演进点：

1. owner PID 生命周期管理
2. content/state 分离目录
3. Windows / Codex 前台运行兼容
4. stop-server 可靠性与自动退出机制

价值：

1. 避免 visual companion 成为“能演示但不稳定”的能力
2. 将视觉链路变成真正可维护的开发能力

---

## 4. 路线方案对比

## 4.1 方案 A：严格串行逐轮实施

顺序：

1. 工作流优化
2. 文档审查与测试体系
3. Visual Companion

优点：

1. 范围清晰
2. 每轮回归边界明确
3. 问题定位最简单

缺点：

1. 整体周期较长
2. 后续轮次可能发现前一轮缺少轻量预埋接口

## 4.2 方案 B：逐轮实施，但允许前置轮次做轻量预埋

顺序同方案 A，但允许：

1. 第 1 轮为第 2/3 轮保留少量接口或抽象位
2. 不提前交付第 2/3 轮功能，只做低成本兼容设计

优点：

1. 保持逐轮清晰边界
2. 降低后续返工概率
3. 更适合当前已有的本地化改造节奏

缺点：

1. 第 1 轮设计需要更克制，避免预埋过度

## 4.3 方案 C：视觉链路提前打样

顺序：

1. Visual Companion / Server
2. 工作流优化
3. 文档审查与测试体系

优点：

1. 新能力可见性最高

缺点：

1. 最偏离当前最高频使用路径
2. 最容易把范围做大
3. 风险最高

---

## 5. 最终设计决策

采用 **方案 B：逐轮实施，但允许前置轮次做轻量预埋**。

原因：

1. 用户已明确接受“每一类单独一轮”的推进方式
2. 当前最值得优先强化的是高频主路径，不是视觉链路
3. 第 2/3 轮与第 1 轮存在轻量抽象关联，完全不预埋会增加返工
4. 预埋应严格限制在“后续兼容点”，不能提前实现后续功能

---

## 6. 三轮实施设计

## 6.1 第 1 轮：工作流优化

### 目标

先提升日常最高频使用的执行链路体验。

### 范围

1. 参考上游修复 `subagent-driven-development` 的无谓停顿问题
2. 参考上游 `using-git-worktrees` 的 `detect-and-defer / rototill` 思路
3. 同步补足对应测试

### 明确包含

1. `skills/subagent-driven-development/*` 的工作流调整
2. `skills/using-git-worktrees/SKILL.md` 的本地化重构
3. Claude/Codex 相关测试补强

### 明确不包含

1. 文档审查 prompt 的接入
2. visual companion
3. brainstorm server

### 允许的轻量预埋

1. 为后续 reviewer/document hooks 预留稳定的调用点
2. 为后续 visual companion 留下不侵入主流程的扩展位

## 6.2 第 2 轮：文档审查与测试体系

### 目标

把文档驱动开发链路补成闭环。

### 范围

1. 引入 spec document reviewer 的本地化版本
2. 引入 plan document reviewer 的本地化版本
3. 接入 Horspowers 的 `docs/plans` 与现有文档体系
4. 为 reviewer 行为补测试

### 明确包含

1. `brainstorming` 落盘文档后的 spec self-review / review gate 强化
2. `writing-plans` 阶段的计划文档审查
3. Claude/Codex 文档审查集成测试

### 明确不包含

1. Visual Companion UI
2. Brainstorm server 生命周期改造

## 6.3 第 3 轮：Visual Companion

### 目标

将 brainstorming 的视觉协作能力以可选形式接入 Horspowers。

### 范围

1. 引入 visual-companion 指南
2. 引入 zero-dep brainstorm server
3. 做 Horspowers 目录命名本地化
4. 带上跨平台生命周期与测试

### 明确包含

1. `skills/brainstorming/visual-companion.md`
2. `skills/brainstorming/scripts/*`
3. `tests/brainstorm-server/*`
4. `.horspowers/brainstorm/` 本地持久化目录方案

### 明确不包含

1. 强制所有 brainstorming 都打开浏览器
2. 以视觉链路替代纯文本设计流程

---

## 7. 后续待办（不进入当前三轮）

## 7.1 SDD 深度对接宿主原生多代理能力

后续单独设计，不纳入当前三轮实施：

1. `subagent-driven-development` 真正驱动 Claude 的 Agent Teams 能力
2. `subagent-driven-development` 真正对接 Codex 的原生 agent / subagent 能力
3. 将当前“prompt/workflow 层模拟”进一步升级为“宿主能力感知型调度层”

原因：

1. 这会改动调度抽象，不适合混入本轮工作流小优化
2. 它依赖对宿主工具能力边界的重新建模
3. 一旦实施，测试面会显著扩大，应作为独立设计与计划

建议后续命名：

- `docs/plans/YYYY-MM-DD-design-sdd-native-agent-orchestration.md`

---

## 8. 风险与控制

## 8.1 风险

1. 第 1 轮预埋过度，导致范围膨胀
2. 第 2 轮 reviewer 机制与本地文档系统耦合过深
3. 第 3 轮 visual server 引入平台相关不稳定性

## 8.2 控制策略

1. 每轮都限制目标，只提交本轮能力
2. 每轮都补对应宿主测试，不把验证留到最后
3. Visual Companion 单独一轮，避免影响前两轮主线稳定性

---

## 9. 下一步

基于本设计，下一步应进入：

1. **第 1 轮：工作流优化实施计划**
2. 由 `writing-plans` 技能拆成可执行任务

在进入实施前，先由用户审阅本设计文档；若方向无误，再进入第 1 轮计划编写。
