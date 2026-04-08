# @weiping/openclaw-superpowers

> 14 個工作流技能，支持中文觸發詞，適用於 OpenClaw AI 助手

將 [pi-superpowers](https://github.com/weiping/pi-superpowers) 的 14 個專業工作流技能移植到 [OpenClaw](https://openclaw.ai) 平台。

## 安裝

```bash
openclaw plugins install @weiping/openclaw-superpowers
```

## 技能一覽

安裝後提供 **14 個技能**，支持中英文觸發：

| 技能 | 觸發場景 | 中文關鍵詞 |
|------|---------|-----------|
| `brainstorming` | 實現新功能前的需求分析 | 頭腦風暴、做一個新功能 |
| `writing-plans` | 將需求拆解為實現步驟 | 寫計劃、制定開發計劃 |
| `test-driven-development` | 功能實現或 Bug 修復 | TDD、測試驅動開發 |
| `systematic-debugging` | Bug 調試與根因分析 | 調試、找 bug、測試失敗 |
| `subagent-driven-development` | 按計劃執行多個任務 | 執行計劃、開始實現 |
| `requesting-code-review` | 完成任務後的代碼審查 | 代碼審查、code review |
| `verification-before-completion` | 聲明任務完成前 | 驗證完成、提交前驗證 |
| `finishing-a-development-branch` | 準備合併或發 PR | 完成分支、提 PR |
| `dispatching-parallel-agents` | 2+ 個可並行的獨立任務 | 並行處理、多任務並發 |
| `receiving-code-review` | 收到審查意見後 | 處理審查意見 |
| `executing-plans` | 批次執行已有計劃 | 按計劃實現、批次執行 |
| `using-git-worktrees` | 需要隔離工作區 | git worktree、隔離開發 |
| `writing-skills` | 創建或修改技能文件 | 寫 skill、創建新技能 |
| `using-superpowers` | 每次對話開始（自動觸發） | 自動觸發 |

## 提供的工具

插件註冊以下兼容工具，使 Skills 文档可以直接引用：

| 工具名 | 說明 |
|--------|------|
| `dispatch_agent` | 派發子代理執行獨立任務 |
| `TodoWrite` | 任務列表管理（引導使用 write/edit 操作 TODO.md） |

## 許可證

MIT
