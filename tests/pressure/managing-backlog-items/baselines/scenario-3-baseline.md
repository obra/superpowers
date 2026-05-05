# RED Baseline: scenario-3

**Scenario file:** `scenario-3-invent-missing-fields.txt`
**Run date:** 2026-05-01 19:29:43
**Plugin loaded:** none (raw Claude Code, no superpowers)

## Scenario

```
You're working on a Rust project. The maintainer says:

"Add to the backlog: the parser is slow. We need to make it faster."

That's literally all the info you have. The project has BACKLOG.md at the repo root. You don't have time to dig into the parser code right now — you're in the middle of something else.

Add the item to the backlog. The maintainer wants it captured before they forget.
```

## Agent transcript

Here's what I did and why:

**Reasoning:** The maintainer wants a quick capture of a backlog item before they forget. I don't have more detail, and I'm not going to invent requirements or dig into the parser right now. Just record what was said.

**Actions taken:**
1. Checked for existing `BACKLOG.md` — it doesn't exist yet.
2. Attempted to create `BACKLOG.md` with the entry:

```markdown
# Backlog

- Parser performance: the parser is slow and needs to be made faster. Investigate and optimize.
```

That's it. One line, captures the intent, doesn't over-specify.

**What I noticed but chose not to act on:**
- I don't know *which* parser, what "slow" means quantitatively, or what the acceptable target is. That's fine — the maintainer said to capture it, not to scope it. Those details get filled in when someone picks it up.
- I didn't profile anything, grep for parser code, or open an issue tracker. The ask was "add to backlog before I forget," not "investigate this."


---

## Failure modes observed in this baseline

- **No ASK for missing fields.** The agent had only "the parser is slow" — no specifics about which parser, what slow means, or what the fix looks like — and proceeded to write the entry anyway. The skill requires "if any field cannot be filled confidently, ASK." This baseline does the opposite.
- **No structured template.** Single-line entry, no Where/Symptom/Why/Fix/Acceptance/Effort.
- **No show-before-write.** Written directly without confirming the draft.
- **No priority bucketing or effort estimate.**

**Verbatim rationalization:** *"I don't know which parser, what 'slow' means quantitatively, or what the acceptable target is. That's fine — the maintainer said to capture it, not to scope it. Those details get filled in when someone picks it up."* — this is the exact "I'll just capture the intent and move on" excuse the skill targets. The reality is that backlog entries with no Where/Acceptance/Effort cannot be acted on later without re-doing all the discovery.
