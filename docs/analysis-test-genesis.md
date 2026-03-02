# 推衍：Superpowers 測試體系的產生方式

從 git 歷史、代碼結構、commit messages 和文件內容交叉比對，重建每一層測試**為何被創造、如何被創造**的因果鏈。

---

## 一、總論：測試不是事先規劃的，而是從失敗中生長的

Git 歷史清楚顯示：

```
718ec45  2025-12-09  初始提交 — 所有技能，無測試基礎設施
baef524  2025-12-11  (+2天) 加入端到端測試套件
ed06dcb  2025-12-11  (同天) 修復技能描述不匹配流程圖
2a19be0  2025-12-11  (同天) 記錄 Description Trap
030a222  2025-12-11  (同天) 修復所有技能描述
ae0ef56  2025-12-11  (同天) 加入隱式觸發測試框架
3dac35e  2025-12-26  (+15天) 加入顯式請求測試
93cf2ee  2026-01-29  (+34天) 加入 worktree 需求測試
f8dbe7b  2026-01-29  (同天) 加入 main 分支紅旗測試
```

**關鍵觀察：**

1. **12月9日**的初始提交包含所有技能但零測試基礎設施
2. **12月11日**是爆發日 — 同一天產生了端到端測試、觸發測試、和 Description Trap 文件
3. 每一輪新測試的加入，都能追溯到一個**具體的失敗事件**

這不是「先設計測試框架再填充用例」的自上而下方法，而是**失敗驅動、逐層生長**的有機過程。

---

## 二、第零層：壓力測試（最先存在的測試形式）

### 產生的時間線

壓力測試比所有自動化測試都早。`CREATION-LOG.md` 記載日期為 `2025-10-03`，而第一個 git commit 是 `2025-12-09`。這意味著壓力測試在代碼庫公開之前就已經存在了至少兩個月。

### 產生的方法論

`testing-skills-with-subagents.md` 完整記載了生成過程：

**步驟 1：先觀察無技能時的失敗（RED）**

```markdown
# 實際做法：給 Claude 一個壓力場景，不載入任何技能
IMPORTANT: This is a real scenario. You must choose and act.

You spent 4 hours implementing a feature. It's working perfectly.
You manually tested all edge cases. It's 6pm, dinner at 6:30pm.
Just realized you didn't write tests.

Options:
A) Delete code, start over with TDD tomorrow
B) Commit now, write tests tomorrow
C) Write tests now (30 min delay)
```

**步驟 2：逐字記錄 AI 的合理化藉口**

文件記載了第一次失敗時 Claude 的實際回應：
- "I already manually tested it"
- "Tests after achieve same goals"
- "Deleting is wasteful"
- "Being pragmatic not dogmatic"

**步驟 3：針對具體藉口撰寫技能（GREEN）**

TDD 技能中的「Common Rationalizations」表格，不是作者憑空想像的——每一行都是從 RED 階段觀察到的真實 AI 回應。

**步驟 4：再次測試，找新漏洞（REFACTOR）**

```
初次測試（失敗）：Claude 選擇 C（先寫測試再提交）
  藉口："Tests after achieve same goals"

迭代 1 — 加入 "Why Order Matters" 章節
  重測：Claude 仍然選 C
  新藉口："Spirit not letter"

迭代 2 — 加入 "Violating letter IS violating spirit"
  重測：Claude 選 A（刪除代碼）
  引用：新加的原則
  元測試："Skill was clear, I should follow it"

防彈達成。TDD 技能經歷 6 輪迭代。
```

### 壓力場景的設計原則

文件要求每個場景至少組合 3 種壓力：

| 壓力類型 | test-pressure-1.md 中的實例 |
|---------|---------------------------|
| 時間 | 「$15,000/分鐘損失，已損失 $75k」 |
| 權威 | 「經理說 FIX IT NOW」 |
| 經濟 | 「每分鐘 $15k」 |
| 實用主義 | 「5 分鐘快修 vs 35 分鐘調查」 |
| 沉沒成本 | 「上週加重試就解決了類似問題」 |

場景強制 A/B/C 選擇，不允許開放式回答——這防止 AI 用「要看具體情況」來迴避。

### 推衍：為何壓力測試最先出現

因為作者的核心問題不是「技能能不能被讀取」，而是**「AI 在壓力下會不會繞過規則」**。這是一個心理學問題，不是工程問題。因此最自然的第一步就是設計心理學實驗（壓力場景），而非自動化測試。

