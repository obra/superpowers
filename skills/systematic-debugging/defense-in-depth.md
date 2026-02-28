# 纵深防御验证

## 概述

当你修复了由无效数据引起的 bug 时，在一个地方添加验证似乎就够了。但单个检查可以被不同的代码路径、重构或 mock 绕过。

**核心原则：** 在数据经过的每一层都进行验证。使 bug 在结构上变得不可能。

## 为什么需要多层

单层验证："我们修复了这个 bug"
多层验证："我们使这个 bug 变得不可能"

不同的层捕获不同的情况：
- 入口验证捕获大多数 bug
- 业务逻辑捕获边缘情况
- 环境守卫防止特定上下文中的危险
- 调试日志在其他层失效时提供帮助

## 四个层级

### 第1层：入口点验证
**目的：** 在 API 边界拒绝明显无效的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory 不能为空');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory 不存在: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory 不是一个目录: ${workingDirectory}`);
  }
  // ... 继续
}
```

### 第2层：业务逻辑验证
**目的：** 确保数据对此操作有意义

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('工作区初始化需要 projectDir');
  }
  // ... 继续
}
```

### 第3层：环境守卫
**目的：** 防止在特定上下文中执行危险操作

```typescript
async function gitInit(directory: string) {
  // 在测试中，拒绝在临时目录之外执行 git init
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `测试期间拒绝在临时目录之外执行 git init: ${directory}`
      );
    }
  }
  // ... 继续
}
```

### 第4层：调试插桩
**目的：** 为问题取证捕获上下文

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('即将执行 git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... 继续
}
```

## 应用此模式

当你发现 bug 时：

1. **追踪数据流** - 错误值从哪里产生？在哪里使用？
2. **列出所有检查点** - 列出数据经过的每个点
3. **在每一层添加验证** - 入口、业务、环境、调试
4. **测试每一层** - 尝试绕过第1层，验证第2层是否能捕获

## 会话中的示例

Bug：空的 `projectDir` 导致在源代码中执行 `git init`

**数据流：**
1. 测试设置 → 空字符串
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 在 `process.cwd()` 中运行

**添加的四个层级：**
- 第1层：`Project.create()` 验证非空/存在/可写
- 第2层：`WorkspaceManager` 验证 projectDir 非空
- 第3层：`WorktreeManager` 在测试中拒绝在临时目录之外执行 git init
- 第4层：在 git init 之前记录堆栈跟踪

**结果：** 全部1847个测试通过，bug 无法复现

## 关键洞察

所有四个层级都是必需的。在测试过程中，每一层都捕获了其他层遗漏的 bug：
- 不同的代码路径绕过了入口验证
- Mock 绕过了业务逻辑检查
- 不同平台上的边缘情况需要环境守卫
- 调试日志识别了结构性误用

**不要在一个验证点就停下。** 在每一层都添加检查。
