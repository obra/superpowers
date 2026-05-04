---
name: technical-design
description: Use when drafting or extending a Feishu technical design with PRD/TRD links or pasted requirements, resuming a TD session, recording open decisions without stopping the rest of the doc, or when the team asks for agentic TD authoring on Lark wiki.
---

# Technical Design (Feishu / Lark)

Agentic **TD** on Feishu wiki: lock inputs, clarify requirements, explore solutions, write by structure, record **待定** without halting unrelated sections, **resume** via TD + Edit Log.

## Hard rules

- **Ask TD placement first** each start/resume unless the user already gave the TD URL this turn.
- **REQUIRED SUB-SKILL:** **brainstorming** for clarification and solution exploration. Use **Brainstorming adaptation** so TD work does not hand off to `writing-plans` or repo `docs/superpowers/specs/`.
- **One blocked decision ≠ stop the TD** — keep writing sections that do not depend on it until the user explicitly pauses/stops.

## Feishu URLs

| Use | URL |
|-----|-----|
| Default parent (new **child** TD if none exists) | https://boke.feishu.cn/wiki/UWLFwotGRiwu5rkNkZacXhJAnJc |
| **New TD** — copy from template | https://boke.feishu.cn/wiki/YFikw56QTi4WmUkzNhkc25HanQe |

## 0) TD location

1. **Existing TD** → engineer provides **TD link** (authoritative body).
2. **No TD** → create child under default parent above, from template (team duplicate/copy flow).

## 1) Edit Log

- **Edit Log** sub-doc: progress, decisions, **未完成** (incl. 待定 with pointers into TD).
- If missing: **create**, link from TD (top or 相关文档).
- **Before edits:** read **TD + Edit Log** to restore progress (or user message if empty).
- **After a push:** update Edit Log — date, sections advanced, 未完成, links to Feishu **comments** or headings for 待定.

## 2) PRD / TRD

TD must trace to requirements. Get **PRD and/or TRD links**, or **pasted description** if no links. If thin → brainstorming before architecture locks.

## 3) Brainstorming adaptation

Use brainstorming for: gaps in PRD/TRD, constraints, success criteria, edge cases, and exploration **overview → by module → details** (options + trade-offs).

**TD overrides:** output is **Feishu TD + Edit Log**, not `docs/superpowers/specs/...`; **do not** require invoking **writing-plans** after brainstorming.

## 4) Writing order

Match template: **solution overview** → **by module** → **details** (data, APIs, flows, rollout, risks, testing as needed). Align terms with PRD/TRD; note deliberate deviations.

## 5) 待定 and comments

When info is missing or engineer says **待定** / decide later:

1. **Feishu comment** on the anchor (preferred): question, assumptions, options, what’s needed to decide, owner if known.
2. Else a **callout** under the heading (`待定` + same fields).
3. **Continue** other independent sections; log 待定 in **Edit Log** (location + link/path).

On answers: resolve comments/callouts, update Edit Log.

## 6) Stop condition

Stop authoring only on **explicit** pause/stop. Otherwise leave Edit Log ready for next session.

## Quick reference

| Case | Do |
|------|-----|
| Cold start | Ask TD link vs new under default parent |
| New TD | From template; wire Edit Log |
| Resume | Read TD + Edit Log |
| Ambiguous reqs | brainstorming |
| Blocked node | Comment + Edit Log; continue rest |
| Session end | Edit Log: progress + 未完成 |

## Common mistakes

- Resuming without reading TD + Edit Log.
- Treating one 待定 as full-stop — branch work.
- Designing on vague PRD without brainstorming.
- Letting brainstorming default to `writing-plans` — use adaptation.

## Red flags

- No agreed TD URL / parent for new doc.
- Guessing requirements instead of clarifying or citing.
- Dropping 待定 context before resolution.