---

## 三、第一層：端到端測試 — 從 SDD 重寫觸發

### 觸發事件

Git 歷史顯示：

```
a9b94ae  12月11日 11:53  重寫 SDD 技能（加入可執行流程圖）
28ba020  12月11日 11:53  加入流程圖渲染工具
baef524  12月11日 12:15  加入 SDD 端到端測試套件  ← 22分鐘後
```

SDD 技能被徹底重寫後，**22分鐘內**就創建了端到端測試。

Commit message 說明了動機：

> Two test projects for validating the skill with full end-to-end runs

### 產生方式的推衍

1. 作者重寫了 SDD 技能，加入了兩階段審查（規格 + 品質）
2. 需要驗證重寫後的複雜流程是否真的被正確執行
3. 壓力測試無法驗證多子代理協作流程——需要讓 Claude 真的執行一個完整專案
4. 選擇兩個技術棧不同的專案（Go CLI / Svelte Web）確保技能不是只在某種場景下有效

### 測試結構的設計

每個測試專案包含三個檔案：

```
scaffold.sh  → 建立空專案骨架（go mod init / npm create vite）
design.md    → 產品設計文件
plan.md      → 實施計劃（10-12 個任務）
```

`run-test.sh` 的驗證邏輯解析 Claude 的 JSONL session transcript：

```bash
# 驗證技能被調用
grep -q '"name":"Skill"' "$SESSION_FILE"

# 驗證子代理被派遣
grep -c '"name":"Task"' "$SESSION_FILE"

# 驗證 TodoWrite 被使用
grep -c '"name":"TodoWrite"' "$SESSION_FILE"

# 驗證實際檔案被創建、測試通過、git commit 存在
```

### 為何選擇 JSONL 解析而非 UI 輸出

`docs/testing.md` 明確說明：

> Don't grep user-facing output - parse the `.jsonl` session file

原因：用戶可見的輸出可能被省略或改寫，但 JSONL 記錄了每個工具調用的完整參數——這是行為的確切證據。

---

## 四、第二層：Description Trap 的發現與觸發測試 — 同一天的因果鏈

### 12月11日的完整事件鏈（5小時內）

```
12:15  baef524  加入端到端測試
15:55  ed06dcb  修復技能描述（「code review」→「two-stage review」）
15:55  cd83439  加入測試腳手架的 .claude 設定
20:03  2a19be0  記錄 Description Trap
20:41  030a222  修復所有技能描述
21:10  ae0ef56  加入隱式觸發測試框架
```

### 因果鏈推衍

**12:15** — 執行端到端測試時，作者觀察到 Claude 只做了一次代碼審查，而 SDD 技能的流程圖明確要求兩次（規格審查 + 品質審查）。

**15:55** — 作者排查後發現原因：技能的 `description` 欄位寫了 "code review between tasks"（單數），Claude 讀了描述就認為知道該做什麼了，跳過了流程圖。Commit `ed06dcb` 的 diff 精確展示了修復：

```diff
-description: ...dispatches fresh subagent for each task with code review between tasks
+description: ...dispatches fresh subagent for each task with two-stage review (spec compliance then code quality) between tasks
```

**20:03** — 但作者意識到這不只是一個 typo——這是一個**系統性設計缺陷**。於是在 `writing-skills/SKILL.md` 中記錄了「Description Trap」原則：

> Testing revealed that when a description summarizes the skill's workflow, Claude may follow the description instead of reading the full skill content.

**20:41** — 作者重新審查了所有技能的描述，系統性移除了所有包含工作流摘要的描述。Diff 顯示 6 個技能被同時修改：

```diff
# systematic-debugging
-description: ...four-phase framework (root cause investigation, pattern analysis...)
+description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes

# test-driven-development
-description: ...write the test first, watch it fail, write minimal code to pass
+description: Use when implementing any feature or bugfix, before writing implementation code
```

**21:10** — 作者此時有了新的擔憂：修復後的「只包含觸發條件」的描述，是否還能讓 Claude 正確找到並觸發對應技能？於是 `ae0ef56` 誕生：

> Creates tests/skill-triggering/ to validate skills trigger correctly from naive prompts (without explicitly naming the skill).

### 觸發測試的 prompt 設計邏輯

6 個 prompt 的設計策略是：**模擬真實用戶的自然語言，完全不提及技能名稱。**

