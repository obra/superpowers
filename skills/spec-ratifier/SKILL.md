---
name: spec-ratifier
description: L2 spec 评审调度 — 按 spec §6 Tier 分发到 PM / 设计 / 研发 (+ 跨产品契约 owner) 评审；收齐 approval 后转 status draft→ratified；重生成 spec.html；触发 Flow MCP notify_spec_event。Triggers when user invokes spec-ratifier explicitly, or spec-author Step 15 hints chain after self-review all-PASS.
---

# Spec Ratifier（3 owner 评审 + status transition）

**Announce at start:** "I'm using the spec-ratifier skill to dispatch ratification review."

spec-ratifier 把 spec-author 起草完毕（status=draft，self-review all-PASS）的 L2 spec 推送给 3 owner 评审，收齐 approval 后转 status 到 ratified，并触发 Lark broadcast / audit log。

## When to use this skill

- spec-author Step 15 hints chain（self-review all-PASS 后）
- 用户手动说 "ratify spec X" / "把 spec 推给评审"
- Resume：cwd 有 draft spec.md 且 self-review checklist 已 PASS（spec-author 之前跑过）

## When NOT to use

- status ≠ draft（已 ratified/implementing/etc）→ 不重复 ratify
- self-review 没跑 / 有 FAIL → 先回 spec-author Step 15 修
- 用户想"先讨论一下" → 回 spec-author Step 1 wrap brainstorming

