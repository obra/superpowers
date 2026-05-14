---
name: promote_context_to_spec
description: Upgrade-bridge skill — promotes a Flow context (轻路径 discussion) into an L2 spec (重路径). Per spec §10.2 5-step contract. Triggers when (a) user invokes `/promote_context_to_spec <context_id>`, (b) flow-brainstorming末尾 self-detects discussion involves ≥3 files / new capability / cross-module impact, OR (c) user says "这个看起来挺大的 / 影响多个模块 / 应该有 spec". Loads context via `get_context`, extracts L2 raw material (goal/decisions/open_issues), invokes spec-author Step 2 pre-populated, then preserves the context via `append_to_context` (PROMOTED marker) + `cancel_context` (audit-preserving end-state). The "promoted_to_spec_<id>" semantics from spec §10.2 are realized via append+cancel since Flow MCP ContextStatus enum does not include that value (M4a design decision; M4b backlog evaluates enum extension).
---

# Promote Context to Spec

Upgrade-bridge skill. Converts an active Flow context (轻路径 discussion) into a
new L2 spec (重路径) per spec §10.2's 5-step contract.

**Design note (M4a)**: spec §10.2 literally says "status: promoted_to_spec_<new_spec_id>",
but Flow MCP `ContextStatus` enum is `open | deciding | decided | claimed | closed |
cancelled | split` — no `promoted_*` value. M4a realizes spec §10.2's intent
("不删除（保留作审计源）") via:

1. `append_to_context` — writes `PROMOTED_TO_SPEC: <spec_path>` marker into context body
2. `cancel_context` — transitions to `cancelled` (audit-preserving; context not deleted)

This is equivalent semantically: the context stays queryable via
`list_contexts(status=["cancelled"])` for audit; the body marker records the
spec link. **Do not extend Flow MCP enum within M4a** — that's a separate PR
scope tracked in M4b backlog.

## When to invoke (trigger detection)

Triggered by any of:

1. **Explicit user command**: `/promote_context_to_spec <context_id>` slash invocation
2. **flow-brainstorming self-detection**: at the end of brainstorming, if the
   discussion involved ≥3 files OR proposed a new capability OR crosses module
   boundaries → flow-brainstorming end-hint suggests this skill
3. **User statement**: "这个看起来挺大的" / "影响多个模块" / "应该有 spec" /
   "我们升级到重路径" / "promote to spec"

## Inputs

- `context_id` (required) — Flow context ID (e.g., `vattention-2026-05-14-001`)
- `target_repo` (optional) — if context spans multi-repo, prompt user which repo
  hosts the new L2 spec; default = cwd repo

## Pre-conditions

- Context exists: `get_context(context_id)` returns non-null
- **Context status = `open` ONLY** (M4a F1 patched per codex Round 1 P1):
  - `append_to_context` rejects non-open contexts
  - `cancel_context` MCP description says "Only open/decided", but underlying
    `ContextStore.cancel()` (facio-flow/src/mcp-server/store/context-store.ts:828)
    only accepts `open | deciding` — throws on `decided`. **MCP description ≠
    store reality**; until that facio-flow bug is fixed, M4a takes the safe
    intersection = `open` only.
  - `decided` / `deciding` / `claimed` / `closed` / `cancelled` / `split`:
    halt with explanation. M4b backlog evaluates either (a) facio-flow store
    extends to accept `decided`, or (b) promote skill auto-`reopen` (transition
    decided → open) before append+cancel.
- Target repo has Harness scaffold (cwd has `docs/superpowers/specs/` dir)

## Process

### Step 1: Load context

```text
mcp__facio-flow__get_context(contextId=<context_id>)
```

Capture:
- `context.goal` — top-level user goal
- `context.discussion[]` — append history (decisions, open issues, constraints)
- `context.test_cases[]` (if decided) — acceptance criteria draft
- `context.product` / `context.version` — for routing

If status ≠ `open` → halt with explanation (per Pre-conditions above; F1 codex P1 patched); do NOT proceed.