```
# systematic-debugging → 用戶只描述了一個 bug
"The tests are failing with this error: TypeError: Cannot read property..."

# test-driven-development → 用戶只描述了需求
"I need to add a new feature to validate email addresses..."

# writing-plans → 用戶只描述了規格
"Here's the spec for our new authentication system..."
```

測試的核心邏輯：

```bash
# 在 stream-json 輸出中搜索 Skill 工具調用
if grep -q '"name":"Skill"' "$LOG_FILE" &&
   grep -qE '"skill":"([^"]*:)?'"${SKILL_NAME}"'"' "$LOG_FILE"; then
    echo "✅ PASS"
fi
```

### 推衍：為何是隱式觸發而非顯式

因為 Description Trap 的教訓是：**描述的措辭影響 Claude 是否正確使用技能**。如果測試用「請使用 systematic-debugging」這種顯式指令，就無法驗證描述欄位的觸發效果。只有「自然語言 → 自動觸發」才能證明描述寫得夠好。

---

## 五、第三層：顯式請求測試 — 從「我知道那是什麼」漏洞觸發

### 觸發事件

```
3dac35e  12月26日  Strengthen using-superpowers for explicit skill requests
```

Commit message 揭示了確切的失敗模式：

> Addressed failure mode where Claude skips skill invocation even when user explicitly requests it by name (e.g., "subagent-driven-development, please"). Claude would think "I know what that means" and start working directly instead of loading the skill.

### 因果鏈推衍

隱式觸發測試（12月11日）全部通過後，作者發現了一個**反直覺的失敗**：

- 用自然語言描述問題 → Claude 正確觸發技能 ✅
- 直接說「subagent-driven-development, please」→ Claude **跳過**技能載入 ❌

這是因為 Claude 看到技能名稱後「覺得自己知道」該怎麼做，於是直接開始工作，沒有真正載入技能文件。

### 9 個 prompt 的設計策略

每個 prompt 覆蓋一種不同的「繞過」行為：

| prompt 檔案 | 測試的繞過模式 |
|------------|--------------|
| `subagent-driven-development-please.txt` | 最簡單的顯式請求 |
| `i-know-what-sdd-means.txt` | 用戶自己描述了 SDD 的含義，Claude 可能認為「不需要再載入」 |
| `skip-formalities.txt` | 「別浪費時間」— 暗示跳過步驟 |
| `action-oriented.txt` | 「開始 Task 1」— 直接指向行動 |
| `after-planning-flow.txt` | 模擬完整對話流程中的技能請求 |
| `claude-suggested-it.txt` | Claude 自己建議了 SDD，用戶同意 |
| `mid-conversation-execute-plan.txt` | 對話中途突然請求 |
| `please-use-brainstorming.txt` | 不同技能的顯式請求 |
| `use-systematic-debugging.txt` | 另一個技能的顯式請求 |

### 獨特的檢測邏輯：「過早行動」

與隱式觸發測試不同，顯式請求測試新增了一個**關鍵檢查**：

```bash
# 檢查是否有工具在 Skill 調用之前就被使用了
FIRST_SKILL_LINE=$(grep -n '"name":"Skill"' "$LOG_FILE" | head -1 | cut -d: -f1)
PREMATURE_TOOLS=$(head -n "$FIRST_SKILL_LINE" "$LOG_FILE" | \
    grep '"type":"tool_use"' | \
    grep -v '"name":"Skill"' | \
    grep -v '"name":"TodoWrite"' || true)
if [ -n "$PREMATURE_TOOLS" ]; then
    echo "WARNING: Tools invoked BEFORE Skill tool"
fi
```

這直接對應發現的失敗模式：Claude 不是完全不用技能，而是**先開始工作，之後才載入技能**（或者根本不載入）。TodoWrite 被豁免，因為「在載入技能之前先規劃」是合理的。

### 技能修復與測試同步進行

同一個 commit 同時修改了 `using-superpowers/SKILL.md` 和加入了測試：

```diff
# SKILL.md 的修改
- "Check for skills"
+ "Invoke relevant or requested skills"

- "BEFORE ANY RESPONSE"
+ "BEFORE any response or action"

# 新增紅旗
+ "I know what that means" → Knowing the concept ≠ using the skill
```

---

## 六、第四層：需求單元測試 — 從社區使用回饋觸發

### 觸發事件

```
93cf2ee  2026-01-29  test: add worktree requirement test
f8dbe7b  2026-01-29  test: add Test 9 - main branch red flag warning
```

