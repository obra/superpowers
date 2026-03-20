# 测试反模式

**在以下情况下参考本文：** 编写或修改测试时、添加模拟对象时、或忍不住想在生产代码中添加仅供测试的方法时。

## 概述

测试必须验证真实行为，而非模拟行为。模拟对象是用于隔离的手段，而非被测试的对象。

**核心原则：** 测试代码做了什么，而非模拟对象做了什么。

**遵循严格的测试驱动开发可以防止这些反模式。**

## 铁律

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## 反模式 1：测试模拟行为

**违规情况：**

```typescript
// ❌ BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**错误原因：**

* 你验证的是模拟对象是否工作，而非组件是否工作
* 测试在模拟对象存在时通过，不存在时失败
* 无法提供任何关于真实行为的信息

**你的人类伙伴的纠正：** "我们是在测试模拟对象的行为吗？"

**修复方法：**

```typescript
// ✅ GOOD: Test real component or don't mock it
test('renders sidebar', () => {
  render(<Page />);  // Don't mock sidebar
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// OR if sidebar must be mocked for isolation:
// Don't assert on the mock - test Page's behavior with sidebar present
```

### 门控函数

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real component behavior or just mock existence?"

  IF testing mock existence:
    STOP - Delete the assertion or unmock the component

  Test real behavior instead
```

## 反模式 2：生产代码中的仅供测试方法

**违规情况：**

```typescript
// ❌ BAD: destroy() only used in tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... cleanup
  }
}

// In tests
afterEach(() => session.destroy());
```

**错误原因：**

* 生产类被仅供测试的代码污染
* 如果在生产中意外调用会很危险
* 违反了 YAGNI 原则和关注点分离
* 混淆了对象生命周期与实体生命周期

**修复方法：**

```typescript
// ✅ GOOD: Test utilities handle test cleanup
// Session has no destroy() - it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

### 门控函数

```
BEFORE adding any method to production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Don't add it
    Put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## 反模式 3：在不理解的情况下模拟

**违规情况：**

```typescript
// ❌ BAD: Mock breaks test logic
test('detects duplicate server', () => {
  // Mock prevents config write that test depends on!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw - but won't!
});
```

**错误原因：**

* 被模拟的方法具有测试所依赖的副作用（例如写入配置）
* 过度模拟以"确保安全"会破坏实际行为
* 测试因错误原因通过或神秘地失败

**修复方法：**

```typescript
// ✅ GOOD: Mock at correct level
test('detects duplicate server', () => {
  // Mock the slow part, preserve behavior test needs
  vi.mock('MCPServerManager'); // Just mock slow server startup

  await addServer(config);  // Config written
  await addServer(config);  // Duplicate detected ✓
});
```

### 门控函数

```
BEFORE mocking any method:
  STOP - Don't mock yet

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at lower level (the actual slow/external operation)
    OR use test doubles that preserve necessary behavior
    NOT the high-level method the test depends on

  IF unsure what test depends on:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking without understanding the dependency chain
```

## 反模式 4：不完整的模拟

**违规情况：**

```typescript
// ❌ BAD: Partial mock - only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

**错误原因：**

* **部分模拟隐藏了结构假设** - 你只模拟了你知道的字段
* **下游代码可能依赖于你未包含的字段** - 导致静默失败
* **测试通过但集成失败** - 模拟不完整，真实 API 完整
* **虚假的信心** - 测试无法证明任何关于真实行为的信息

**铁律：** 模拟现实中存在的**完整**数据结构，而不仅仅是你当前测试使用的字段。

**修复方法：**

```typescript
// ✅ GOOD: Mirror real API completeness
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // All fields real API returns
};
```

### 门控函数

```
BEFORE creating mock responses:
  Check: "What fields does the real API response contain?"

  Actions:
    1. Examine actual API response from docs/examples
    2. Include ALL fields system might consume downstream
    3. Verify mock matches real response schema completely

  Critical:
    If you're creating a mock, you must understand the ENTIRE structure
    Partial mocks fail silently when code depends on omitted fields

  If uncertain: Include all documented fields
```

## 反模式 5：集成测试作为事后补救

**违规情况：**

```
✅ Implementation complete
❌ No tests written
"Ready for testing"
```

**错误原因：**

* 测试是实施的一部分，而非可选的后续步骤
* 测试驱动开发本应发现此问题
* 没有测试就不能声称完成

**修复方法：**

```
TDD cycle:
1. Write failing test
2. Implement to pass
3. Refactor
4. THEN claim complete
```

## 当模拟变得过于复杂时

**警告信号：**

* 模拟设置比测试逻辑更长
* 模拟一切以使测试通过
* 模拟缺少真实组件拥有的方法
* 模拟更改时测试中断

**你的人类伙伴的问题：** "我们真的需要在这里使用模拟吗？"

**考虑：** 使用真实组件的集成测试通常比复杂的模拟更简单

## 测试驱动开发防止这些反模式

**测试驱动开发为何有效：**

1. **先写测试** → 迫使你思考实际要测试什么
2. **观察它失败** → 确认测试的是真实行为，而非模拟
3. **最小实现** → 防止仅供测试的方法混入
4. **真实依赖** → 在模拟之前，你能看到测试实际需要什么

**如果你在测试模拟行为，你就违反了测试驱动开发** - 你在没有先观察测试对真实代码失败的情况下就添加了模拟。

## 快速参考

| 反模式 | 修复方法 |
|--------------|-----|
| 断言模拟元素 | 测试真实组件或取消模拟 |
| 生产代码中的仅供测试方法 | 移至测试工具类 |
| 不理解就模拟 | 先理解依赖关系，最小化模拟 |
| 不完整的模拟 | 完全镜像真实 API |
| 测试作为事后补救 | 测试驱动开发 - 测试先行 |
| 过度复杂的模拟 | 考虑集成测试 |

## 危险信号

* 断言检查 `*-mock` 测试 ID
* 仅在测试文件中调用的方法
* 模拟设置占测试的 50% 以上
* 移除模拟时测试失败
* 无法解释为何需要模拟
* 模拟"只是为了安全"

## 底线

**模拟对象是用于隔离的工具，而非要测试的东西。**

如果测试驱动开发揭示你正在测试模拟行为，那你就做错了。

修复方法：测试真实行为，或者质疑你为何要使用模拟。
