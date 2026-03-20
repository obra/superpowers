# 基于用户反馈的技能改进

**日期：** 2025-11-28
**状态：** 草案
**来源：** 两个 Claude 实例在实际开发场景中使用 superpowers

***

## 执行摘要

两个 Claude 实例提供了来自实际开发会话的详细反馈。他们的反馈揭示了当前技能中存在的**系统性缺陷**，这些缺陷导致可预防的 bug 在遵循技能的情况下仍然被发布。

**关键洞察：** 这些都是问题报告，而不仅仅是解决方案提议。问题是真实存在的；解决方案需要仔细评估。

**关键主题：**

1. **验证缺口** - 我们验证操作成功，但不验证它们是否达到了预期结果
2. **流程卫生** - 后台进程累积并在子代理之间产生干扰
3. **上下文优化** - 子代理获取了太多无关信息
4. **缺少自我反思** - 在移交前没有提示来批判自己的工作
5. **模拟安全** - 模拟可能偏离接口而无法被检测到
6. **技能激活** - 技能存在但未被阅读/使用

***

## 已识别的问题

### 问题 1：配置变更验证缺口

**发生了什么：**

* 子代理测试了“OpenAI 集成”
* 设置了 `OPENAI_API_KEY` 环境变量
* 收到了状态 200 的响应
* 报告“OpenAI 集成工作正常”
* **但是** 响应包含 `"model": "claude-sonnet-4-20250514"` - 实际上使用的是 Anthropic

**根本原因：**
`verification-before-completion` 检查操作是否成功，但不检查结果是否反映了预期的配置变更。

**影响：** 高 - 对集成测试产生虚假信心，bug 发布到生产环境

**示例失败模式：**

* 切换 LLM 提供商 → 验证状态 200 但不检查模型名称
* 启用功能标志 → 验证无错误但不检查功能是否激活
* 更改环境 → 验证部署成功但不检查环境变量

***

### 问题 2：后台进程累积

**发生了什么：**

* 会话期间分派了多个子代理
* 每个子代理都启动了后台服务器进程
* 进程累积（4 个以上服务器在运行）
* 过时的进程仍然绑定到端口
* 后来的端到端测试命中了配置错误的陈旧服务器
* 导致混淆/不正确的测试结果

**根本原因：**
子代理是无状态的 - 不知道先前子代理的进程。没有清理协议。

**影响：** 中-高 - 测试命中错误的服务器，虚假通过/失败，调试混淆

***

### 问题 3：子代理提示中的上下文膨胀

**发生了什么：**

* 标准方法：给子代理完整的计划文件阅读
* 实验：只给任务 + 模式 + 文件 + 验证命令
* 结果：更快、更专注、单次尝试完成更常见

**根本原因：**
子代理在无关的计划部分浪费了令牌和注意力。

**影响：** 中 - 执行速度慢，更多失败尝试

**有效的方法：**

```
You are adding a single E2E test to packnplay's test suite.

**Your task:** Add `TestE2E_FeaturePrivilegedMode` to `pkg/runner/e2e_test.go`

**What to test:** A local devcontainer feature that requests `"privileged": true`
in its metadata should result in the container running with `--privileged` flag.

**Follow the exact pattern of TestE2E_FeatureOptionValidation** (at the end of the file)

**After writing, run:** `go test -v ./pkg/runner -run TestE2E_FeaturePrivilegedMode -timeout 5m`
```

***

### 问题 4：移交前无自我反思

**发生了什么：**

* 添加了自我反思提示：“用新的眼光审视你的工作 - 哪些地方可以做得更好？”
* 任务 5 的实施者识别出测试失败是由于实现 bug，而不是测试 bug
* 追溯到第 99 行：`strings.Join(metadata.Entrypoint, " ")` 创建了无效的 Docker 语法
* 如果没有自我反思，只会报告“测试失败”而不说明根本原因

**根本原因：**
实施者在报告完成前，不会自然地退一步批判自己的工作。

**影响：** 中 - 实施者本可以发现的 bug 被移交给审查者

***

### 问题 5：模拟-接口漂移

**发生了什么：**

