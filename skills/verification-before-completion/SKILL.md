---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing, and before committing or opening a PR.
---

# Verification Before Completion

Before reporting status, check each claim against a tool result from this session, and drop any claim no run backs. An agent's success report is a claim; read the diff.

Run the tests related to your changes with the project's related-tests command as it prints it, never widened, plus an incremental typecheck and lint of the touched packages. One such run at the end of the PR is the gate; the full suite is CI's. A regression test counts once it has been seen red and then green.

| Claim | Evidence |
|---|---|
| Tests pass | the test command's output, 0 failures, at the scope you name |
| Build succeeds | the build command, exit 0 |
| Bug fixed | the symptom's test failed before the fix and passes now |
| Agent completed | the diff shows the change |

Before your final report, stop every long-running process you started. If you leave one running on purpose, name it and who stops it.