<HARD-GATE>
On entry, you MUST verify ALL of:
  1. spec.md frontmatter status: draft
  2. .harness/changes/<change_id>/self-review.md exists, has `result: pass`,
     and its `spec_sha` field equals sha256(spec.md) — proves the self-review
     is still valid for the current spec content (codex review B)
  3. FACIO_LARK_WEBHOOK_URL is set (M1 §11.2 #5 acceptance pre-req)

If ANY is missing, refuse to proceed:
  - missing self-review.md / stale sha → "Re-run spec-author Step 15"
  - missing webhook → "Configure FACIO_LARK_WEBHOOK_URL (Task 1 Step 4)"

You MUST NOT modify spec.md body — only frontmatter `status` field, via 
`scripts/spec-status.mjs` (the superpowers util installed by `init --harness`).
You MUST sequence: 
  1. transition status via spec-status.mjs
  2. regenerate spec.html
  3. commit (spec.md + spec.html + approvals.md together)
  4. call notify_spec_event AFTER commit
This ordering is required by notify_spec_event's strict state check — calling
before the transition is committed will fail with isError (by design).
</HARD-GATE>

## Checklist

You MUST create a TodoWrite task for each step:

1. **Step 1** — Pre-check: status=draft + self-review artifact valid (sha-bound) + webhook configured + mmdc available
2. **Step 2** — Read tier from §6, derive owner set
3. **Step 3** — Dispatch review: call `notify_spec_event(event="review_requested")` → REAL Lark broadcast with owners/link/deadline
4. **Step 4** — Collect 3 owner approvals → write `.harness/changes/<change_id>/approvals.md` (full 64-char sha-bound)
5. **Step 5** — Transition status draft → ratified (spec-status.mjs)
6. **Step 6** — Regenerate spec.html via mmdc (single commit: spec.md + spec.html + approvals.md)
7. **Step 7** — Call `notify_spec_event(event="ratified")` → REAL Lark broadcast; parse `lark_status`; retry-3 on failed
8. **Step 8** — Exit hint: chain to writing-plans (via Flow Skill HARD-GATE)

## Step 1 · Pre-check (machine-verifiable, codex review B)

```bash
# Must be in product repo with the target spec
SPEC=docs/superpowers/specs/<slug>.md
test -f "$SPEC" || { echo "✗ spec not found"; exit 1; }
STATUS=$(grep -E '^status:' "$SPEC" | head -1 | awk '{print $2}')
[ "$STATUS" = "draft" ] || { echo "✗ status=$STATUS, expected draft"; exit 1; }

# Read change_id from frontmatter
CHANGE_ID=$(grep -E '^change_id:' "$SPEC" | head -1 | awk '{print $2}')
REVIEW=".harness/changes/$CHANGE_ID/self-review.md"
test -f "$REVIEW" || { echo "✗ self-review.md missing — run spec-author Step 15"; exit 1; }

# Verify self-review result + sha freshness
grep -q '^result: pass' "$REVIEW" || { echo "✗ self-review.result != pass"; exit 1; }
REVIEW_SHA=$(grep -E '^spec_sha:' "$REVIEW" | awk '{print $2}')
CURRENT_SHA=$(shasum -a 256 "$SPEC" | awk '{print $1}')
[ "$REVIEW_SHA" = "$CURRENT_SHA" ] || \
  { echo "✗ self-review stale: review_sha=$REVIEW_SHA, current=$CURRENT_SHA — re-run Step 15"; exit 1; }

# Verify Lark webhook configured (M1 §11.2 #5)
[ -n "$FACIO_LARK_WEBHOOK_URL" ] || \
  { echo "✗ FACIO_LARK_WEBHOOK_URL not set (Task 1 Step 4 pre-req)"; exit 1; }

echo "✓ pre-check passed"
```

All-`✓` is the only valid entry condition. Any `✗` → halt, surface to user.

## Step 2 · Derive Owner Set from Tier

读 spec §6 决策（grep `^**决策**：` 或 frontmatter `tier:`）：

| Tier | Owner set |
|------|----------|
| Micro | 单 owner（若 author = engineer → PM / designer 自动 approve）|
| Normal | 3 owner 全 approve（PM + designer + engineer，frontmatter `owners.{pm,designer,engineer}`）|
| Large | 3 owner + 跨产品契约 owner（若 §5 涉及 `blueprint/contracts/`，则从 `blueprint/contracts/CODEOWNERS` 取） |

## Step 3 · Dispatch Review (REAL broadcast, codex 2nd-round #2)

**Lark broadcast 必经 — review dispatch 是独立 event，不与 Step 7 ratified 通知合并：**

`notify_spec_event(event="review_requested")` 是 dispatch 真实推送的工具入口。Step 3 完成 = review 已经发到 3 owner 群组，可以开始等 approval。

```
# 1. 构造 broadcast message body（caller 写完整文案，handler 不模板化关键字段）
SPEC_HTML_URL="https://github.com/<org>/<repo>/blob/<branch>/<spec.html relative path>"
DEADLINE=$(date -u -d "+2 weekdays" +"%Y-%m-%d" 2>/dev/null || date -v+2d +"%Y-%m-%d")
LARK_MESSAGE="[Spec review request] $CHANGE_ID
Tier: $TIER
Owners: pm=@pm-user, designer=@designer-user, engineer=@engineer-user
spec.html: $SPEC_HTML_URL
Deadline: $DEADLINE
Reply 'approve' / 'request changes' / 'reject' in this thread."

# 2. 先把 message 给 user 看（chat 确认文案）
echo "$LARK_MESSAGE"
# wait for user "ok"

# 3. 调 MCP tool 实际推送 — spec.status 仍是 draft，event=review_requested 校验通过
```

In Claude Code:

```
mcp__facio-flow__notify_spec_event({
  spec_path: "<relative path>",
  event: "review_requested",
  actor: "spec-ratifier",
  lark_message: "<full $LARK_MESSAGE content>"
})
```

**Exit 条件 of Step 3：** 返回值含 `lark_status: sent`。`failed` / `skipped` → retry 最多 3 次（间隔 30s）；3 次都失败 → escalate 用户，halt skill。

注意：spec.status 仍是 draft。Step 3 **不**写 audit entry 为"ratified"——`review_requested` 是独立 event，audit 中独立一行。

## Step 4 · Collect Approvals (auditable, codex review #2)

M1 收齐 approval 的机制 = **git-tracked artifact**，不是 chat 问答。每个 approver 给出明确 "approve" 后立刻写一行进 `.harness/changes/<change_id>/approvals.md`，包含可审计字段：

```bash
mkdir -p ".harness/changes/$CHANGE_ID"
APPROVALS=".harness/changes/$CHANGE_ID/approvals.md"
# 首次初始化（仅 header）
[ -f "$APPROVALS" ] || cat > "$APPROVALS" <<EOF
# Approvals · $CHANGE_ID

| role | approver | spec_sha | timestamp | note |
|------|----------|----------|-----------|------|
EOF
```

每收到一个 approver "approve" 时，spec-ratifier append 一行（**完整 64-char sha**，gate 用完整 sha 对比，避免截断错配 — codex 2nd-round #4）：

```bash
SPEC_SHA=$(shasum -a 256 "$SPEC" | awk '{print $1}')  # full 64 chars
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Required by Tier: PM / designer / engineer (Normal); skill 与每个 owner 单独确认
# 注意：用完整 sha，不截断。展示给人看时单独 print short = ${SPEC_SHA:0:12}
echo "| pm | @pm-user | $SPEC_SHA | $TS | $NOTE |" >> "$APPROVALS"
echo "| designer | @designer-user | $SPEC_SHA | $TS | $NOTE |" >> "$APPROVALS"
echo "| engineer | @engineer-user | $SPEC_SHA | $TS | $NOTE |" >> "$APPROVALS"
```

**spec_sha 字段是关键不变量**：approval 绑定到当时的 spec 内容。如果 spec 在某 approver approve 后又改了内容（spec_sha 变），后续 approver 看到 sha 不一致 → 必须重 approve 之前的所有 owner。

Step 4 出口条件（gate；全用完整 sha 对比）：

```bash
CURRENT_SHA=$(shasum -a 256 "$SPEC" | awk '{print $1}')
# All approval rows must reference the current sha
STALE=$(awk -F'|' -v cur="$CURRENT_SHA" 'NR>2 && $4 ~ /[a-f0-9]{64}/ && $4 !~ cur {print}' "$APPROVALS" | wc -l)
[ "$STALE" -eq 0 ] || { echo "✗ $STALE approval row(s) on stale spec_sha; re-collect"; exit 1; }
# All required roles present
for ROLE in pm designer engineer; do
  grep -qE "^\|\s*$ROLE\s*\|" "$APPROVALS" || { echo "✗ missing approval: $ROLE"; exit 1; }
done
echo "✓ all approvals fresh + complete"
```

如有 MUST FIX 反馈：
- 把 fix request 加到 spec §4 Open Issues + commit
- 回 spec-author Step 2 修改 → 重跑 Step 15 self-review（spec_sha 变了）
- approvals.md 全部失效（spec_sha 不匹配），需重新收集
- status 保持 draft（不转）

## Step 5 · Transition Status draft → ratified

调 superpowers util（M0 已实装，spec §4.5 + spec-status.mjs）：

```bash
node scripts/spec-status.mjs transition <spec.md> ratified
```

util 行为：
1. 校验合法转换（draft → ratified ∈ 合法表）
2. 改 frontmatter `status: draft` → `status: ratified`
3. 不 commit（caller 决定时机；本 step Step 6 一并 commit）

若 spec-status.mjs 不存在 → product repo 没 init 过 harness → 提示用户先 init。

## Step 6 · Regenerate spec.html

```bash
node scripts/generate-spec-html.mjs <spec.md>
```

**Single commit** with status change + html regen + approvals.md：

```bash
git add <spec.md> <spec.html> ".harness/changes/$CHANGE_ID/approvals.md"
git commit -m "$(cat <<'EOF'
chore(spec): ratify <change_id>

Tier: <Tier>
Approvers (see .harness/changes/<change_id>/approvals.md):
  - pm: @pm-user
  - designer: @designer-user
  - engineer: @engineer-user
Self-review: .harness/changes/<change_id>/self-review.md (15/15 PASS)

Co-Authored-By: spec-ratifier
EOF
)"
```

## Step 7 · Call notify_spec_event (POST-COMMIT, REQUIRED)

```javascript
// invoke Flow MCP tool — AFTER Step 6 commit because notify_spec_event reads
// spec.status from disk and verifies it equals "ratified" (strict state check,
// codex 1st-round #1).
mcp__facio-flow__notify_spec_event({
  spec_path: "<relative-path-from-flow-base>",
  event: "ratified",
  actor: "spec-ratifier",
  note: "approvers: pm=@pm-user, designer=@designer-user, engineer=@engineer-user",
  lark_message: "[Spec ratified] <change_id>\nApproved by 3 owners. Next: implementation will be planned by writing-plans.\nspec.html: <url>"
})
```

**Parse the response (codex 2nd-round #C):**

The tool returns text containing a `lark_status:` line. spec-ratifier MUST parse it:

| `lark_status` | Action |
|--------------|--------|
| `sent` | ✓ Step 7 complete; chain to Step 8 |
| `failed (...)` | Retry up to **3 times** with 30s backoff; if still `failed` → **escalate to user**, halt skill. Audit is persisted but §11.2 #5 acceptance is NOT satisfied |
| `skipped` | Means webhook env var missing — should have been caught by pre-check; halt skill |

**Failure modes table:**

| Symptom | Cause | Action |
|---------|-------|--------|
| `isError: true, status mismatch` | Step 5 transition 未先 commit / commit 失败 | 回 Step 5 修，重 Step 7 |
| `isError: true, spec not found` | spec_path 参数错（绝对 vs 相对）| 修参数重试 |
| `isError: true, rejected ... requires reason` | event=rejected 但无 note / rejected_reason | 补 note 重试 |
| Response contains `lark_status: failed` | webhook URL 失效 / Lark 服务暂时下线 | Retry 3 次（30s 间隔）；最终失败 escalate；§11.2 #5 未满足 |
| Response contains `lark_status: skipped` | `FACIO_LARK_WEBHOOK_URL` 未设 (pre-check 应阻拦) | halt；回 Task 1 Step 4 修复 |
| MCP 离线 / tool 不可达 | Flow MCP server down | 完整 halt：本地 commit 已发生但 audit / broadcast 未触发 → **不**视为 ratification 完成；必须等 MCP 恢复重跑 Step 7 |

## Step 8 · Exit Hint (codex 3rd-round Minor #3 + 4th-round F2: audit-backed proof)

Exit gate — verify the **audit trail itself**, not just chat-level response, because audit is the durable §11.2 #5 acceptance evidence:

```bash
AUDIT=~/.facio-flow/audit.jsonl
CHANGE_ID=$(grep -E '^change_id:' "$SPEC" | awk '{print $2}')
SPEC_SHA_AT_DISPATCH=<recorded from Step 3 spec_sha; spec was draft>
SPEC_SHA_AT_RATIFY=<recorded from Step 6 spec_sha; spec is ratified>

# For each of the two events, audit must have:
#   (a) one type=lifecycle_event row (review_requested doesn't transition status,
#       but it still records a lifecycle_event row capturing spec_sha at dispatch)
#   (b) at least one type=broadcast_attempt row with lark_status=sent
for EVENT_SHA_PAIR in "review_requested:$SPEC_SHA_AT_DISPATCH" "ratified:$SPEC_SHA_AT_RATIFY"; do
  EVENT="${EVENT_SHA_PAIR%%:*}"
  SHA="${EVENT_SHA_PAIR##*:}"
  KEY="${CHANGE_ID}:${EVENT}:${SHA}"

  # lifecycle_event row
  TRANS=$(awk -v k="$KEY" '$0 ~ "\"type\":\"lifecycle_event\"" && $0 ~ k {c++} END{print c+0}' "$AUDIT")
  [ "$TRANS" = "1" ] || { echo "✗ event=$EVENT: expected 1 lifecycle_event row, got $TRANS"; exit 1; }

  # at least one broadcast_attempt with lark_status=sent
  SENT=$(awk -v k="$KEY" '$0 ~ "\"type\":\"broadcast_attempt\"" && $0 ~ k && $0 ~ "\"lark_status\":\"sent\"" {c++} END{print c+0}' "$AUDIT")
  [ "$SENT" -ge 1 ] || { echo "✗ event=$EVENT: no broadcast_attempt with lark_status=sent"; exit 1; }

  echo "✓ event=$EVENT: 1 transition + ≥1 successful broadcast_attempt in audit"
done
```

如果任一 `✗` → **halt**：M1 §11.2 #5 acceptance 未满足，不要假装 ratification 完成。该状态下：
- 本地 commit (Step 6) 已发生且不撤销（spec.status 已是 ratified；这是真相）
- 但 broadcast 未真实送达 → 必须解决（webhook 修复、retry、escalate）
- 解决后重跑 Step 7 → 新的 broadcast_attempt row append（attempt 计数继续递增），直到 lark_status=sent 出现

Exit message（all-pass 时）：

```
✓ Status: draft → ratified (commit: <sha>)
✓ spec.html regenerated (sha256 in footer matches)
✓ Audit trail (~/.facio-flow/audit.jsonl):
  - review_requested: 1 lifecycle_event + N broadcast_attempts (last=sent)
  - ratified: 1 lifecycle_event + M broadcast_attempts (last=sent)
✓ Lark broadcasts: both events confirmed sent in durable audit log

Next: 
- Flow Skill HARD-GATE will detect ratified spec and chain to writing-plans
- Or: user can explicitly invoke writing-plans when ready to start implementation
```

<HARD-GATE>
Do NOT invoke writing-plans yourself. Let Flow Skill HARD-GATE pick it up on
the next user message, OR have the user invoke it explicitly. This keeps the
ratify → plan boundary clear in the audit trail.
</HARD-GATE>