```typescript
// Interface defines close()
interface PlatformAdapter {
  close(): Promise<void>;
}

// Code (BUGGY) calls cleanup()
await adapter.cleanup();

// Mock (MATCHES BUG) defines cleanup()
vi.mock('web-adapter', () => ({
  WebAdapter: vi.fn().mockImplementation(() => ({
    cleanup: vi.fn().mockResolvedValue(undefined),  // Wrong!
  })),
}));
```

* 测试通过
* 运行时崩溃：“adapter.cleanup is not a function”

**根本原因：**
模拟源自错误代码调用的内容，而非接口定义。TypeScript 无法捕获方法名错误的行内模拟。

**影响：** 高 - 测试给出虚假信心，运行时崩溃

**为什么测试反模式没有防止这种情况：**
该技能涵盖了测试模拟行为和在不理解的情况下进行模拟，但没有涵盖“从接口而非实现派生模拟”的具体模式。

***

### 问题 6：代码审查者文件访问

**发生了什么：**

* 分派了代码审查子代理
* 找不到测试文件：“该文件似乎不存在于仓库中”
* 文件实际存在
* 审查者不知道需要先显式读取它

**根本原因：**
审查者提示不包括显式的文件读取指令。

**影响：** 低-中 - 审查失败或不完整

***

### 问题 7：修复工作流延迟

**发生了什么：**

* 实施者在自我反思期间识别出 bug
* 实施者知道如何修复
* 当前工作流：报告 → 我分派修复者 → 修复者修复 → 我验证
* 额外的往返增加了延迟，但没有增加价值

**根本原因：**
当实施者已经诊断出问题时，实施者和修复者角色之间仍存在严格的分离。

**影响：** 低 - 延迟，但无正确性问题

***

### 问题 8：技能未被阅读

**发生了什么：**

* `testing-anti-patterns` 技能存在
* 无论是人类还是子代理在编写测试前都没有阅读它
* 本可以防止一些问题（虽然不是全部 - 参见问题 5）

**根本原因：**
没有强制要求子代理阅读相关技能。没有提示包含技能阅读。

**影响：** 中 - 如果不使用，技能投资就被浪费了

***

## 提议的改进

### 1. verification-before-completion: 添加配置变更验证

**添加新部分：**

```markdown
## 验证配置变更

测试配置、提供商、功能开关或环境变更时：

**不要仅验证操作成功。要验证输出反映了预期的变更。**

### 常见失败模式

操作成功是因为存在*某些*有效配置，但并非你打算测试的配置。

### 示例

| 变更 | 不充分的验证 | 必需的验证 |
|--------|-------------|----------|
| 切换LLM提供商 | 状态码200 | 响应包含预期的模型名称 |
| 启用功能开关 | 无错误 | 功能行为实际已激活 |
| 更改环境 | 部署成功 | 日志/变量引用新环境 |
| 设置凭据 | 身份验证成功 | 已验证的用户/上下文正确 |

### 门控函数
```

在声称配置变更有效之前：

1. 识别：此变更后，什么应该**不同**？
2. 定位：这种差异在哪里可以观察到？
   * 响应字段（模型名称，用户 ID）
   * 日志行（环境，提供商）
   * 行为（功能激活/未激活）
3. 运行：显示可观察差异的命令
4. 验证：输出包含预期的差异
5. 只有**在那之后**：声称配置变更有效

危险信号：

* “请求成功”但不检查内容
  * 检查状态码但不检查响应体
  * 验证无错误但不进行积极确认

````

**Why this works:**
Forces verification of INTENT, not just operation success.

---

### 2. subagent-driven-development: Add Process Hygiene for E2E Tests

**Add new section:**

```markdown
## Process Hygiene for E2E Tests

When dispatching subagents that start services (servers, databases, message queues):

### Problem

Subagents are stateless - they don't know about processes started by previous subagents. Background processes persist and can interfere with later tests.

### Solution

**Before dispatching E2E test subagent, include cleanup in prompt:**

````

在启动任何服务之前：

1. 终止现有进程：pkill -f "<service-pattern>" 2>/dev/null || true
2. 等待清理：sleep 1
3. 验证端口空闲：lsof -i :<port> && echo "ERROR: Port still in use" || echo "Port free"

测试完成后：

1. 终止你启动的进程
2. 验证清理：pgrep -f "<service-pattern>" || echo "Cleanup successful"

```

