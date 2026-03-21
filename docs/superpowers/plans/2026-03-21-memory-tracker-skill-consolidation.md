# Memory Tracker Skill Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `memory-bootstrap` into `memory-tracker` so memory recording uses one skill with progressive structure introduction only when needed.

**Architecture:** Keep `skills/memory-tracker/` as the only memory skill entry point. Move bootstrap templates under that skill, keep `SKILL.md` focused on steady-state recording, place cold-start/repair instructions in a separate supporting file, and remove all repository references that still describe a two-skill workflow.

**Tech Stack:** Markdown skills and templates

**Spec:** `docs/superpowers/specs/2026-03-21-memory-tracker-skill-consolidation-design.md`

---

## File Map

- **Modify:** `skills/memory-tracker/SKILL.md` - replace cross-skill prerequisite flow with single-skill progressive bootstrap rules
- **Create:** `skills/memory-tracker/bootstrap.md` - low-frequency cold-start and structure-repair instructions
- **Create:** `skills/memory-tracker/template/TYPE.md` - moved router template from `memory-bootstrap`
- **Create:** `skills/memory-tracker/template/type/base/MEMORY.md` - moved base type template
- **Create:** `skills/memory-tracker/template/type/base/entry.md` - moved base entry template
- **Create:** `skills/memory-tracker/template/type/milestone/MEMORY.md` - moved default type template with updated entry-template path
- **Create:** `skills/memory-tracker/template/type/milestone/entry.md` - moved default entry template
- **Create:** `skills/memory-tracker/template/type/debug/MEMORY.md` - moved default type template with updated entry-template path
- **Create:** `skills/memory-tracker/template/type/debug/entry.md` - moved default entry template
- **Create:** `skills/memory-tracker/template/type/refactor/MEMORY.md` - moved default type template with updated entry-template path
- **Create:** `skills/memory-tracker/template/type/refactor/entry.md` - moved default entry template
- **Modify:** `README.md` - describe memory as a single-skill workflow
- **Delete:** `skills/memory-bootstrap/SKILL.md`
- **Delete:** `skills/memory-bootstrap/template/` - all moved into `skills/memory-tracker/template/`

---

## Task 1: Consolidate Template Ownership

**Files:**
- Create: `skills/memory-tracker/template/TYPE.md`
- Create: `skills/memory-tracker/template/type/base/MEMORY.md`
- Create: `skills/memory-tracker/template/type/base/entry.md`
- Create: `skills/memory-tracker/template/type/milestone/MEMORY.md`
- Create: `skills/memory-tracker/template/type/milestone/entry.md`
- Create: `skills/memory-tracker/template/type/debug/MEMORY.md`
- Create: `skills/memory-tracker/template/type/debug/entry.md`
- Create: `skills/memory-tracker/template/type/refactor/MEMORY.md`
- Create: `skills/memory-tracker/template/type/refactor/entry.md`

- [ ] **Step 1: Copy all bootstrap template files into `skills/memory-tracker/template/`**

Copy the router, base, and default-type templates from `skills/memory-bootstrap/template/` into matching paths under `skills/memory-tracker/template/` without changing their content yet.

- [ ] **Step 2: Update moved type templates to reference the new entry-template paths**

Change each `## Entry Template` path from a skill-template path to the injected docs path:

```md
`skills/memory-bootstrap/template/type/<type>/entry.md`
```

to:

```md
`docs/superpowers/memory/<type>/entry.md`
```

- [ ] **Step 3: Verify the resulting template tree is complete**

Confirm these paths exist:

```text
skills/memory-tracker/template/TYPE.md
skills/memory-tracker/template/type/base/MEMORY.md
skills/memory-tracker/template/type/base/entry.md
skills/memory-tracker/template/type/milestone/MEMORY.md
skills/memory-tracker/template/type/milestone/entry.md
skills/memory-tracker/template/type/debug/MEMORY.md
skills/memory-tracker/template/type/debug/entry.md
skills/memory-tracker/template/type/refactor/MEMORY.md
skills/memory-tracker/template/type/refactor/entry.md
```

- [ ] **Step 4: Commit**

```bash
git add skills/memory-tracker/template
git commit -m "refactor(memory): move bootstrap templates into tracker"
```

---

## Task 2: Rewrite `memory-tracker` as the Single Entry Skill

**Files:**
- Modify: `skills/memory-tracker/SKILL.md`

- [ ] **Step 1: Keep the frontmatter trigger minimal**

Retain a description focused on when the skill applies, not on workflow details. Keep it centered on recording closed, reviewable change units in `docs/superpowers/memory/`.

- [ ] **Step 2: Rewrite the prerequisite section into a progressive structure rule**

Replace the existing `run memory-bootstrap first` language with a single-skill rule covering:

