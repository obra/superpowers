# Superpowers

Superpowers 是一套完整的代理式軟體開發方法論，建立在一組可組合的技能與初始指令之上，確保你的 coding agent 會實際使用這些技能。

## 快速開始

讓你的代理擁有 Superpowers：[Claude Code](#claude-code)、[Antigravity](#antigravity)、[Codex App](#codex-app)、[Codex CLI](#codex-cli)、[Cursor](#cursor)、[Factory Droid](#factory-droid)、[Gemini CLI](#gemini-cli)、[GitHub Copilot CLI](#github-copilot-cli)、[Kimi Code](#kimi-code)、[OpenCode](#opencode)、[Pi](#pi)。

## 運作方式

從你啟動 coding agent 的那一刻開始，它看到你要建構東西時，不會直接跳進寫程式。相反，它會先退一步，問清楚你真正想做的是什麼。

當它從對話中釐清出規格後，會把規格分成足夠短、真的能讀完並消化的段落交給你確認。

在你核准設計後，代理會整理出一份實作計畫，清楚到讓一位熱情但品味糟糕、判斷力不足、沒有專案上下文、又抗拒測試的初階工程師也能照著做。它強調真正的紅綠 TDD、YAGNI（You Aren't Gonna Need It）與 DRY。

接著，當你說「go」之後，它會啟動 `subagent-driven-development` 流程，讓代理逐項完成工程任務、檢查並審查自己的工作，然後繼續前進。你的代理能在不偏離既定計畫的情況下自主工作數小時，這並不罕見。

還有更多細節，但這就是核心。由於技能會自動觸發，你不需要做任何特別操作。你的 coding agent 會直接擁有 Superpowers。

## 贊助

如果 Superpowers 幫你完成了能創造收入的事情，而你也願意支持，我會非常感謝你考慮[贊助我的開源工作](https://github.com/sponsors/obra)。

謝謝！

\- Jesse

## 安裝

不同 harness 的安裝方式不同。如果你使用多個 harness，請分別為每個 harness 安裝 Superpowers。

### Claude Code

Superpowers 可透過 [Claude 官方外掛市集](https://claude.com/plugins/superpowers)取得。

#### 官方市集

- 從 Anthropic 官方市集安裝外掛：

  ```bash
  /plugin install superpowers@claude-plugins-official
  ```

#### Superpowers 市集

Superpowers 市集提供 Superpowers 以及其他相關 Claude Code 外掛。

- 註冊市集：

  ```bash
  /plugin marketplace add obra/superpowers-marketplace
  ```

- 從這個市集安裝外掛：

  ```bash
  /plugin install superpowers@superpowers-marketplace
  ```

### Antigravity

從這個 repository 安裝 Superpowers 外掛：

```bash
agy plugin install https://github.com/obra/superpowers
```

Antigravity 會執行外掛的 session-start hook，因此 Superpowers 會從第一則訊息開始生效。若要更新，重新執行同一個命令即可。

### Codex App

Superpowers 可透過 [Codex 官方外掛市集](https://github.com/openai/plugins)取得。

- 在 Codex app 中，點擊側邊欄的 Plugins。
- 你應該會在 Coding 區塊看到 `Superpowers`。
- 點擊 Superpowers 旁邊的 `+`，並依照提示操作。

### Codex CLI

Superpowers 可透過 [Codex 官方外掛市集](https://github.com/openai/plugins)取得。

- 開啟外掛搜尋介面：

  ```bash
  /plugins
  ```

- 搜尋 Superpowers：

  ```bash
  superpowers
  ```

- 選擇 `Install Plugin`。

### Cursor

- 在 Cursor Agent chat 中，從市集安裝：

  ```text
  /add-plugin superpowers
  ```

- 或在外掛市集中搜尋「superpowers」。

### Factory Droid

- 註冊市集：

  ```bash
  droid plugin marketplace add https://github.com/obra/superpowers
  ```

- 安裝外掛：

  ```bash
  droid plugin install superpowers@superpowers
  ```

### Gemini CLI

- 安裝 extension：

  ```bash
  gemini extensions install https://github.com/obra/superpowers
  ```

- 之後更新：

  ```bash
  gemini extensions update superpowers
  ```

### GitHub Copilot CLI

- 註冊市集：

  ```bash
  copilot plugin marketplace add obra/superpowers-marketplace
  ```

- 安裝外掛：

  ```bash
  copilot plugin install superpowers@superpowers-marketplace
  ```

### Kimi Code

Superpowers 可在 Kimi Code 的外掛市集中取得。

- 開啟 Kimi Code 的外掛管理器：

  ```text
  /plugins
  ```

- 前往 `Marketplace` > `Superpowers` 並安裝。

- 或直接從這個 repository 安裝：

  ```text
  /plugins install https://github.com/obra/superpowers
  ```

- 詳細文件：[docs/README.kimi.md](../README.kimi.md)

### OpenCode

OpenCode 使用自己的外掛安裝方式；即使你已經在其他 harness 使用 Superpowers，也需要為 OpenCode 另外安裝。

- 告訴 OpenCode：

  ```text
  Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
  ```

- 詳細文件：[docs/README.opencode.md](../README.opencode.md)

### Pi

從這個 repository 安裝 Superpowers Pi package：

```bash
pi install git:github.com/obra/superpowers
```

本地開發時，可用目前 checkout 作為臨時 package 執行 Pi：

```bash
pi -e /path/to/superpowers
```

Pi package 會載入 Superpowers skills，並透過一個小型 extension 在 session startup 與 compaction 後注入 `using-superpowers` bootstrap。Pi 有原生 skills，因此不需要相容性的 `Skill` tool。Subagent 與 task-list tools 仍然是可選的 Pi companion packages。

## 基本工作流程

1. **brainstorming** - 在寫程式前啟動。透過提問細化粗略想法，探索替代方案，分段呈現設計以供確認，並儲存設計文件。

2. **using-git-worktrees** - 在設計核准後啟動。在新分支上建立隔離 workspace，執行專案 setup，並驗證乾淨的測試基線。

3. **writing-plans** - 在規格核准後啟動。把工作拆成小而明確的任務（每項 2-5 分鐘）。每個任務都有精確檔案路徑、完整程式碼與驗證步驟。

4. **subagent-driven-development** 或 **executing-plans** - 在計畫完成後啟動。針對每個任務派出 fresh subagent，並進行兩階段審查（先規格符合性，再程式碼品質），或用人工檢查點分批執行。

5. **test-driven-development** - 在實作期間強制 RED-GREEN-REFACTOR：先寫失敗測試，確認它失敗，寫最小程式碼讓它通過，再確認通過。刪除任何先於測試寫出的程式碼。

6. **requesting-code-review** - 在任務之間啟動。依照計畫審查，按嚴重度回報問題。Critical issues 會阻擋進度。

7. **finishing-a-development-branch** - 在任務完成時啟動。驗證測試，呈現選項（merge / PR / keep / discard），並清理 worktree。

**代理在任何任務前都會檢查相關技能。** 這些是強制工作流程，不是建議。

## 內容包含什麼

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle（包含 testing anti-patterns reference）

**Debugging**
- **systematic-debugging** - 四階段 root cause process（包含 root-cause-tracing、defense-in-depth、condition-based-waiting 技術）
- **verification-before-completion** - 確保問題真的已修復

**Collaboration**
- **brainstorming** - 蘇格拉底式設計釐清
- **writing-plans** - 詳細實作計畫
- **executing-plans** - 帶檢查點的批次執行
- **dispatching-parallel-agents** - 並行 subagent 工作流程
- **requesting-code-review** - 預先審查 checklist
- **receiving-code-review** - 回應回饋
- **using-git-worktrees** - 平行開發分支
- **finishing-a-development-branch** - Merge / PR 決策流程
- **subagent-driven-development** - 透過兩階段審查快速迭代（先規格符合性，再程式碼品質）

**Meta**
- **writing-skills** - 依循最佳實務建立新技能（包含測試方法）
- **using-superpowers** - 技能系統介紹

## 哲學

- **Test-Driven Development** - 永遠先寫測試
- **Systematic over ad-hoc** - 用流程取代猜測
- **Complexity reduction** - 以簡化作為首要目標
- **Evidence over claims** - 宣稱完成前先驗證

閱讀[原始發布公告](https://blog.fsck.com/2025/10/09/superpowers/)。

## 貢獻

Superpowers 的一般貢獻流程如下。請記住，我們通常不接受新增技能的貢獻，而且任何技能更新都必須能在我們支援的所有 coding agents 上運作。

1. Fork repository
2. 切換到 `dev` 分支
3. 為你的工作建立分支
4. 依照 `writing-skills` skill 建立並測試新增或修改的 skills
5. 提交 PR，並確實填寫 pull request template

Skill 行為測試使用 `evals/` 中的 eval harness submodule。Clone 這個 repo 後，執行 `git submodule update --init evals`，再查看 `evals/README.md` 了解 setup。Plugin infrastructure tests 位於 `tests/`，可透過對應的 `run-*.sh` 或 `npm test` 執行。

完整指南請見 `skills/writing-skills/SKILL.md`。

## 更新

Superpowers 的更新方式在一定程度上取決於 coding agent，但通常會自動更新。

## License

MIT License - 詳情請見 LICENSE file

## Community

Superpowers 由 [Jesse Vincent](https://blog.fsck.com) 和 [Prime Radiant](https://primeradiant.com) 的其他成員共同打造。

- **Discord**: [Join us](https://discord.gg/35wsABTejz) 取得社群支援、提問，並分享你用 Superpowers 建構的東西
- **Issues**: https://github.com/obra/superpowers/issues
- **Release announcements**: [Sign up](https://primeradiant.com/superpowers/) 以接收新版本通知