### Example

```

任务：运行 API 服务器的端到端测试

提示包括：
“在启动服务器之前：

* 终止任何现有服务器：pkill -f 'node.\*server.js' 2>/dev/null || true
* 验证端口 3001 空闲：lsof -i :3001 && exit 1 || echo 'Port available'

测试之后：

* 终止你启动的服务器
* 验证：pgrep -f 'node.\*server.js' || echo 'Cleanup verified'”

```

### Why This Matters

- Stale processes serve requests with wrong config
- Port conflicts cause silent failures
- Process accumulation slows system
- Confusing test results (hitting wrong server)
```

**权衡分析：**

* 给提示增加了样板代码
* 但防止了非常令人困惑的调试
* 对于端到端测试子代理来说是值得的

***

### 3. subagent-driven-development: 添加精简上下文选项

**修改步骤 2：使用子代理执行任务**

**之前：**

```
Read that task carefully from [plan-file].
```

**之后：**

```
## Context Approaches

**Full Plan (default):**
Use when tasks are complex or have dependencies:
```

仔细阅读 \[plan-file] 中的任务 N。

```

**Lean Context (for independent tasks):**
Use when task is standalone and pattern-based:
```

你正在实现：\[1-2 句任务描述]

要修改的文件：\[确切路径]
要遵循的模式：\[对现有函数/测试的引用]
要实现的内容：\[具体要求]
验证：\[要运行的精确命令]

\[请勿包含完整的计划文件]

```

