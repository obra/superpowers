# AGENTS.md

Keep this file focused on durable operating rules.
Do not turn it into a memory dump.

<!-- MEMORY-STACK-GIVEAWAY:START -->
## Memory Stack Rules
- Keep `AGENTS.md` focused on durable operating rules, ownership, approvals, and stop behavior.
- Keep `MEMORY.md` as a tiny routing/index layer, not a warehouse.
- Put durable facts in PARA (`~/life/`).
- Put daily execution residue in `memory/YYYY-MM-DD.md`.
- Use LCM for current-session recovery, not durable truth.
- Use OpenStinger for cross-session recall only when available and needed.
- If a rule must survive compaction, promote it into a durable file this session.
<!-- MEMORY-STACK-GIVEAWAY:END -->
