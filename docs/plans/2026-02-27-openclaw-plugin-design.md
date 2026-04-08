# OpenClaw Plugin 设计文档

**日期：** 2026-02-27  
**状态：** 已审批，待实现

---

## 目标

将 pi-superpowers 的 14 个工作流技能移植到 OpenClaw，作为独立 npm 包 `@weiping/openclaw-superpowers` 发布，支持 `openclaw plugins install @weiping/openclaw-superpowers` 一行安装。

---

## 架构

在现有 `pi-superpowers` 仓库新增 `openclaw-plugin/` 子目录，作为独立 npm workspace 包。Skills 在两个平台间共享同一套 SKILL.md，通过 `prepublishOnly` 脚本复制进发布包。Bootstrap 注入通过 OpenClaw 的 `before_agent_start` 钩子实现，注入工具映射说明，SKILL.md 内容本身不作修改。

---

## 目录结构

```
pi-superpowers/
├── skills/                      ← 现有，14 个技能（两平台共享，不修改）
├── extensions/                  ← 现有，Pi 专用扩展
├── openclaw-plugin/             ← 新增子目录
│   ├── package.json             (name: @weiping/openclaw-superpowers)
│   ├── openclaw.plugin.json     (OpenClaw 插件声明)
│   ├── index.ts                 (before_agent_start bootstrap 钩子)
│   ├── tsconfig.json            (TypeScript 配置)
│   └── skills/                  (gitignored，prepublish 时从 ../skills 复制)
```

---

## 核心组件设计

### 1. `openclaw.plugin.json`

```json
{
  "id": "superpowers",
  "name": "Superpowers",
  "description": "14 workflow skills with Chinese triggers: TDD, debugging, code review, planning and more",
  "skills": ["./skills"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

### 2. `index.ts` — Bootstrap 注入

利用 `before_agent_start` 钩子，每次 agent 运行时将工具映射注入 `prependContext`：

```ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOOL_MAPPING = `
## OpenClaw 工具映射（Superpowers Skills 使用说明）

当前运行环境为 OpenClaw。Skills 文档中的工具引用按以下规则映射：

| Skills 中的引用 | OpenClaw 中的实际用法 |
|---|---|
| \`dispatch_agent\` | 使用 \`sessions_spawn\` 工具派发子代理 |
| \`bash\` | 直接使用（相同） |
| \`read\` / \`write\` / \`edit\` | 直接使用（相同） |
| TodoWrite | 用 \`write\`/\`edit\` 工具操作 \`TODO.md\` |

使用 \`/skill:<name>\` 可强制加载任意技能。
`.trim();

export default function register(api: OpenClawPluginApi) {
  api.on("before_agent_start", () => ({
    prependContext: TOOL_MAPPING,
  }));
}
```

### 3. `package.json`

```json
{
  "name": "@weiping/openclaw-superpowers",
  "version": "1.0.0",
  "description": "Superpowers workflow skills for OpenClaw: TDD, debugging, planning with Chinese trigger support",
  "keywords": ["openclaw", "skills", "tdd", "debugging", "workflow", "chinese"],
  "license": "MIT",
  "type": "module",
  "main": "dist/index.js",
  "files": ["dist/", "skills/", "openclaw.plugin.json"],
  "scripts": {
    "build": "tsc --noEmit",
    "prepublishOnly": "node scripts/copy-skills.mjs && tsc"
  },
  "peerDependencies": {
    "openclaw": "*"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 4. Skills 复制脚本 `scripts/copy-skills.mjs`

```js
import { cpSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "..", "skills");
const dest = join(__dirname, "..", "skills");

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("✓ skills copied from ../skills");
```

---

## 工具映射决策

**选择方案 A（注入映射表，不修改 SKILL.md）的理由：**
- Skills 只维护一份，两个平台同步更新
- SKILL.md 内容通用，用户可以阅读理解，不绑定平台
- AI 足够智能，根据映射表自行调整工具调用

---

## 安装与使用

```bash
# 安装
openclaw plugins install @weiping/openclaw-superpowers

# 临时试用
openclaw -e npm:@weiping/openclaw-superpowers
```

---

## 与 pi-superpowers 对比

| 功能 | pi-superpowers | openclaw-superpowers |
|------|---------------|---------------------|
| 技能内容 | 14 个 SKILL.md | 共享，完全相同 |
| Bootstrap | Pi `before_agent_start` 扩展 | OpenClaw `before_agent_start` 钩子 |
| 工具映射 | Pi 原生工具名 | 注入映射表 |
| 子代理 | `dispatch_agent` 工具 | 映射 → `sessions_spawn` |
| 安装 | `pi install npm:@weiping/pi-superpowers` | `openclaw plugins install @weiping/openclaw-superpowers` |
