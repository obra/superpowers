# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]
**Plan author / date:** [name, YYYY-MM-DD]

---

## Scope

What this plan covers (and explicitly what it does NOT cover).

## File structure (decomposition locked here)

| File | Responsibility |
|---|---|
| `exact/path/to/new_file.py` | what it does |
| `exact/path/to/existing.py` (lines) | what change |
| `tests/path/to/test_file.py` | what it tests |

## Tasks

Each task is one independently testable deliverable. Each step is one action (2-5 min). Follow the
TDD cycle per task: write failing test → run to confirm fail → implement minimal → run to confirm
pass → commit. Do not move to the next task until this one's verification passes and it is reviewed.

### Task N: [Descriptive Name]

**Objective:** [One sentence]

**Files:**
- Create: `exact/path/to/new_file.py`
- Modify: `exact/path/to/existing.py:45-67`
- Test: `tests/path/to/test_file.py`

**Step 1: Write failing test**
```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify failure**
Run: `pytest tests/path/test.py::test_specific_behavior -v`
Expected: FAIL — "function not defined"

**Step 3: Write minimal implementation**
```python
def function(input):
    return expected
```

**Step 4: Run test to verify pass**
Run: `pytest tests/path/test.py::test_specific_behavior -v`
Expected: PASS

**Step 5: Commit**
```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```

**Review gate (before next task):** confirm the change matches the plan, verification output is
fresh, and the diff is scoped to this task only. Do not batch unrelated changes.

---

## Verification (final)

Run the full suite and record output here before claiming completion:

```bash
pytest tests/ -q
```
Expected: all pass. **Iron law: no completion claim without this fresh output.**