**Use lean context when:**
- Task follows existing pattern (add similar test, implement similar feature)
- Task is self-contained (doesn't need context from other tasks)
- Pattern reference is sufficient (e.g., "follow TestE2E_FeatureOptionValidation")

**Use full plan when:**
- Task has dependencies on other tasks
- Requires understanding of overall architecture
- Complex logic that needs context
```

**示例：**

```
Lean context prompt:

"You are adding a test for privileged mode in devcontainer features.

File: pkg/runner/e2e_test.go
Pattern: Follow TestE2E_FeatureOptionValidation (at end of file)
Test: Feature with `"privileged": true` in metadata results in `--privileged` flag
Verify: go test -v ./pkg/runner -run TestE2E_FeaturePrivilegedMode -timeout 5m

Report: Implementation, test results, any issues."
```

**为什么这有效：**
减少令牌使用，提高专注度，在适当时更快完成。

***

### 4. subagent-driven-development: 添加自我反思步骤

**修改步骤 2：使用子代理执行任务**

**添加到提示模板：**

```
When done, BEFORE reporting back:

Take a step back and review your work with fresh eyes.

Ask yourself:
- Does this actually solve the task as specified?
- Are there edge cases I didn't consider?
- Did I follow the pattern correctly?
- If tests are failing, what's the ROOT CAUSE (implementation bug vs test bug)?
- What could be better about this implementation?

If you identify issues during this reflection, fix them now.

Then report:
- What you implemented
- Self-reflection findings (if any)
- Test results
- Files changed
```

**为什么这有效：**
在移交前捕获实施者自己能发现的 bug。有记录的案例：通过自我反思识别了入口点 bug。

**权衡：**
每个任务增加约 30 秒，但在审查前捕获问题。

***

### 5. requesting-code-review: 添加显式文件读取

**修改代码审查者模板：**

**在开头添加：**

```markdown
## 待审阅文件

开始分析前，请先阅读以下文件：

1. [列出差异中涉及的具体文件]
2. [被变更引用但未修改的文件]

使用 Read 工具加载每个文件。

如果找不到文件：
- 检查差异中提供的准确路径
- 尝试其他可能的位置
- 报告："无法定位 [路径] - 请确认文件是否存在"

在未实际阅读代码前，请勿继续审阅。
```

**为什么这有效：**
明确的指令防止“找不到文件”的问题。

***

### 6. testing-anti-patterns: 添加模拟-接口漂移反模式

**添加新的反模式 6：**

````markdown
## 反模式 6：从实现细节派生的模拟

**违规情况：**
```typescript
// 代码（有缺陷）调用了 cleanup()
await adapter.cleanup();

// 模拟（匹配缺陷）包含了 cleanup()
const mock = {
  cleanup: vi.fn().mockResolvedValue(undefined)
};

// 接口（正确）定义的是 close()
interface PlatformAdapter {
  close(): Promise<void>;
}
````

**为什么这是错误的：**

* 模拟将 bug 编码到测试中
* TypeScript 无法捕获方法名错误的行内模拟
* 测试通过是因为代码和模拟都是错误的
* 使用真实对象时运行时崩溃

**修复方法：**

```typescript
// ✅ GOOD: Derive mock from interface

// Step 1: Open interface definition (PlatformAdapter)
// Step 2: List methods defined there (close, initialize, etc.)
// Step 3: Mock EXACTLY those methods

const mock = {
  initialize: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),  // From interface!
};

// Now test FAILS because code calls cleanup() which doesn't exist
// That failure reveals the bug BEFORE runtime
```

### 门控函数

```
BEFORE writing any mock:

  1. STOP - Do NOT look at the code under test yet
  2. FIND: The interface/type definition for the dependency
  3. READ: The interface file
  4. LIST: Methods defined in the interface
  5. MOCK: ONLY those methods with EXACTLY those names
  6. DO NOT: Look at what your code calls

  IF your test fails because code calls something not in mock:
    ✅ GOOD - The test found a bug in your code
    Fix the code to call the correct interface method
    NOT the mock

  Red flags:
    - "I'll mock what the code calls"
    - Copying method names from implementation
    - Mock written without reading interface
    - "The test is failing so I'll add this method to the mock"
```

**检测：**

当你看到运行时错误“X 不是一个函数”而测试通过时：

1. 检查 X 是否被模拟
2. 比较模拟方法与接口方法
3. 寻找方法名不匹配

````

**Why this works:**
Directly addresses the failure pattern from feedback.

---

### 7. subagent-driven-development: Require Skills Reading for Test Subagents

**Add to prompt template when task involves testing:**

```markdown
BEFORE writing any tests:

1. Read testing-anti-patterns skill:
   Use Skill tool: superpowers:testing-anti-patterns

2. Apply gate functions from that skill when:
   - Writing mocks
   - Adding methods to production classes
   - Mocking dependencies

This is NOT optional. Tests that violate anti-patterns will be rejected in review.
````

**为什么这有效：**
确保技能实际被使用，而不仅仅是存在。

**权衡：**
每个任务增加时间，但防止了整类 bug。

***

### 8. subagent-driven-development: 允许实施者修复自我识别的问题

**修改步骤 2：**

**当前：**

```
Subagent reports back with summary of work.
```

**提议：**

```
Subagent performs self-reflection, then:

IF self-reflection identifies fixable issues:
  1. Fix the issues
  2. Re-run verification
  3. Report: "Initial implementation + self-reflection fix"

ELSE:
  Report: "Implementation complete"

Include in report:
- Self-reflection findings
- Whether fixes were applied
- Final verification results
```

**为什么这有效：**
当实施者已经知道修复方法时，减少延迟。有记录的案例：本可以为入口点 bug 节省一次往返。

**权衡：**
提示稍微复杂一些，但端到端速度更快。

***

## 实施计划

### 第一阶段：高影响，低风险（优先实施）

1. **verification-before-completion: 配置变更验证**
   * 清晰的补充，不改变现有内容
   * 解决高影响问题（测试中的虚假信心）
   * 文件：`skills/verification-before-completion/SKILL.md`

2. **testing-anti-patterns: 模拟-接口漂移**
   * 添加新反模式，不修改现有内容
   * 解决高影响问题（运行时崩溃）
   * 文件：`skills/testing-anti-patterns/SKILL.md`

3. **requesting-code-review: 显式文件读取**
   * 对模板的简单补充
   * 解决具体问题（审查者找不到文件）
   * 文件：`skills/requesting-code-review/SKILL.md`

### 第二阶段：中等变更（仔细测试）

4. **subagent-driven-development: 流程卫生**
   * 添加新部分，不改变工作流
   * 解决中-高影响问题（测试可靠性）
   * 文件：`skills/subagent-driven-development/SKILL.md`

5. **subagent-driven-development: 自我反思**
   * 更改提示模板（风险较高）
   * 但有记录表明能捕获 bug
   * 文件：`skills/subagent-driven-development/SKILL.md`

6. **subagent-driven-development: 技能阅读要求**
   * 增加提示开销
   * 但确保技能实际被使用
   * 文件：`skills/subagent-driven-development/SKILL.md`

### 第三阶段：优化（先验证）

7. **subagent-driven-development: 精简上下文选项**
   * 增加复杂性（两种方法）
   * 需要验证它不会引起混淆
   * 文件：`skills/subagent-driven-development/SKILL.md`

8. **subagent-driven-development: 允许实施者修复**
   * 更改工作流（风险较高）
   * 优化，而非 bug 修复
   * 文件：`skills/subagent-driven-development/SKILL.md`

***

## 开放性问题

1. **精简上下文方法：**
   * 对于基于模式的任务，我们应该将其设为默认吗？
   * 我们如何决定使用哪种方法？
   * 过于精简而遗漏重要上下文的风险？

2. **自我反思：**
   * 这会显著减慢简单任务的速度吗？
   * 是否只应应用于复杂任务？
   * 如何防止其变得机械而导致的“反思疲劳”？

3. **流程卫生：**
   * 这应该放在 subagent-driven-development 中，还是一个单独的技能里？
   * 它是否适用于端到端测试之外的其他工作流？
   * 如何处理进程**应该**持续存在的情况（开发服务器）？

4. **技能阅读强制要求：**
   * 我们应该要求**所有**子代理阅读相关技能吗？
   * 如何防止提示变得过长？
   * 过度文档化而失去焦点的风险？

***

## 成功指标

我们如何知道这些改进有效？

1. **配置验证：**
   * “测试通过但使用了错误配置”的实例为零
   * Jesse 不会说“那实际上并没有测试你认为它在测试的东西”

2. **流程卫生：**
   * “测试命中错误服务器”的实例为零
   * 端到端测试运行期间无端口冲突错误

3. **模拟接口漂移：**
   * 零出现“测试通过但运行时因缺少方法而崩溃”的情况
   * 模拟对象与接口之间不存在方法名不匹配

4. **自我反思：**
   * 可衡量性：执行者报告是否包含自我反思的发现？
   * 定性分析：进入代码审查阶段的缺陷是否减少？

5. **技能解读：**
   * 子代理报告引用技能门控函数
   * 代码审查中反模式违规情况减少

***

## 风险与应对措施

### 风险：提示膨胀

**问题：** 添加所有这些要求会使提示变得过于冗长
**应对措施：**

* 分阶段实施（不要一次性添加所有内容）
* 使部分附加要求成为条件性（端到端卫生仅适用于端到端测试）
* 考虑为不同任务类型设置模板

### 风险：分析瘫痪

**问题：** 过多的反思/验证会拖慢执行速度
**应对措施：**

* 保持门控函数快速执行（秒级，而非分钟级）
* 初始阶段将精简上下文设为可选功能
* 监控任务完成时间

### 风险：虚假安全感

**问题：** 遵循检查清单并不能保证正确性
**应对措施：**

* 强调门控函数是最低要求，而非最高标准
* 在技能描述中保留“运用判断力”的表述
* 说明技能旨在发现常见错误，而非所有错误

### 风险：技能分歧

**问题：** 不同技能给出相互矛盾的建议
**应对措施：**

* 审查所有技能的变更以确保一致性
* 记录技能间的协作方式（集成章节）
* 部署前通过真实场景进行测试

***

## 实施建议

**立即启动第一阶段：**

* 完成前验证：配置变更验证
* 测试反模式：模拟接口漂移检测
* 发起代码审查：显式文件读取要求

**与Jesse共同测试第二阶段后再定稿：**

* 获取关于自我反思影响的反馈
* 验证流程卫生方法的有效性
* 确认技能解读要求值得其额外开销

**暂缓实施第三阶段以待验证：**

* 精简上下文需经实际场景测试
* 执行者修复工作流变更需谨慎评估

这些改进措施针对用户记录的实际问题，同时最大限度降低了技能质量下降的风险。
