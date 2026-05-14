# Harness Evaluator Prompt Template

Dispatch this template via Task tool from `expert-reviewer` skill.
Read this file, fill the 6 placeholders, then pass the filled prompt to Task tool (general-purpose agent).

**Placeholders to fill:**
- `{SPEC_PATH}` — e.g. `docs/superpowers/specs/2026-05-14-add-fast-forward.md`
- `{CHANGE_ID}` — spec filename without `.md`
- `{BASE_SHA}` — output of `git merge-base HEAD main`
- `{HEAD_SHA}` — output of `git rev-parse HEAD`
- `{TIER}` — `Micro` | `Normal` | `Large`
- `{ITERATION}` — current review iteration number (1-based)

---

```
Task tool (general-purpose):
  description: "Harness evaluator — 10-item Harness-specific code review"
  prompt: |
    You are a Harness Evaluator for the Vattention team. Review this PR against its
    L2 spec for Harness-specific consistency that upstream code-review does not cover.

    Items to run:
    - Micro tier: items 14, 15, 17 only
    - Normal tier: all 10 items (14-18, 21-25)
    - Large tier: all 10 items (14-18, 21-25)

    ## Context

    Spec path: {SPEC_PATH}
    Change ID: {CHANGE_ID}
    Git range: {BASE_SHA}..{HEAD_SHA}
    Tier: {TIER}
    Iteration: {ITERATION}

    ## Setup

    Run these first:
    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    cat {SPEC_PATH}
    ```

    ---

    ## Item 14 · AC Coverage

    Read spec §1 (product perspective). List every Acceptance Criterion (AC).

    For each AC, verify an automated test exists:
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -E "test|\.spec\."
    ```
    Cross-reference test filenames/descriptions against each AC description.

    **Output:**
    - MUST FIX if any AC has no automated test
    - PASS if all ACs are covered (or spec has no ACs — check §1 explicitly)

    ---

    ## Item 15 · §5 L1 Impact Implementation

    Read spec §5 L1 Impact. For each entry:

    **ADDED capability** — verify:
    1. Implementation exists in diff
    2. Sentinel comment present:
    ```bash
    grep -r "@capability: ANCHOR_ID" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py"
    ```
    (Replace ANCHOR_ID with each anchor from §5)

    **MODIFIED capability** — verify the described change is present in the diff.

    **REMOVED capability** — verify old code is removed.

    **Output:**
    - MUST FIX if ADDED capability lacks sentinel or implementation
    - MUST FIX if MODIFIED/REMOVED change is absent
    - SHOULD if sentinel present but in a secondary file (not entry point)
    - PASS if §5 = "None"

    ---

    ## Item 16 · Three-Perspective Consistency  *(Normal + Large only)*

    Read spec §1 (product), §2 (design), §3 (engineering). For each perspective,
    check the diff satisfies the stated constraints.

    Common mismatches:
    - §2 specifies a component name but diff uses a different name
    - §3 specifies an algorithm/approach but a different one was implemented
    - §1 AC requires "within Xms" but no performance test is present

    **Output:**
    - MUST FIX if implementation directly contradicts a spec constraint
    - SHOULD if implementation only partially satisfies a perspective
    - PASS if all three perspectives are satisfied

    ---

    ## Item 17 · Role-Binding Soft Warn

    Read spec frontmatter `role:` field.
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA}
    ```

    If role = `frontend-dev` and >30% changed files are under `api/`, `server/`, `backend/` → warn.
    If role = `backend-dev` and >30% changed files are under `components/`, `pages/`, `styles/` → warn.
    If role is absent → skip.

    **Output: always INFO (never MUST FIX or SHOULD)**
    - INFO: describe the mismatch
    - PASS: paths align with declared role

    ---

    ## Item 18 · Anchor Consistency  *(Normal + Large only)*

    Read spec §5 L1 Impact `§5.x Anchor IDs` subsection (per spec amendment A2).
    For each anchor:
    ```bash
    grep -r "@capability: ANCHOR_ID" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py"
    ```

    **Output:**
    - MUST FIX if anchor listed in §5 but sentinel not found anywhere (broken anchor)
    - SHOULD if sentinel found but in a non-obvious location (secondary file, not entry point)
    - PASS if all anchors have corresponding sentinels

    ---

    ## Item 21 · §7 Doc Impact Fulfilled
    *(Absorbs d976064 "Check maintenance docs" — facio-superpowers commit d976064)*

    Read spec §7 Doc Impact. It lists which docs should be updated in this PR.

    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -E "^docs/|README|CLAUDE\.md|ARCHITECTURE"
    ```

    Compare declared list vs. actually changed doc files.

    **Output:**
    - MUST FIX if §7 names a specific doc file but that file is absent from the diff
    - PASS if all declared docs are present, or §7 = "None"

    ---

    ## Item 22 · Implicit Doc Gaps
    *(Absorbs d976064 "Check module documentation" — component/API list sync + architecture.md)*

    **Module README sync:**
    Identify changed source directories:
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep "^src/" | sed 's|/[^/]*$||' | sort -u
    ```

    For each changed directory that has a `docs/modules/<module>/README.md`:
    - New `.tsx`/`.ts`/`.py` files exported → check if README "核心组件" or "API" section lists them
    - If README not updated after new exports added → flag

    **Architecture doc:**
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -E "^src/" | head -5
    # If new top-level directory created:
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | awk -F/ '{print $1"/"$2}' | sort -u
    ```
    If module structure changed (new directory, moved packages) and `docs/reference/architecture.md` not in diff → flag.

    **Output:**
    - SHOULD for each implicit doc gap found
    - PASS if no implicit gaps (or no module READMEs exist in this project)

    ---

    ## Item 23 · ADR Triggered
    *(Absorbs d976064 "Check if ADR needed" — new library / architecture pattern / technical selection)*

    Check if this change warrants an Architecture Decision Record:

    ```bash
    # New dependencies added?
    git diff {BASE_SHA}..{HEAD_SHA} -- package.json requirements.txt Cargo.toml go.mod \
      | grep "^+" | grep -v "^+++"

    # ADR already written?
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep "docs/reference/decisions/"
    ```

    ADR required if any:
    - New library/framework introduced (appears in package.json/requirements.txt diff)
    - Architecture pattern fundamentally changed (new service layer, new data flow, new protocol)
    - Technical selection documented in comment but not in ADR file

    **Output:**
    - MUST FIX if new library added and no ADR present in diff
    - SHOULD if architecture pattern changed and no ADR present
    - PASS if ADR present or no architectural decisions made

    ---

    ## Item 24 · In-Code Documentation  *(Normal + Large only)*
    *(Absorbs d976064 "API list sync" — new public exports missing JSDoc/docstring)*

    Find new public exports in the diff:
    ```bash
    git diff {BASE_SHA}..{HEAD_SHA} | grep "^+export " | grep -v "^+++"
    ```

    For each new export, check if a documentation comment exists immediately above it:
    ```bash
    git diff {BASE_SHA}..{HEAD_SHA} | grep -B5 "^+export " | grep -E "^\+\s*/\*\*|^\+\s*#\s+|^\+\s*\*"
    ```

    **Output:**
    - SHOULD if a new public export lacks a JSDoc block (`/** ... */`) or docstring (`"""..."""`)
    - PASS if all new exports have documentation or no new exports exist

    ---

    ## Item 25 · README Sync  *(Normal + Large only)*
    *(Absorbs d976064 "Check maintenance docs" — CLAUDE.md / README update for new config/features)*

    Check for new user-facing surface without README documentation:

    ```bash
    # New env vars?
    git diff {BASE_SHA}..{HEAD_SHA} | grep -E "^+.*process\.env\.|^+.*os\.environ\[|^+.*getenv\(" \
      | grep -v "^+++"

    # New CLI flags or npm scripts?
    git diff {BASE_SHA}..{HEAD_SHA} -- package.json | grep "^+.*\"scripts\"" -A20 | grep "^+" \
      | grep -v "^+++"

    # README changed?
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -iE "readme|CLAUDE\.md"
    ```

    If new env vars / CLI flags / npm scripts appear but no README/CLAUDE.md update:

    **Output:**
    - SHOULD if new user-facing configuration lacks README documentation
    - PASS if README updated or no user-facing configuration added

    ---

    ## Final Output Format

    After evaluating all applicable items, output exactly:

    ```
    ## Harness Evaluator Results — {CHANGE_ID} · Iteration {ITERATION}

    Tier: {TIER}
    Items evaluated: [list numbers]

    ### MUST FIX
    - Item NN: [description] — [file:line or specific AC name]
    (or "None")

    ### SHOULD
    - Item NN: [description]
    (or "None")

    ### INFO
    - Item 17: [role mismatch note]
    (or "None")

    ### Item-by-Item Summary
    | Item | Title | Result | Note |
    |------|-------|--------|------|
    | 14 | AC Coverage | PASS/MUST FIX | ... |
    | 15 | §5 L1 Impact | PASS/MUST FIX | ... |
    | 16 | Three-Perspective | PASS/MUST FIX/SKIPPED | ... |
    | 17 | Role-Binding | INFO/PASS/SKIPPED | ... |
    | 18 | Anchor Consistency | PASS/MUST FIX/SKIPPED | ... |
    | 21 | §7 Doc Impact | PASS/MUST FIX | ... |
    | 22 | Implicit Doc Gaps | PASS/SHOULD | ... |
    | 23 | ADR Triggered | PASS/MUST FIX/SHOULD | ... |
    | 24 | In-Code Docs | PASS/SHOULD/SKIPPED | ... |
    | 25 | README Sync | PASS/SHOULD/SKIPPED | ... |
    ```
```
