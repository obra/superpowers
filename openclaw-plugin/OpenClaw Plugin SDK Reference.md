---
title: OpenClaw Plugin SDK Reference
date: 2026-03-24
tags:
  - openclaw
  - plugin
  - sdk
  - reference
status: reference
sources:
  - https://docs.openclaw.ai/plugins/sdk-overview
  - https://docs.openclaw.ai/plugins/sdk-entrypoints
  - https://docs.openclaw.ai/plugins/sdk-runtime
  - https://docs.openclaw.ai/plugins/sdk-setup
  - https://docs.openclaw.ai/plugins/sdk-testing
  - https://docs.openclaw.ai/plugins/manifest
  - https://docs.openclaw.ai/plugins/architecture
---

# OpenClaw Plugin SDK Reference

> 本文档整合自官方文档七个页面，涵盖 Plugin SDK 的完整参考：概述、入口点、运行时帮助器、打包与配置、测试、清单规范，以及插件架构深度解析。

---

## 目录

1. [[#第一章：SDK 概述]]
2. [[#第二章：入口点（Entry Points）]]
3. [[#第三章：运行时帮助器（Runtime Helpers）]]
4. [[#第四章：打包与配置（Setup & Config）]]
5. [[#第五章：插件测试（Testing）]]
6. [[#第六章：插件清单（openclaw.plugin.json）]]
7. [[#第七章：插件架构（Architecture）]]

---

## 第一章：SDK 概述

Plugin SDK 是插件与核心之间的**类型化契约**，定义了**从哪里导入**以及**可以注册什么**。

### 导入约定

始终从具体的子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
```

每个子路径都是一个小型的、自包含的模块。这样可以保持启动速度，并避免循环依赖问题。

### 子路径参考

以下是按用途分组的最常用子路径。完整的 100+ 子路径列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

#### 插件入口

| 子路径                       | 核心导出                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry` | `definePluginEntry`                                                                                                                |
| `plugin-sdk/core`         | `defineChannelPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`defineSetupPluginEntry`、`buildChannelConfigSchema` |

#### 频道相关

| 子路径 | 核心导出 |
| --- | --- |
| `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface` |
| `plugin-sdk/channel-pairing` | `createChannelPairingController` |
| `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
| `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
| `plugin-sdk/channel-config-schema` | 频道配置 schema 类型 |
| `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
| `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
| `plugin-sdk/channel-inbound` | 防抖、提及匹配、信封辅助工具 |
| `plugin-sdk/channel-send-result` | 回复结果类型 |
| `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`、`createMessageToolCardSchema` |
| `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
| `plugin-sdk/channel-contract` | 频道契约类型 |
| `plugin-sdk/channel-feedback` | 反馈/反应（reaction）连接 |

#### Provider 相关

| 子路径 | 核心导出 |
| --- | --- |
| `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile` |
| `plugin-sdk/provider-models` | `normalizeModelCompat` |
| `plugin-sdk/provider-catalog` | Catalog 类型重导出 |
| `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似函数 |
| `plugin-sdk/provider-stream` | 流包装器类型 |
| `plugin-sdk/provider-onboard` | 引导配置补丁辅助工具 |

#### 命令与工具

| 子路径 | 核心导出 |
| --- | --- |
| `plugin-sdk/command-auth` | `resolveControlCommandGate` |
| `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
| `plugin-sdk/secret-input` | 秘密输入解析辅助工具 |
| `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |

#### 运行时

| 子路径 | 核心导出 |
| --- | --- |
| `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
| `plugin-sdk/config-runtime` | 配置加载/写入辅助工具 |
| `plugin-sdk/infra-runtime` | 系统事件/心跳辅助工具 |
| `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区辅助工具 |
| `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
| `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |

#### 媒体与测试

| 子路径 | 核心导出 |
| --- | --- |
| `plugin-sdk/image-generation` | 图像生成 provider 类型 |
| `plugin-sdk/media-understanding` | 媒体理解 provider 类型 |
| `plugin-sdk/speech` | 语音 provider 类型 |
| `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`、`shouldAckReaction` |

### 注册 API

`register(api)` 回调接收一个 `OpenClawPluginApi` 对象，该对象包含以下方法：

#### 能力注册

| 方法 | 注册内容 |
| --- | --- |
| `api.registerProvider(...)` | 文本推理（LLM） |
| `api.registerChannel(...)` | 消息频道 |
| `api.registerSpeechProvider(...)` | 文字转语音 / STT 合成 |
| `api.registerMediaUnderstandingProvider(...)` | 图像/音频/视频分析 |
| `api.registerImageGenerationProvider(...)` | 图像生成 |
| `api.registerWebSearchProvider(...)` | 网络搜索 |

#### 工具与命令

| 方法 | 注册内容 |
| --- | --- |
| `api.registerTool(tool, opts?)` | Agent 工具（必选或 `{ optional: true }`） |
| `api.registerCommand(def)` | 自定义命令（绕过 LLM） |

#### 基础设施

| 方法 | 注册内容 |
| --- | --- |
| `api.registerHook(events, handler, opts?)` | 事件钩子 |
| `api.registerHttpRoute(params)` | 网关 HTTP 端点 |
| `api.registerGatewayMethod(name, handler)` | 网关 RPC 方法 |
| `api.registerCli(registrar, opts?)` | CLI 子命令 |
| `api.registerService(service)` | 后台服务 |
| `api.registerInteractiveHandler(registration)` | 交互式处理器 |

#### 独占插槽

| 方法 | 注册内容 |
| --- | --- |
| `api.registerContextEngine(id, factory)` | 上下文引擎（同时只有一个激活） |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词区块构建器 |

#### 事件与生命周期

| 方法 | 作用 |
| --- | --- |
| `api.on(hookName, handler, opts?)` | 类型化生命周期钩子 |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调 |

#### API 对象字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `api.id` | `string` | 插件 ID |
| `api.name` | `string` | 显示名称 |
| `api.version` | `string?` | 插件版本（可选） |
| `api.description` | `string?` | 插件描述（可选） |
| `api.source` | `string` | 插件源路径 |
| `api.rootDir` | `string?` | 插件根目录（可选） |
| `api.config` | `OpenClawConfig` | 当前配置快照 |
| `api.pluginConfig` | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置 |
| `api.runtime` | `PluginRuntime` | 运行时帮助器（见[[#第三章：运行时帮助器（Runtime Helpers）]]） |
| `api.logger` | `PluginLogger` | 作用域日志器（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode` | `PluginRegistrationMode` | `"full"`、`"setup-only"` 或 `"setup-runtime"` |
| `api.resolvePath(input)` | `(string) => string` | 相对于插件根目录解析路径 |

### 内部模块约定

在插件内部，使用本地桶文件（barrel files）进行内部导入：

```text
my-plugin/
  api.ts            # 对外消费者的公共导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 轻量级仅配置入口（可选）
```

**永远不要**从生产代码中通过 `openclaw/plugin-sdk/<your-plugin>` 导入自己的插件。内部导入应通过 `./api.ts` 或 `./runtime-api.ts` 路由。SDK 路径仅是外部契约。

---

## 第二章：入口点（Entry Points）

每个插件都导出一个默认入口对象。SDK 提供了三个辅助函数用于创建它们。

### definePluginEntry

**导入：** `openclaw/plugin-sdk/plugin-entry`

适用于 Provider 插件、工具插件、钩子插件，以及**不是**消息频道的一切插件。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 字段 | 类型 | 必填 | 默认值 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | — |
| `name` | `string` | 是 | — |
| `description` | `string` | 是 | — |
| `kind` | `string` | 否 | — |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否 | 空对象 schema |
| `register` | `(api: OpenClawPluginApi) => void` | 是 | — |

- `id` 必须与 `openclaw.plugin.json` 清单中的 ID 匹配。
- `kind` 用于独占插槽：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是一个函数，用于延迟求值。

### defineChannelPluginEntry

**导入：** `openclaw/plugin-sdk/core`

封装了 `definePluginEntry` 并附加了频道特定的连接逻辑。自动调用 `api.registerChannel({ plugin })` 并根据注册模式对 `registerFull` 进行门控。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerFull(api) {
    api.registerCli(/* ... */);
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 字段 | 类型 | 必填 | 默认值 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | — |
| `name` | `string` | 是 | — |
| `description` | `string` | 是 | — |
| `plugin` | `ChannelPlugin` | 是 | — |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否 | 空对象 schema |
| `setRuntime` | `(runtime: PluginRuntime) => void` | 否 | — |
| `registerFull` | `(api: OpenClawPluginApi) => void` | 否 | — |

- `setRuntime` 在注册期间被调用，可用于存储运行时引用（通常通过 `createPluginRuntimeStore`）。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行，在仅配置加载期间会被跳过。

### defineSetupPluginEntry

**导入：** `openclaw/plugin-sdk/core`

用于轻量级的 `setup-entry.ts` 文件。仅返回 `{ plugin }`，不含运行时或 CLI 连接逻辑。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当频道被禁用、未配置，或启用了延迟加载时，OpenClaw 会加载此文件而不是完整入口。详见[[#Setup Entry]]中关于何时生效的说明。

### 注册模式

`api.registrationMode` 告诉插件它是如何被加载的：

| 模式 | 时机 | 应注册的内容 |
| --- | --- | --- |
| `"full"` | 正常网关启动 | 全部内容 |
| `"setup-only"` | 禁用/未配置的频道 | 仅频道注册 |
| `"setup-runtime"` | 运行时可用的配置流程 | 频道 + 轻量级运行时 |

`defineChannelPluginEntry` 会自动处理此分割。如果直接对频道使用 `definePluginEntry`，则需要自行检查模式：

```typescript
register(api) {
  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 仅限运行时的重型注册
  api.registerCli(/* ... */);
  api.registerService(/* ... */);
}
```

### 插件形态（Plugin Shapes）

OpenClaw 根据注册行为对已加载的插件进行分类：

| 形态 | 说明 |
| --- | --- |
| **plain-capability** | 单一能力类型（例如，仅 provider） |
| **hybrid-capability** | 多种能力类型（例如，provider + speech） |
| **hook-only** | 仅含钩子，无能力 |
| **non-capability** | 包含工具/命令/服务，但没有能力 |

使用 `openclaw plugins inspect <id>` 查看插件的形态。


---

## 第三章：运行时帮助器（Runtime Helpers）

`api.runtime` 对象在注册期间注入到每个插件中。请使用这些帮助器，而不是直接导入宿主内部。

```typescript
register(api) {
  const runtime = api.runtime;
}
```

### api.runtime.agent

Agent 身份、目录和会话管理。

```typescript
// 解析 agent 的工作目录
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// 解析 agent 工作区
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// 获取 agent 身份
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// 获取默认思考级别
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// 获取 agent 超时时间
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// 确保工作区存在
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 运行嵌入式 Pi agent
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**会话存储帮助器**位于 `api.runtime.agent.session`：

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### api.runtime.agent.defaults

默认模型和 provider 常量：

```typescript
const model = api.runtime.agent.defaults.model;     // 例如 "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 例如 "anthropic"
```

### api.runtime.subagent

启动和管理后台 subagent 运行。

```typescript
// 启动一个 subagent 运行
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // 可选覆盖
  model: "gpt-4.1-mini", // 可选覆盖
  deliver: false,
});

// 等待完成
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// 读取会话消息
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// 删除会话
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

> 模型覆盖（`provider` / `model`）需要操作员通过配置中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 来允许。不受信任的插件仍然可以运行 subagent，但覆盖请求会被拒绝。

### api.runtime.tts

文字转语音合成。

```typescript
// 标准 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 电话优化 TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 列出可用语音
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

使用核心 `messages.tts` 配置和 provider 选择。返回 PCM 音频缓冲区 + 采样率。

### api.runtime.mediaUnderstanding

图像、音频和视频分析。

```typescript
// 描述图像
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 转录音频
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // 可选，当无法推断 MIME 时使用
});

// 描述视频
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 通用文件分析
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

当没有输出时（例如跳过的输入），返回 `{ text: undefined }`。

`api.runtime.stt.transcribeAudioFile(...)` 作为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容别名保留。

### api.runtime.imageGeneration

图像生成。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### api.runtime.webSearch

网络搜索。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### api.runtime.media

底层媒体工具。

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### api.runtime.config

配置加载与写入。

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### api.runtime.system

系统级工具。

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### api.runtime.events

事件订阅。

```typescript
api.runtime.events.onAgentEvent((event) => { /* ... */ });
api.runtime.events.onSessionTranscriptUpdate((update) => { /* ... */ });
```

### api.runtime.logging

日志记录。

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### api.runtime.modelAuth

模型和 provider 的认证解析。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### api.runtime.state

状态目录解析。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### api.runtime.tools

记忆工具工厂和 CLI。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### api.runtime.channel

频道特定的运行时帮助器（当频道插件已加载时可用）。

### 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在 `register` 回调之外使用：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// 在入口点中
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 在其他文件中
export function getRuntime() {
  return store.getRuntime(); // 未初始化时抛出异常
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 未初始化时返回 null
}
```

### 其他顶层 api 字段

除 `api.runtime` 外，API 对象还提供以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `api.id` | `string` | 插件 ID |
| `api.name` | `string` | 插件显示名称 |
| `api.config` | `OpenClawConfig` | 当前配置快照 |
| `api.pluginConfig` | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置 |
| `api.logger` | `PluginLogger` | 作用域日志器（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode` | `PluginRegistrationMode` | `"full"`、`"setup-only"` 或 `"setup-runtime"` |
| `api.resolvePath(input)` | `(string) => string` | 相对于插件根目录解析路径 |

---

## 第四章：打包与配置（Setup & Config）

本章介绍插件打包（`package.json` 元数据）、清单（`openclaw.plugin.json`）、配置入口，以及 config schema 的参考。

### package.json 中的 openclaw 字段

你的 `package.json` 需要一个 `openclaw` 字段，告诉插件系统你的插件提供什么。

**频道插件：**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider 插件：**

```json
{
  "name": "@myorg/openclaw-my-provider",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "providers": ["my-provider"]
  }
}
```

#### openclaw 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `extensions` | `string[]` | 入口点文件（相对于包根目录） |
| `setupEntry` | `string` | 轻量级仅配置入口（可选） |
| `channel` | `object` | 频道元数据：`id`、`label`、`blurb`、`selectionLabel`、`docsPath`、`order`、`aliases` |
| `providers` | `string[]` | 该插件注册的 provider ID |
| `install` | `object` | 安装提示：`npmSpec`、`localPath`、`defaultChoice` |
| `startup` | `object` | 启动行为标志 |

#### 延迟完整加载（Deferred Full Load）

频道插件可以通过以下配置启用延迟加载：

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

启用后，OpenClaw 在监听前的启动阶段仅加载 `setupEntry`，即使对已配置的频道也是如此。完整入口在网关开始监听后才加载。

> 仅当你的 `setupEntry` 注册了网关在开始监听之前所需的全部内容（频道注册、HTTP 路由、网关方法）时，才启用延迟加载。

### 插件清单（openclaw.plugin.json）

每个原生插件必须在包根目录中附带 `openclaw.plugin.json`。OpenClaw 使用它在不执行插件代码的情况下验证配置。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

对于频道插件，添加 `kind` 和 `channels`：

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

即使没有配置的插件也必须附带 schema。空 schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

### Setup Entry

`setup-entry.ts` 是 `index.ts` 的轻量级替代，当 OpenClaw 只需要配置界面（引导、配置修复、禁用频道检查）时加载。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在配置流程中加载重型运行时代码（加密库、CLI 注册、后台服务）。

**OpenClaw 使用 `setupEntry` 而非完整入口的场景：**
- 频道被禁用但需要配置/引导界面
- 频道已启用但未配置
- 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**
- 频道插件对象（通过 `defineSetupPluginEntry`）
- 网关监听前所需的任何 HTTP 路由
- 启动期间所需的任何网关方法

**`setupEntry` 不应包含的内容：**
- CLI 注册
- 后台服务
- 重型运行时导入（加密、SDK）
- 仅在启动后需要的网关方法

### Config Schema

插件配置根据清单中的 JSON Schema 进行验证。用户通过以下方式配置插件：

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

插件在注册期间通过 `api.pluginConfig` 接收此配置。对于频道特定配置，请使用频道配置区块：

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

#### 构建频道 Config Schema

使用 `openclaw/plugin-sdk/core` 中的 `buildChannelConfigSchema` 将 Zod schema 转换为 OpenClaw 验证的 `ChannelConfigSchema` 包装器：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

### 配置向导（Setup Wizards）

频道插件可以为 `openclaw onboard` 提供交互式配置向导。向导是 `ChannelPlugin` 上的 `ChannelSetupWizard` 对象：

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等字段。

对于仅需标准 `note -> prompt -> parse -> merge -> patch` 流程的 DM 许可列表提示，优先使用 `openclaw/plugin-sdk/setup` 中的共享帮助器：
- `createPromptParsedAllowFromForAccount(...)`
- `createTopLevelChannelParsedAllowFromPrompt(...)`
- `createNestedChannelParsedAllowFromPrompt(...)`

对于仅在标签、分数和可选额外行上有差异的频道配置状态块，优先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)` 而非手动编写相同的 `status` 对象。

对于仅在特定上下文中出现的可选配置界面，使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// 返回 { setupAdapter, setupWizard }
```

### 发布与安装

**外部插件：** 发布到 ClawHub 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 首先尝试 ClawHub，自动回退到 npm。也可以强制指定来源：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # 仅 ClawHub
openclaw plugins install npm:@myorg/openclaw-my-plugin       # 仅 npm
```

**仓库内插件：** 放在 `extensions/` 目录下，构建时自动发现。

**用户可以浏览和安装：**

```bash
openclaw plugins search <query>
openclaw plugins install <package-name>
```

> 对于 npm 来源的安装，`openclaw plugins install` 使用 `npm install --ignore-scripts` 运行（无生命周期脚本）。请保持插件依赖树为纯 JS/TS，避免需要 `postinstall` 构建的包。

---

## 第五章：插件测试（Testing）

### 测试工具

**导入：** `openclaw/plugin-sdk/testing`

testing 子路径导出了一组供插件作者使用的辅助工具：

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

#### 可用导出

| 导出 | 用途 |
| --- | --- |
| `installCommonResolveTargetErrorCases` | 目标解析错误处理的共享测试用例 |
| `shouldAckReaction` | 检查频道是否应添加确认 reaction |
| `removeAckReactionAfterReply` | 回复发送后移除确认 reaction |

#### 类型

testing 子路径还重新导出了测试文件中常用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

### 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为频道目标解析添加标准错误用例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 你的频道目标解析逻辑
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 添加频道特定的测试用例
  it("should resolve @username targets", () => {
    // ...
  });
});
```

### 测试模式

#### 对频道插件进行单元测试

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 不暴露 token 值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

#### 对 Provider 插件进行单元测试

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

#### Mock 插件运行时

对于使用 `createPluginRuntimeStore` 的代码，在测试中 mock 运行时：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

// 在测试准备中
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 其他 mock
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... 其他命名空间
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 测试结束后
store.clearRuntime();
```

#### 使用实例级 stub

优先使用实例级 stub 而非原型变异：

```typescript
// 推荐：实例级 stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：原型变异
// MyChannelClient.prototype.sendMessage = vi.fn();
```

### 契约测试（仓库内插件）

内置插件有契约测试，用于验证注册所有权：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试断言：
- 哪些插件注册了哪些 provider
- 哪些插件注册了哪些语音 provider
- 注册形态的正确性
- 运行时契约合规性

#### 运行特定范围的测试

对特定插件运行测试：

```bash
pnpm test -- extensions/my-channel/
```

仅运行契约测试：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

### Lint 强制规则（仓库内插件）

`pnpm check` 对仓库内插件强制执行三条规则：

1. **禁止单体根导入** — `openclaw/plugin-sdk` 根桶被拒绝
2. **禁止直接 `src/` 导入** — 插件不能直接导入 `../../src/`
3. **禁止自我导入** — 插件不能导入自己的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但建议遵循相同的模式。

### 测试配置

OpenClaw 使用 Vitest 并配置了 V8 覆盖率阈值。

```bash
# 运行所有测试
pnpm test

# 运行特定插件测试
pnpm test -- extensions/my-channel/src/channel.test.ts

# 使用特定测试名称过滤运行
pnpm test -- extensions/my-channel/ -t "resolves account"

# 带覆盖率运行
pnpm test:coverage
```

如果本地运行导致内存压力：

```bash
OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test
```

---

## 第六章：插件清单（openclaw.plugin.json）

> 本章仅针对**原生 OpenClaw 插件清单**。兼容 bundle 布局使用不同的清单文件：
> - Codex bundle：`.codex-plugin/plugin.json`
> - Claude bundle：`.claude-plugin/plugin.json` 或默认 Claude 组件布局（无清单）
> - Cursor bundle：`.cursor-plugin/plugin.json`

每个原生 OpenClaw 插件**必须**在**插件根目录**中附带 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。清单缺失或无效将被视为插件错误，并阻止配置验证。

### 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载插件代码之前读取的元数据。用于：
- 插件身份标识
- 配置验证
- 无需启动插件运行时即可获取的认证和引导元数据
- 配置 UI 提示

**不应用于：**
- 注册运行时行为
- 声明代码入口点
- npm 安装元数据（这些属于插件代码和 `package.json`）

### 最简示例

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

### 完整示例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

### 顶层字段参考

| 字段 | 必填 | 类型 | 含义 |
| --- | --- | --- | --- |
| `id` | 是 | `string` | 规范插件 ID。用于 `plugins.entries.<id>` 中的 ID。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略或设置为非 `true` 值则默认禁用。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的独占插件类型。 |
| `channels` | 否 | `string[]` | 此插件拥有的频道 ID，用于发现和配置验证。 |
| `providers` | 否 | `string[]` | 此插件拥有的 provider ID。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 不加载插件代码即可检查的廉价 provider 认证环境变量元数据。 |
| `providerAuthChoices` | 否 | `object[]` | 用于引导选择器、首选 provider 解析和简单 CLI 标志注册的廉价认证选择元数据。 |
| `skills` | 否 | `string[]` | 要加载的技能目录（相对于插件根目录）。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 插件界面中显示的简短摘要。 |
| `version` | 否 | `string` | 信息性插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

### providerAuthChoices 字段参考

每个 `providerAuthChoices` 条目描述一个引导或认证选择。OpenClaw 在 provider 运行时加载之前读取此内容。

| 字段 | 必填 | 类型 | 含义 |
| --- | --- | --- | --- |
| `provider` | 是 | `string` | 此选择所属的 provider ID。 |
| `method` | 是 | `string` | 要分发到的认证方法 ID。 |
| `choiceId` | 是 | `string` | 引导和 CLI 流程使用的稳定认证选择 ID。 |
| `choiceLabel` | 否 | `string` | 用户可见标签。省略时回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短帮助文本。 |
| `groupId` | 否 | `string` | 用于分组相关选择的可选组 ID。 |
| `groupLabel` | 否 | `string` | 该组的用户可见标签。 |
| `groupHint` | 否 | `string` | 该组的简短帮助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | CLI 帮助中使用的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选择应出现在哪些引导界面中。省略时默认为 `["text-inference"]`。 |

### uiHints 字段参考

`uiHints` 是从配置字段名到小型渲染提示的映射。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每个字段提示可以包含：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `label` | `string` | 用户可见字段标签。 |
| `help` | `string` | 简短帮助文本。 |
| `tags` | `string[]` | 可选 UI 标签。 |
| `advanced` | `boolean` | 将字段标记为高级。 |
| `sensitive` | `boolean` | 将字段标记为秘密或敏感。 |
| `placeholder` | `string` | 表单输入的占位符文本。 |

### 清单与 package.json 的区别

两个文件服务于不同的目的：

| 文件 | 用途 |
| --- | --- |
| `openclaw.plugin.json` | 插件代码运行之前必须存在的发现、配置验证、认证选择元数据和 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点和配置/目录元数据的 `openclaw` 块 |

**判断规则：**
- 如果 OpenClaw 必须在加载插件代码之前知道它 → 放在 `openclaw.plugin.json`
- 如果是关于打包、入口文件或 npm 安装行为 → 放在 `package.json`

### JSON Schema 要求

- **每个插件都必须附带 JSON Schema**，即使不接受任何配置。
- 空 schema 是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读写时验证，而不是在运行时验证。

### 验证行为

- 未知的 `channels.*` 键是**错误**，除非该频道 ID 由插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 ID。未知 ID 是**错误**。
- 如果插件已安装但清单或 schema 损坏/缺失，验证失败，Doctor 报告插件错误。
- 如果插件配置存在但插件**被禁用**，配置被保留，Doctor 和日志中出现**警告**。

### 注意事项

- 清单对于原生 OpenClaw 插件（包括本地文件系统加载）是**必需的**。
- 运行时仍然单独加载插件模块；清单仅用于发现和验证。
- 只有文档中记录的清单字段才会被清单加载器读取。避免在此处添加自定义顶层键。
- `providerAuthEnvVars` 是不启动插件运行时即可探测认证、env 标记验证等的廉价元数据路径。
- `providerAuthChoices` 是引导/认证选择器、`--auth-choice` 解析、首选 provider 映射和简单引导 CLI 标志注册的廉价元数据路径。
- 独占插件类型通过 `plugins.slots.*` 选择：
  - `kind: "memory"` 由 `plugins.slots.memory` 选择
  - `kind: "context-engine"` 由 `plugins.slots.contextEngine` 选择（默认：内置 `legacy`）
- 如果插件依赖原生模块，请记录构建步骤和任何包管理器允许列表要求（例如 pnpm 的 `allow-build-scripts` 和 `pnpm rebuild <package>`）。

---

## 第七章：插件架构（Architecture）

### 插件形态与兼容信号

OpenClaw 将已加载的插件按注册行为分类为以下形态：

| 形态 | 说明 |
| --- | --- |
| **plain-capability** | 单一能力类型（例如，仅 provider） |
| **hybrid-capability** | 多种能力类型（例如，provider + speech） |
| **hook-only** | 仅含钩子，无能力 |
| **non-capability** | 包含工具/命令/服务，但没有能力 |

使用 `openclaw plugins inspect <id>` 查看插件的形态和能力分解。

#### 遗留钩子

`before_agent_start` 钩子作为仅钩子插件的兼容路径仍然受支持。使用方向：
- 保持其正常工作
- 记录为遗留
- 模型/provider 覆盖工作优先使用 `before_model_resolve`
- 提示词变更工作优先使用 `before_prompt_build`
- 仅在实际使用量下降且迁移安全性经过测试覆盖证明后才删除

#### 兼容信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签：

| 信号 | 含义 |
| --- | --- |
| **config valid** | 配置解析正常，插件可解析 |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了已弃用的 `before_agent_start` |
| **hard error** | 配置无效或插件加载失败 |

### 架构概述

OpenClaw 插件系统有四个层次：

1. **清单 + 发现层** OpenClaw 从配置路径、工作区根目录、全局扩展根目录和内置扩展中查找候选插件。发现过程首先读取原生 `openclaw.plugin.json` 清单和受支持的 bundle 清单。

2. **启用 + 验证层** 核心决定已发现的插件是启用、禁用、被阻止，还是被选为独占插槽（如记忆插槽）。

3. **运行时加载层** 原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表。兼容 bundle 被规范化为注册表记录，无需导入运行时代码。

4. **界面消费层** OpenClaw 的其余部分读取注册表以暴露工具、频道、provider 配置、钩子、HTTP 路由、CLI 命令和服务。

**重要的设计边界：**
- 发现 + 配置验证应从**清单/schema 元数据**工作，无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这个分割允许 OpenClaw 在完整运行时激活之前验证配置、解释缺失/禁用的插件并构建 UI/schema 提示。

### 频道插件与共享消息工具

频道插件不需要为普通聊天操作注册单独的发送/编辑/反应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，频道插件拥有其背后的频道特定发现和执行。

当前边界：
- 核心拥有共享 `message` 工具宿主、提示词连接、会话/线程记录和执行分发
- 频道插件拥有作用域动作发现、能力发现以及任何频道特定的 schema 片段
- 频道插件通过其动作适配器执行最终动作

对于频道插件，SDK 界面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。该统一发现调用让插件一次性返回其可见动作、能力和 schema 贡献。核心向该发现步骤传入运行时作用域，重要字段包括：
- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

### 能力所有权模型

OpenClaw 将原生插件视为一个**公司**或**功能**的所有权边界，而不是不相关集成的集合。

**原则：**
- 公司插件通常应拥有该公司的所有 OpenClaw 界面
- 功能插件通常应拥有其引入的完整功能界面
- 频道应消费共享核心能力，而不是临时重新实现 provider 行为

**示例：**
- 内置 `openai` 插件拥有 OpenAI 模型 provider 行为以及 OpenAI speech + media-understanding + image-generation 行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs speech 行为
- 内置 `microsoft` 插件拥有 Microsoft speech 行为
- 内置 `google` 插件拥有 Google 模型 provider 行为以及 Google media-understanding + image-generation + web-search 行为
- `voice-call` 插件是功能插件：它拥有通话传输、工具、CLI、路由和运行时，但消费核心 TTS/STT 能力

**核心区分：**
- **plugin** = 所有权边界
- **capability** = 多个插件可以实现或消费的核心契约

### 能力分层

决定代码归属时使用以下心智模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商特定 API、认证、模型目录、语音合成、图像生成、未来视频后端、用量端点
- **频道/功能插件层**：Slack/Discord/voice-call 等集成，消费核心能力并在界面上呈现它们

**TTS 遵循此形态：**
- 核心拥有回复时 TTS 策略、回退顺序、首选项和频道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时帮助器

### 多能力公司插件示例

```typescript
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk";
import {
  buildOpenAISpeechProvider,
  createPluginBackedWebSearchProvider,
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider(
      buildOpenAISpeechProvider({
        id: "exampleai",
        // vendor speech config
      }),
    );

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

### 契约与执行

插件 API 界面有意在 `OpenClawPluginApi` 中进行类型化和集中化。这个契约定义了支持的注册点和插件可以依赖的运行时帮助器。

**两层执行：**

1. **运行时注册执行** 插件注册表在插件加载时验证注册。示例：重复的 provider ID、重复的语音 provider ID 和格式错误的注册会产生插件诊断，而非未定义行为。

2. **契约测试** 内置插件在测试运行期间被捕获到契约注册表中，以便 OpenClaw 可以明确断言所有权。

### 执行模型

原生 OpenClaw 插件与网关**在同一进程内**运行，**不进行沙箱隔离**。已加载的原生插件与核心代码具有相同的进程级信任边界。

**含义：**
- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件的 bug 可能导致网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 目前将其视为元数据/内容包。对于非内置插件，使用允许列表和明确的安装/加载路径。

### 加载流程（Load Pipeline）

启动时，OpenClaw 大致执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单和包元数据
3. 拒绝不安全的候选
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选的启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)` 钩子，将注册收集到插件注册表中
8. 将注册表暴露给命令/运行时界面

安全门控在运行时执行**之前**发生。当入口逃逸插件根目录、路径为全局可写，或对于非内置插件路径所有权看起来可疑时，候选被阻止。

#### 清单优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：
- 识别插件
- 发现声明的频道/技能/config schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强控制 UI 标签/占位符
- 显示安装/目录元数据

对于原生插件，运行时模块是数据平面部分，注册实际行为（钩子、工具、命令或 provider 流程）。

#### 缓存

OpenClaw 为以下内容保留进程内短期缓存：
- 发现结果
- 清单注册表数据
- 已加载的插件注册表

```bash
# 禁用发现缓存
OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1

# 禁用清单缓存
OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1

# 调整缓存窗口
OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS=<ms>
OPENCLAW_PLUGIN_MANIFEST_CACHE_MS=<ms>
```

### 注册表模型

已加载的插件不直接变更随机核心全局变量，而是注册到中央插件注册表。注册表追踪：
- 插件记录（身份、来源、状态、诊断）
- 工具
- 遗留钩子和类型化钩子
- 频道
- Provider
- 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

核心功能然后从注册表读取，而不是直接与插件模块通信。

### 会话绑定回调

可以绑定会话的插件可以在审批解析时做出反应。使用 `api.onConversationBindingResolved(...)` 在绑定请求被批准或拒绝后接收回调：

```typescript
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        console.log(event.binding?.conversationId);
        return;
      }
      // 请求被拒绝；清除任何本地待处理状态
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调载荷字段：
- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 ID 和会话元数据

此回调仅为通知，不改变谁被允许绑定会话，并在核心审批处理完成后运行。

### Provider 运行时钩子

Provider 插件现在有两个层次：
- **清单元数据**：`providerAuthEnvVars`（运行时加载前的廉价环境认证查找）和 `providerAuthChoices`（运行时加载前的廉价引导/认证选择标签和 CLI 标志元数据）
- **配置时钩子**：`catalog` / 遗留 `discovery`
- **运行时钩子**：`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`capabilities`、`prepareExtraParams`、`wrapStreamFn`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`

#### 钩子顺序与使用场景

| # | 钩子 | 作用 | 使用时机 |
| --- | --- | --- | --- |
| 1 | `catalog` | 在 `models.json` 生成期间将 provider 配置发布到 `models.providers` | Provider 拥有目录或 base URL 默认值 |
| 2 | `resolveDynamicModel` | 同步回退，用于尚未在本地注册表中的 provider 拥有的模型 ID | Provider 接受任意上游模型 ID |
| 3 | `prepareDynamicModel` | 异步预热，然后 `resolveDynamicModel` 再次运行 | Provider 在解析未知 ID 之前需要网络元数据 |
| 4 | `normalizeResolvedModel` | 嵌入式运行器使用已解析模型之前的最终重写 | Provider 需要传输重写但仍使用核心传输 |
| 5 | `capabilities` | 共享核心逻辑使用的 provider 拥有的转录/工具元数据 | Provider 需要转录/provider 系列特性 |
| 6 | `prepareExtraParams` | 通用流选项包装器之前的请求参数规范化 | Provider 需要默认请求参数或按 provider 的参数清理 |
| 7 | `wrapStreamFn` | 应用通用包装器后的流包装器 | Provider 需要请求头/正文/模型兼容包装器，无需自定义传输 |
| 8 | `formatApiKey` | 认证配置文件格式化器：存储的配置文件变为运行时 `apiKey` 字符串 | Provider 存储额外认证元数据，需要自定义运行时令牌形式 |
| 9 | `refreshOAuth` | 自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | Provider 不适合共享 `pi-ai` 刷新器 |
| 10 | `buildAuthDoctorHint` | OAuth 刷新失败时附加的修复提示 | Provider 在刷新失败后需要 provider 拥有的认证修复指导 |
| 11 | `isCacheTtlEligible` | 代理/回程 provider 的提示缓存策略 | Provider 需要代理特定的缓存 TTL 门控 |
| 12 | `buildMissingAuthMessage` | 替换通用缺失认证恢复消息 | Provider 需要 provider 特定的缺失认证恢复提示 |
| 13 | `suppressBuiltInModel` | 过时的上游模型压制以及可选的用户可见错误提示 | Provider 需要隐藏过时的上游行或用厂商提示替换它们 |
| 14 | `augmentModelCatalog` | 发现后附加的合成/最终目录行 | Provider 需要 `models list` 和选择器中的合成前向兼容行 |
| 15 | `isBinaryThinking` | 二进制思考 provider 的开/关推理切换 | Provider 仅暴露二进制思考开关 |
| 16 | `supportsXHighThinking` | 选定模型的 `xhigh` 推理支持 | Provider 希望仅在部分模型上启用 `xhigh` |
| 17 | `resolveDefaultThinkingLevel` | 特定模型系列的默认 `/think` 级别 | Provider 拥有模型系列的默认 `/think` 策略 |
| 18 | `isModernModelRef` | 用于实时配置文件过滤和烟雾选择的现代模型匹配器 | Provider 拥有实时/烟雾首选模型匹配 |
| 19 | `prepareRuntimeAuth` | 在推理前将已配置的凭据交换为实际运行时令牌/密钥 | Provider 需要令牌交换或短期请求凭据 |
| 20 | `resolveUsageAuth` | 为 `/usage` 和相关状态界面解析用量/计费凭据 | Provider 需要自定义用量/配额令牌解析或不同的用量凭据 |
| 21 | `fetchUsageSnapshot` | 认证解析后获取并规范化 provider 特定的用量/配额快照 | Provider 需要 provider 特定的用量端点或有效载荷解析器 |

#### Provider 注册示例

```typescript
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 网关 HTTP 路由

插件可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点：

```typescript
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由字段：
- `path`：网关 HTTP 服务器下的路由路径
- `auth`：必填。使用 `"gateway"` 需要普通网关认证，`"plugin"` 使用插件管理的认证/webhook 验证
- `match`：可选，`"exact"`（默认）或 `"prefix"`
- `replaceExisting`：可选，允许同一插件替换其自身的现有路由注册
- `handler`：路由处理了请求时返回 `true`

> `api.registerHttpHandler(...)` 已过时，请使用 `api.registerHttpRoute(...)`。

### 上下文引擎插件

上下文引擎插件拥有用于摄取、组装和压缩的会话上下文编排。使用 `api.registerContextEngine(id, factory)` 注册，然后通过 `plugins.slots.contextEngine` 选择激活的引擎。

```typescript
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果你的引擎**不**拥有压缩算法，保持 `compact()` 实现并明确委托：

```typescript
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

### 添加新能力

当插件需要当前 API 不支持的行为时，**不要**绕过插件系统进行私有访问。而是添加缺失的能力。

**推荐步骤：**
1. **定义核心契约** 决定核心应拥有什么共享行为：策略、回退、配置合并、生命周期、面向频道的语义和运行时帮助器形态。
2. **添加类型化的插件注册/运行时界面** 用最小的有用类型化能力界面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. **连接核心 + 频道/功能消费者** 频道和功能插件应通过核心消费新能力，而不是直接导入厂商实现。
4. **注册厂商实现** 厂商插件然后针对能力注册其后端。
5. **添加契约覆盖** 添加测试，使所有权和注册形态随时间保持明确。

#### 能力检查清单

添加新能力时，实现通常应触及以下界面：
- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时帮助器
- `src/plugins/types.ts` 中的插件 API 注册界面
- `src/plugins/registry.ts` 中的插件注册表连接
- `src/plugins/runtime/*` 中的插件运行时暴露（当功能/频道插件需要消费它时）
- `src/test-utils/plugin-registration.ts` 中的捕获/测试帮助器
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中的运营者/插件文档

#### 能力模板

最简模式：

```typescript
// 核心契约
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// 插件 API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// 功能/频道插件的共享运行时帮助器
const clip = await api.runtime.videoGeneration.generateFile({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```typescript
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

**规则保持简单：**
- 核心拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能/频道插件消费运行时帮助器
- 契约测试保持所有权明确

### Provider 目录（Catalogs）

Provider 插件可以为推理定义模型目录：

```typescript
registerProvider({
  catalog: {
    run: async (ctx) => {
      return { provider: { baseUrl: "...", models: [...] } };
    }
  }
})
```

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 provider 的合并时机：
- `simple`：普通 API 密钥或环境驱动的 provider
- `profile`：认证配置文件存在时出现的 provider
- `paired`：合成多个相关 provider 条目的 provider
- `late`：最后一轮，在其他隐式 provider 之后

后面的 provider 在键冲突时获胜，因此插件可以有意用相同 provider ID 覆盖内置 provider 条目。

### 配置支持的目录

需要从配置派生目录条目的插件应将该逻辑保留在插件中，并重用 `openclaw/plugin-sdk/directory-runtime` 中的共享帮助器。

共享帮助器仅处理通用操作：
- 查询过滤
- 限制应用
- 去重/规范化帮助器
- 构建 `ChannelDirectoryEntry[]`

频道特定的账户检查和 ID 规范化应保留在插件实现中。

### 只读频道检查

如果你的插件注册了频道，建议在 `resolveAccount(...)` 旁边实现 `plugin.config.inspectAccount(cfg, accountId)`。

**原因：**
- `resolveAccount(...)` 是运行时路径，允许假设凭据已完全具象化
- 只读命令路径（如 `openclaw status`、`openclaw channels status`）不需要为了描述配置而具象化运行时凭据

**推荐的 `inspectAccount(...)` 行为：**
- 仅返回描述性账户状态
- 保留 `enabled` 和 `configured`
- 包含相关的凭据来源/状态字段：`tokenSource`、`tokenStatus`、`botTokenSource` 等
- 无需返回原始令牌值即可报告只读可用性（`tokenStatus: "available"` 就足够了）
- 当凭据通过 SecretRef 配置但在当前命令路径中不可用时，使用 `configured_unavailable`

### 包包（Package Packs）

插件目录可以包含一个带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个入口变成一个插件。如果包列出多个扩展，插件 ID 变为 `name/<fileBase>`。

**安全防护：** 每个 `openclaw.extensions` 入口在符号链接解析后必须保留在插件目录内。逃逸包目录的入口会被拒绝。

#### 频道目录元数据示例

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

#### 外部频道目录

OpenClaw 还可以合并**外部频道目录**（例如 MPM 注册表导出）。将 JSON 文件放置在以下位置之一：
- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（逗号/分号/`PATH` 分隔）。每个文件应包含：

```json
{
  "entries": [
    {
      "name": "@scope/pkg",
      "openclaw": {
        "channel": {...},
        "install": {...}
      }
    }
  ]
}
```

---

## 第八章：故障排查（Troubleshooting）

### 常见错误：Cannot read properties of undefined (reading 'properties')

#### 症状

插件加载时出现以下错误：

```
run error: Cannot read properties of undefined (reading 'properties')
```

#### 原因

此错误通常是因为工具定义使用了错误的 API 格式。OpenClaw 的 `AnyAgentTool` 要求特定的字段：

| 错误字段（旧版/其他格式） | 正确字段（OpenClaw 格式） |
|----------------------|----------------------|
| `inputSchema` | `parameters` |
| `handler(input)` | `execute(_id, input)` |
| （缺失） | `label`（必需） |
| `properties` | `additionalProperties: false`（推荐） |
| 直接返回结果 | `{ content: [...], details: ... }` 格式 |

#### 正确的工具定义格式

```typescript
// ✅ 正确的 OpenClaw 工具定义
api.registerTool({
  name: "my_tool",
  label: "My Tool",              // 必需：显示名称
  description: "工具描述",
  parameters: {                   // 使用 parameters，不是 inputSchema
    type: "object",
    additionalProperties: false,  // 推荐添加
    required: ["prompt"],
    properties: {
      prompt: {
        type: "string",
        description: "输入提示"
      }
    }
  },
  async execute(_id: string, input: any) {  // 使用 execute，不是 handler
    // 处理逻辑...
    return {
      content: [{                 // 必须返回此格式
        type: "text",
        text: "结果内容"
      }],
      details: {                  // 可选的附加信息
        sessionId: "xxx"
      }
    };
  }
});
```

#### 常见错误对比

```typescript
// ❌ 错误：使用 inputSchema 和 handler
{
  name: "my_tool",
  description: "工具描述",
  inputSchema: {                  // 错误字段
    type: "object",
    properties: {
      prompt: { type: "string" }
    }
  },
  async handler(input: any) {     // 错误字段
    return { result: "xxx" };     // 错误返回格式
  }
}

// ✅ 正确：使用 parameters 和 execute
{
  name: "my_tool",
  label: "My Tool",               // 必需
  description: "工具描述",
  parameters: {                   // 正确字段
    type: "object",
    additionalProperties: false,  // 推荐
    properties: {
      prompt: { type: "string" }
    }
  },
  async execute(_id: string, input: any) {  // 正确字段
    return {
      content: [{
        type: "text",
        text: "xxx"
      }],
      details: {}
    };
  }
}
```

#### 类型定义

```typescript
// TypeScript 接口定义
interface AgentToolResult {
  content: Array<{ type: 'text'; text: string }>;
  details: unknown;
}

interface ToolDefinition {
  name: string;
  label: string;                          // 必需
  description: string;
  parameters: {                           // 不是 inputSchema
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;       // 推荐设为 false
  };
  execute: (_id: string, input: any) => AgentToolResult | Promise<AgentToolResult>;
}
```

#### 修复步骤

1. **更新类型定义**（`index.d.ts`）：
   ```typescript
   export interface ToolDefinition {
     name: string;
     label: string;  // 添加
     description: string;
     parameters: {   // 从 inputSchema 改名
       type: 'object';
       properties?: Record<string, unknown>;
       required?: string[];
       additionalProperties?: boolean;  // 添加
     };
     execute: (_id: string, input: any) => AgentToolResult;  // 从 handler 改名
   }
   ```

2. **更新工具实现**（`index.ts`）：
   - 添加 `label` 字段
   - `inputSchema` → `parameters`
   - `handler` → `execute(_id, input)`
   - 添加 `additionalProperties: false`
   - 更新返回值格式

3. **重新构建并发布**：
   ```bash
   npm run build
   npm version patch  # 或 minor
   npm publish
   ```

4. **在 OpenClaw 中重新安装**：
   ```bash
   npx openclaw plugins install @your/package@latest
   npx openclaw gateway restart
   ```

#### 验证修复

运行 `npx openclaw doctor` 检查插件状态：

```
◇  Plugins ──────╮
│                │
│  Loaded: 42    │
│  Errors: 0     │  ← 确认没有错误
│                │
├────────────────╯
```

#### 参考链接

- [OpenClaw 插件文档](https://docs.openclaw.ai/plugins/sdk-overview)
- [工具注册 API](https://docs.openclaw.ai/plugins/sdk-runtime)

---

*文档整合自 OpenClaw 官方文档，翻译时间：2026-03-24*
*故障排查章节添加时间：2026-03-30*