### Step 2: Extract L2 spec raw material

Map context → L2 spec sections per spec §10.2 Step 2:

| Context field | → L2 spec destination |
|---------------|----------------------|
| `context.goal` | §1 产品视角 → "产品逻辑" (first paragraph) |
| `context.discussion[]` decisions | §3 研发视角 → "技术架构" + "复杂模块拆解" |
| `context.discussion[]` open issues | §4 Cross-viewpoint Open Issues |
| `context.test_cases[]` | §1 产品视角 → "验收标准 (AC)" |
| `context.product` | spec frontmatter `owners.engineer:` (default current user) |

Produce a structured pre-populated material dict (not the full spec — that's
spec-author's job in Step 3).

### Step 3: Invoke spec-author Step 2 pre-populated

```text
Skill(spec-author)
```

When spec-author launches, it enters Step 1 (intent判定). Since this skill has
already done the intent extraction, spec-author should detect a `PROMOTE_FROM_CONTEXT`
context-bridge marker (passed via conversation context) and skip Step 1
brainstorming wrap (intent already clarified). spec-author Step 2 then uses the
pre-populated material as the seed for §1-§3 drafting.

**Spec stub path**: `docs/superpowers/specs/<YYYY-MM-DD>-<context_slug>.md` where
`<context_slug>` is derived from `context.goal` (snake-case-to-kebab,
max 40 chars).

If spec-author fails (validation error, user abort, etc.) → halt; do NOT execute
Step 4 (don't pollute the context with PROMOTED marker if the spec doesn't exist).

### Step 4: Mark context promoted (append + cancel)

After spec-author successfully drafts the spec stub (file exists at
`<spec_path>`):

```text
mcp__facio-flow__append_to_context(
  contextId=<context_id>,
  content="PROMOTED_TO_SPEC: <spec_path> on <YYYY-MM-DD> by promote_context_to_spec skill.

Original context preserved as audit source per spec §10.2 intent.
Flow MCP ContextStatus enum (M4a) lacks `promoted_*` value; equivalent realized via
this append marker + subsequent cancel_context.

Spec authored: <spec_path>
Spec status (initial): draft (will progress via spec-ratifier → ratified → implementing → ...)
",
  authorType="agent"
)
```

Then:

```text
mcp__facio-flow__cancel_context(contextId=<context_id>)
```

Verify post-condition: `get_context(context_id)` returns `status: cancelled`;
discussion[] contains the PROMOTED marker. **Do not** call `close_context` — that
requires `claimed` status which we explicitly excluded.

### Step 5: Hint chain → spec-author Step 3

```
✓ promote_context_to_spec complete
  Source context: <context_id> (now status: cancelled, preserved as audit)
  New spec: <spec_path> (status: draft)
  Spec frontmatter: change_id=<...>, owners.engineer=<...>

  Next: continuing in spec-author Step 3 — draft §1-§7 three viewpoints + §K knowledge references
```

Flow control: this skill terminates; spec-author Step 3 takes over (already
invoked via Step 3 of this skill).

## After execution · Hint Chain

```
✓ promote_context_to_spec
  context_id: <id> → status: cancelled (audit-preserved with PROMOTED marker)
  spec_path: <path> → status: draft (handed to spec-author)
  Equivalent to spec §10.2 "promoted_to_spec_<id>" semantics; Flow MCP enum
  extension deferred to M4b backlog.
```

<HARD-GATE>
After promote_context_to_spec:
- MUST verify context status = `open` BEFORE any mutation (Step 1 gate; F1 codex P1 patched)
- MUST invoke spec-author SUCCESSFULLY before append + cancel (Step 3 must produce a real spec file)
- MUST NOT touch context if spec-author fails (rollback = no-op on context state)
- MUST use append_to_context + cancel_context, NEVER attempt to set status="promoted_to_spec_*"
  (that value is not in the MCP enum; Tool will reject)
- MUST chain to spec-author Step 3 (continue drafting) — do NOT terminate before spec is reviewable
</HARD-GATE>
