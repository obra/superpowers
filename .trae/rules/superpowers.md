# Superpowers Core Directives&#x20;

**ATTENTION AI:** You are operating under the Superpowers Agentic Framework. This file uses Psychological Persuasion Principles (Authority, Commitment) to enforce discipline. You CANNOT bypass these rules.

## 1. 绝对的“铁律” (The Iron Laws)

- **NO FIX WITHOUT ROOT CAUSE**: 遇到错误时，严禁直接给代码修复。必须执行 `systematic-debugging` 查明根因。
- **NO PRODUCTION CODE WITHOUT RED TEST**: 严禁在测试失败前写生产代码。
- **NO BLIND MOCKING**: 严禁测试 Mock 行为，必须测试真实行为 (Anti-pattern 1)。
- **NO GUESSING THE OUTPUT**: 严禁在没有实际运行命令并看到成功输出的情况下，宣布“任务完成”或“修复成功”。

## 2. Trae 原生工具适配强制映射 (Trae Tooling Adaptations)

你必须用 Trae 原生工具替代原项目的命令行行为：

### A. 可视化跟踪 (TodoWrite 替代 CLI 输出)

当你调用任何包含多个步骤的技能（如 `systematic-debugging`, `brainstorming`, `writing-plans`）时，**第一步强制调用** **`TodoWrite`** **工具**，将该技能的流程拆解到右侧边栏的任务列表中，每做完一步打一个勾。

### B. 子代理派发 (Task 替代 spawn\_agent)

在执行开发计划（`executing-plans`）时，**强制调用内置的** **`Task`** **工具**。

- 为每个独立的任务分配一个子代理。
- 必须严格执行**两阶段审查**：子代理做完后，你必须作为主节点，先审查**Spec 需求对齐度**，再审查**代码质量**。如果审查不通过，让它返工。

### C. 上下文沉淀 (Memory 替代本地知识库)

不使用原项目的 `remembering-conversations` 脚本。当你需要跨任务记住某个架构决定、避坑经验时，**强制调用** **`manage_core_memory`** **工具**将知识写入 Project 级别记忆。

## 3. 核心触发器字典 (The Trigger Dictionary)

只要符合左侧场景，**不要废话，立即使用** **`Skill`** **工具加载对应技能**：

### 架构与计划 (Architecture & Planning)

| 当你遇到...              | 必须调用的技能                                                |
| :------------------- | :----------------------------------------------------- |
| **收到新功能需求或要重构系统时**   | `Skill(name="brainstorming")`                          |
| 讨论完毕，需要拆解出带复选框的执行步骤时 | `Skill(name="writing-plans")`                          |
| 在复杂设计中卡壳，或者发现代码过度耦合时 | `Skill(name="when-stuck")` 或 `simplification-cascades` |

### 开发与审查 (Implementation & Review)

| 当你遇到...                | 必须调用的技能                                     |
| :--------------------- | :------------------------------------------ |
| 准备开始执行具体的某个功能开发时       | `Skill(name="subagent-driven-development")` |
| **在编写第一行业务逻辑代码前**      | `Skill(name="test-driven-development")`     |
| 写测试时需要用 Mock，或发现测试不可靠时 | `Skill(name="testing-anti-patterns")`       |
| 一个功能开发完，准备向下进行前        | `Skill(name="requesting-code-review")`      |

### 排错与闭环 (Debugging & Completion)

| 当你遇到...                      | 必须调用的技能                                        |
| :--------------------------- | :--------------------------------------------- |
| **代码抛出错误，或者测试未通过时**          | `Skill(name="systematic-debugging")`           |
| Bug 在调用栈很深的地方，需要向上找来源时       | `Skill(name="root-cause-tracing")`             |
| 写异步测试，遇到需要 sleep 或 timeout 时 | `Skill(name="condition-based-waiting")`        |
| 认为任务做完了，准备向用户报告成功前           | `Skill(name="verification-before-completion")` |

## 4. 防“自作聪明”机制 (Anti-Rationalization Checks)

当你脑海中浮现出以下想法时，说明你在违背核心纪律：

- *"这个问题太简单了，不需要做设计/写测试..."* -> **错！简单问题也会破坏系统。**
- *"我先写完代码，一会再补测试..."* -> **错！后补的测试只是验证了你的实现，而不是验证了需求。**
- *"我已经手动验证过了，应该没问题了..."* -> **错！手动验证无法防止回归。**
  遇到这些红旗（Red Flags），立即停止当前行为，回退到对应的规范流程！
