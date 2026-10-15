---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing, and before committing or opening a PR.
---

# Verification Before Completion

Before reporting status, check each claim against a tool result from this session, and drop any claim no run backs. Run the tests related to the files you changed plus an incremental typecheck and lint of the touched packages, and claim exactly that scope. Run a package-wide suite only when the change touches something many files depend on: a shared package or schema, test config, the lockfile or workspace config. The full suite is CI's; never run it as a local gate. A regression test counts once it has been seen red and then green. An agent's success report is a claim; read the diff.

| Claim | Evidence |
|---|---|
| Tests pass | the test command's output, 0 failures, at the scope you name |
| Build succeeds | the build command, exit 0 |
| Bug fixed | the original symptom's test failed before the fix and passes now |
| Agent completed | the VCS diff shows the change |

Before your final report, stop every long-running process you started — dev servers, watchers, browsers — with the project's own stop command when it has one. If you leave one running on purpose, the report names it and who stops it.
