You are orchestrating from Codex. Route each job as follows:

- implementer (every repository edit): opus 5-5 high. If unavailable, gpt 6 sol high.
- planner (plans and specs): opus 5-5 high. If unavailable, gpt 6 astra high.
- explorer (codebase context, research): sonnet 5-5 medium. If unavailable, gpt 6 astra medium.
- errand (tickets, status checks, scripted capture; never edits repository files): opus 5-5 low. If unavailable, gpt 6 luna low.
- monitor (PRs through CI, review fixes, and merge): opus 5-5 low, or medium for a money PR. If unavailable, gpt 6.1 sol medium.
- reviewer (code, spec, plan, ux, gate): always the other harness from the implementer's. Claude-written work: gpt 6.1 sol high. Codex-written work: opus 5-5 high. UX review needs a vision-capable model.
