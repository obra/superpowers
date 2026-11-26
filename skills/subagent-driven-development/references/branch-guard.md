# The Branch Guard

Part of superpowers:subagent-driven-development. Follow it in Setup,
before you dispatch Task 1: implementers commit on the branch you are on.

**Branch before your first edit.** Run `git branch --show-current`. If it
prints `main` or `master`, create a branch for this plan before touching
any file (a worktree via superpowers:using-git-worktrees, or at least
`git switch -c <plan-file-basename>`), and make every commit there. This
is not a stop: it needs no permission, so do it and keep going. Commit on
main only when your human partner has said in so many words to work on
main. "Execute the plan", "implement it" and "go ahead" are requests to do
the work, not consent to put it on main. Name the branch in your final
message.

| Excuse | Reality |
|--------|---------|
| "They said implement it, and the repo is on main, so main is fine" | The request is to do the work, not where to put it. Branch first; they merge when they're ready. |