```md
- If `docs/superpowers/memory/` or `docs/superpowers/memory/TYPE.md` is missing, read the supporting bootstrap file, restore the minimum structure needed for the current unit, then restart discovery.
- If the target type exists but its current month bucket is missing, create only that `entries/<YYYY-MM>/` directory.
- If no existing type fits, do not invent one silently; confirm the new type with the user, then add the minimum router and type structure before recording.
```

- [ ] **Step 3: Keep discovery repository-driven and concise**

Preserve the current discovery order (`TYPE.md` -> type `MEMORY.md` -> entry template -> type TOC update), and keep the rule that type meaning comes from repository docs rather than this skill.

- [ ] **Step 4: Add the minimum structure contract without over-explaining templates**

State the hard requirements clearly:

```md
- initial default taxonomy may be created from templates when memory structure is absent
- new types require updating `docs/superpowers/memory/TYPE.md`
- the target type must have `MEMORY.md` and `entries/<YYYY-MM>/` before writing an entry
```

Do not add a long mapping table of every template file or keep cold-start instructions inline in `SKILL.md`.

- [ ] **Step 5: Add the confirmed-new-type branch using base templates**

Make the skill explicitly state that, after the user confirms a new type, the agent should use:

```md
skills/memory-tracker/template/type/base/MEMORY.md
skills/memory-tracker/template/type/base/entry.md
```

as the starting templates inside the supporting bootstrap file, then update `docs/superpowers/memory/TYPE.md`, create `docs/superpowers/memory/<type>/MEMORY.md`, create `docs/superpowers/memory/<type>/entry.md`, set the `Entry Template` field to that docs path, and create `docs/superpowers/memory/<type>/entries/<YYYY-MM>/` before writing the entry.

- [ ] **Step 6: Update error handling to match the new flow**

Replace `initialize defaults via memory-bootstrap` with wording that points to the same skill's supporting bootstrap file, and keep the existing stop conditions for missing commits, unclear type choice, and path collisions.

- [ ] **Step 7: Read the whole file once for brevity**

Remove repeated explanations, keep only decision-making rules, and ensure the final file still matches the user's preference that `SKILL.md` contain only necessary information.

- [ ] **Step 8: Commit**

```bash
git add skills/memory-tracker/SKILL.md
git commit -m "refactor(memory): merge bootstrap flow into tracker skill"
```

---

## Task 3: Remove the Old Skill and Update Repository References

**Files:**
- Modify: `README.md`
- Delete: `skills/memory-bootstrap/SKILL.md`
- Delete: `skills/memory-bootstrap/template/`

- [ ] **Step 1: Update `README.md` to describe a single memory skill**

Replace the paired-skill references with a single description along these lines:

```md
**memory-tracker** - Records closed reviewable change units in `docs/superpowers/memory/`, discovering repository-defined types and progressively introducing missing structure only when needed.
```

Apply that change both in the top workflow summary and in the skills catalog.

- [ ] **Step 2: Search the repo for remaining `memory-bootstrap` references**

Run a repository search and ensure only intentional historical references remain, such as the design spec for this consolidation. Update any active workflow docs that still instruct agents to invoke `memory-bootstrap`.

- [ ] **Step 3: Delete the old skill directory after references are migrated**

Remove `skills/memory-bootstrap/SKILL.md` and the now-duplicated template subtree.

- [ ] **Step 4: Verify no active docs still require the deleted skill**

Run a final search expecting matches only in:

```text
docs/superpowers/specs/2026-03-21-memory-tracker-skill-consolidation-design.md
```

If other non-historical docs still reference it, update them before continuing.

- [ ] **Step 5: Commit**

```bash
git add README.md skills/memory-tracker skills/memory-bootstrap
git commit -m "refactor(memory): remove standalone bootstrap skill"
```

---

## Task 4: Verify the Consolidated Skill Contract

**Files:**
- Verify: `skills/memory-tracker/SKILL.md`
- Verify: `skills/memory-tracker/template/**/*`
- Verify: `README.md`

- [ ] **Step 1: Read `skills/memory-tracker/SKILL.md` against the spec checklist**

Confirm it now states all of the following:

```text
single memory skill entry point
repository-driven type discovery
progressive structure creation when missing
explicit user confirmation before adding a new type
no dependency on memory-bootstrap
```

- [ ] **Step 2: Verify moved template paths are internally consistent**

Check that each default type `MEMORY.md` points at its sibling `entry.md` under `skills/memory-tracker/template/type/...` and that the base/router templates are present for first-time structure creation.

- [ ] **Step 3: Verify documentation consistency**

Check that `README.md` no longer presents memory as a two-skill workflow.

- [ ] **Step 4: Run lightweight repository checks**

Run:

```bash
git diff --stat
rg -n "memory-bootstrap" README.md skills docs/superpowers/specs
```

Expected:
- diff shows only the planned memory-skill/docs/template changes
- `rg` finds `memory-bootstrap` only in the historical consolidation spec (and optionally in commit history, not in active skills/docs)