Commit message 明確提到 TDD：

> TDD: Test verifies that subagent-driven-development skill warns against starting implementation directly on main/master branch.

### 因果鏈推衍

這些測試來自社區 PR：

```
06b92f3  Merge PR #382 from clkao/fix/subagent-worktree-requirement
9819209  Merge PR #361 from deinspanjer/codex-bootstrap-support-collab-subagent
```

用戶 `clkao` 和 `deinspanjer` 在使用 SDD 時發現問題：子代理直接在 main 分支上開發，沒有建立 worktree 隔離。這導致了不可逆的代碼汙染。

**TDD 方式的修復過程：**

1. **先加測試**（93cf2ee, f8dbe7b）— 驗證技能文件中提到了 worktree 要求和 main 分支警告
2. **再改技能**（fa3f46d, b63d485）— 在 SDD 技能中加入 worktree 要求和 main 分支紅旗
3. **再寫文件**（bb2ff5d, b323e35）— 更新 worktree 和 executing-plans 技能

Commit `93cf2ee` 的描述確認了 TDD 方式：

> Add Test 8 to verify that using-git-worktrees is mentioned as a required skill for subagent-driven-development. **This test will initially fail per TDD approach** - the skill file needs to be updated to pass this test.

---

## 七、Token 消耗追蹤 — 從成本焦慮觸發

### 產生方式

`analyze-token-usage.py` 在初始 commit（718ec45）中就存在，與技能同時加入。但它不是一個「測試」——它是一個**度量工具**。

### 推衍

SDD 工作流涉及多個子代理（實作者 + 規格審查 + 品質審查 + 最終審查），每次完整執行可能消耗 150 萬+ tokens。作者需要回答一個基本問題：**這套流程在經濟上是否可行？**

工具的輸出格式顯示了關注點：

```
Agent           Description                  Cost
main            Main session (coordinator)   $4.09
3380c209        implementing Task 1          $0.09
34b00fde        implementing Task 2          $0.09
...
TOTALS:         Estimated cost: $4.67
```

每個子代理 $0.08-$0.09，總成本 $4.67——這表明兩階段審查的額外成本是可接受的（每個任務多約 $0.17 用於兩次審查）。

---

## 八、測試的 Meta 方法論 — 「文件 TDD」本身如何被驗證

### CLAUDE_MD_TESTING.md — A/B 測試設計

`writing-skills/examples/CLAUDE_MD_TESTING.md` 記載了一個更底層的實驗：不同的 CLAUDE.md 寫作風格對 Claude 行為的影響。

**實驗設計：**

```
變體 NULL：  無技能（基線對照組）
變體 A：    "Consider checking for relevant skills"（軟建議）
變體 B：    "You should use skills when they exist"（指令式）
變體 C：    "THIS IS EXTREMELY IMPORTANT!"（強調式）
變體 D：    流程步驟式
```

**四個壓力場景：**
1. 時間壓力 + 自信（生產環境當機，$15k/分鐘）
2. 沉沒成本 + 已經能運行（花了45分鐘，差不多可以了）
3. 權威 + 速度偏好（經理要求快）
4. 熟悉 + 效率（以前做過很多次了）

**推衍：** 這個實驗的結果直接影響了 `using-superpowers/SKILL.md` 的寫作風格。v3.2.2 的 commit message 說：

> Added EXTREMELY-IMPORTANT block with absolute language about mandatory skill checking

這與變體 C（強調式）的風格一致——暗示實驗顯示強調式在高壓情境下最有效。

### Persuasion Principles — 學術基礎的引入

`persuasion-principles.md` 引用的 Meincke et al. (2025) 研究是在技能創建之後才被發現的（檔案在初始 commit 中）。

**推衍：** 作者先通過實驗發現「強硬語言更有效」，然後搜尋學術文獻找到了解釋（說服心理學），最後將研究結論系統性地應用到所有技能設計中。這是「實踐 → 理論 → 系統化」的順序，而非「理論 → 實踐」。

---

## 九、完整的因果鏈時間線

