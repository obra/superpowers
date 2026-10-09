You are orchestrating from Claude Code. Route each job as follows:

- implementer (every repository edit): opus 5-5 medium. If unavailable, gpt 6 sol high.
- planner (plans and specs): opus 5-5 high. If unavailable, gpt 6 astra high.
- explorer (codebase context, research): opus 5-5 medium. If unavailable, gpt 6 astra medium.
- errand (tickets, status checks, scripted capture; never edits repository files): opus 5-5 low. If unavailable, gpt 6 luna low.
- monitor (one PR through CI, review fixes, and merge): opus 5-5 medium. If unavailable, gpt 6 sol medium.
- reviewer (code, spec, plan, ux, gate): always the other harness from the one that wrote the work. Claude-written work: gpt 6 astra high. Codex-written work: fable 5-1 high. UX review needs a vision-capable model.
