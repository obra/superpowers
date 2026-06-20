# 纵深防御验证

## 概述

当你修复一个由无效数据引起的缺陷时，在某一处添加验证似乎就足够了。但这一单一的检查可能会被不同的代码路径、重构或模拟所绕过。

**核心原则：** 在数据经过的**每一层**都进行验证。从结构上杜绝缺陷的发生。

## 为何需要多层验证

单一验证："我们修复了缺陷"
多层验证："我们使缺陷不可能发生"

不同层级能捕获不同情况：

* 入口验证捕获大多数缺陷
* 业务逻辑捕获边缘情况
* 环境防护防止特定上下文下的危险
* 调试日志在其他层级失效时提供帮助

## 四层防御

### 第一层：入口点验证

**目的：** 在 API 边界拒绝明显无效的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ... proceed
}
```

### 第二层：业务逻辑验证

**目的：** 确保数据对于该操作有意义

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ... proceed
}
```

### 第三层：环境防护

**目的：** 防止在特定上下文中执行危险操作

```typescript
async function gitInit(directory: string) {
  // In tests, refuse git init outside temp directories
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`
      );
    }
  }
  // ... proceed
}
```

### 第四层：调试插桩

**目的：** 为取证捕获上下文信息

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('About to git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

## 应用此模式

当你发现一个缺陷时：

1. **追踪数据流** - 不良值源于何处？在何处使用？
2. **映射所有检查点** - 列出数据经过的每一个点
3. **在每一层添加验证** - 入口、业务、环境、调试
4. **测试每一层** - 尝试绕过第 1 层，验证第 2 层能捕获它

## 会话示例

缺陷：空的 `projectDir` 导致源代码中的 `git init`

**数据流：**

1. 测试设置 → 空字符串
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 在 `process.cwd()` 中运行

**添加的四层防御：**

* 第一层：`Project.create()` 验证非空/存在/可写
* 第二层：`WorkspaceManager` 验证 projectDir 非空
* 第三层：`WorktreeManager` 在测试中拒绝在 tmpdir 之外进行 git init
* 第四层：在 git init 之前进行堆栈跟踪日志记录

**结果：** 所有 1847 个测试通过，缺陷无法复现

## 关键洞见

所有四层防御都是必要的。在测试过程中，每一层都捕获了其他层遗漏的缺陷：

* 不同的代码路径绕过了入口验证
* 模拟绕过了业务逻辑检查
* 不同平台上的边缘情况需要环境防护
* 调试日志识别了结构性的误用

**不要止步于一个验证点。** 在每一层都添加检查。