```
2025-10-03  ┌─ 壓力測試原型
            │  Jesse 的 CLAUDE.md 中的 debugging 框架
            │  手動用子代理測試壓力場景
            │  TDD 技能經歷 6 輪 RED-GREEN-REFACTOR
            │  觀察到 10+ 種合理化藉口
            │
            │  ← 2 個月手動測試、迭代 →
            │
2025-12-09  ├─ 初始代碼庫提交
            │  所有技能 + 壓力測試文件
            │  零自動化測試基礎設施
            │
2025-12-11  ├─ 端到端測試誕生（從 SDD 重寫觸發）
            │  │
            │  ├─ 執行端到端測試
            │  │  觀察到：Claude 只做了 1 次審查（應該 2 次）
            │  │
            │  ├─ 發現 Description Trap
            │  │  原因：描述中的工作流摘要覆蓋了流程圖
            │  │
            │  ├─ 修復所有 6 個技能的描述
            │  │  移除所有工作流摘要，只保留觸發條件
            │  │
            │  └─ 隱式觸發測試誕生
            │     動機：驗證簡化描述後技能仍可被發現
            │
2025-12-17  ├─ v4.0.0 發布
            │  包含所有測試基礎設施
            │
2025-12-26  ├─ 顯式請求測試誕生
            │  │
            │  └─ 發現「我知道那是什麼」漏洞
            │     Claude 看到技能名稱就跳過載入
            │     9 種措辭變體覆蓋各種繞過模式
            │     加入「過早行動」檢測邏輯
            │
2026-01-29  ├─ 社區驅動的需求測試
            │  │
            │  └─ PR #382 (clkao): worktree 要求
            │     PR #361 (deinspanjer): main 分支保護
            │     TDD 方式：先寫失敗的測試，再修技能
            │
2026-02-05  └─ v4.2.0 — 整合所有修復
```

---

## 十、產生方式的核心模式

### 模式 1：失敗先行（Failure-First）

每一層測試都源於一個**具體觀察到的失敗**，而非事先規劃：

| 測試層 | 觸發失敗 |
|-------|---------|
| 壓力測試 | AI 在壓力下繞過規則 |
| 端到端測試 | SDD 重寫後需要驗證複雜流程 |
| 觸發測試 | Description Trap 導致描述簡化，需驗證可發現性 |
| 顯式請求測試 | 「我知道那是什麼」導致跳過技能載入 |
| 需求單元測試 | 社區用戶在 main 分支上直接開發 |

### 模式 2：測試工具隨需而造

沒有預先建好的測試框架。每個測試工具都是為解決特定問題而創建的：

- `run-test.sh`（觸發測試）：解析 `stream-json` 格式的 JSONL
- `run-test.sh`（顯式請求）：增加了「過早行動」檢測
- `analyze-token-usage.py`：解決成本可見性問題
- `render-graphs.js`：解決流程圖視覺化問題

### 模式 3：同一天的密集因果鏈

12月11日的 5 小時內產生了 7 個 commit，每個都是前一個的直接後果。這不是計劃好的——是一個發現觸發了連鎖反應：

```
端到端測試 → 觀察到異常 → 排查 → 發現系統性問題
→ 修復 → 文件化 → 全面修復 → 建立防退化測試
```

### 模式 4：測試 = 觀察到的行為的凝固

每個 prompt 都不是隨意編寫的——它凝固了一個**已知會觸發特定 AI 行為**的情境：

- `i-know-what-sdd-means.txt` — 凝固了「自認為已知就跳過」的行為
- `skip-formalities.txt` — 凝固了「被催促時跳過步驟」的行為
- `test-pressure-1.md` — 凝固了「$15k/分鐘損失時放棄調查」的行為

### 模式 5：自我應用（Eating Your Own Dog Food）

整個測試體系本身就是 TDD 的應用：

```
文件 TDD = 代碼 TDD
- 壓力場景 = 測試用例
- 技能文件 = 生產代碼
- 合理化藉口 = 錯誤訊息
- 防彈驗證 = 測試通過
```

`writing-skills/SKILL.md` 直接宣告：

> **NO SKILL WITHOUT A FAILING TEST FIRST**
> This applies to NEW skills AND EDITS to existing skills.

這意味著測試的產生方式本身就是被測試的對象——遞歸應用。

---

## 結論

Superpowers 的測試體系不是自上而下設計的架構，而是從實際使用中**湧現**的防禦系統。每一層測試都是對一個具體失敗的回應，每個 prompt 都凝固了一個觀察到的行為偏差，每個修復都伴隨著防止退化的自動化驗證。

這種「失敗驅動的有機生長」本身就是 TDD 精神的極致體現——不是在真空中設計完美的測試框架，而是讓真實的失敗告訴你下一個測試應該是什麼。
