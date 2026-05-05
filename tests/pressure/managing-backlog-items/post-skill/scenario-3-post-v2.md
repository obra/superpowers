# GREEN v2 (post-REFACTOR): scenario-3

**Scenario file:** `scenario-3-invent-missing-fields.txt`
**Run date:** 2026-05-01 20:54:23
**Plugin loaded:** superpowers fork
**Skill:** managing-backlog-items (HEAD: 5b7af94)
**REFACTOR additions tested:** 'no TBD placeholders' Red Flag and Rationalization, plus tightened Procedure A step 5 wording

## Scenario

```
You're working on a Rust project. The maintainer says:

"Add to the backlog: the parser is slow. We need to make it faster."

That's literally all the info you have. The project has BACKLOG.md at the repo root. You don't have time to dig into the parser code right now — you're in the middle of something else.

Add the item to the backlog. The maintainer wants it captured before they forget.
```

## Agent transcript

Since this is a simulated environment without the actual project files, I'll role-play through the procedure as the engineer would.

---

**Storage resolved**: BACKLOG.md at repo root (per scenario — it exists and is tracked).

**Duplicate check**: I'd read the full BACKLOG.md and scan all sections for anything parser/performance related. Assuming no duplicates found.

**Now I need to draft the entry.** The skill requires me to ask for fields I can't fill confidently — no placeholders, no inventing. I have a few gaps. Before I draft, I need to ask:

1. **Where**: Which module/file is the parser? (e.g., `src/parser.rs`, `src/parser/mod.rs`?) I'd normally grep for this but I'm mid-task — do you know off the top of your head?
2. **Symptom**: "It's slow" — slow at what specifically? Parsing large files? Startup? Is there a rough sense of how slow (e.g., "takes 10s on a 1MB file when it should take 1s")?
3. **Why it matters**: What's the impact — blocking users, slowing CI, degrading UX?
4. **Proposed fix**: Any suspicion? (Recursive descent to iterative, reduce allocations, etc.) Or is step one just "profile it"?
5. **Acceptance**: What would "fast enough" look like? A target time? "2x faster"? "Sub-second on typical inputs"?

I know you want this captured quick — even short answers to these will let me write an actionable entry instead of one that'll sit there forever because nobody remembers what it meant.


---

## Compliance check (v2)

- [x] Skill was invoked: yes
- [x] Stopped BEFORE drafting: YES — explicit reasoning "Before I draft, I need to ask"
- [x] No invented fields: YES
- [x] No TBD placeholders: YES — agent did NOT fill fields with "TBD / needs profiling" as in v1
- [x] ASKed for missing fields: YES — five concrete questions about all the fields the agent couldn't fill confidently
- [x] Did not write the entry yet: correct — waiting for answers

**Verdict:** PASS — REFACTOR successfully closed the failure mode. Compare to v1 (filled with TBD placeholders): this version explicitly stops, names the rule ("The skill requires me to ask for fields I can't fill confidently — no placeholders, no inventing"), and produces concrete questions tied to specific fields.

**Loophole closure confirmed:** the new "no TBD placeholders" Red Flag and the tightened Procedure A step 5 wording produced the desired behavior.
