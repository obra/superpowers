---
name: Bug Report
about: Something isn't working as expected
labels: bug
---

<!--
BEFORE FILING: Search open AND closed issues. The Windows SessionStart
hook alone has been reported 29 times. If your issue already exists,
add a comment or reaction to the existing one instead.
Use generic paths and include only the technical request relevant to the
failure. Omit unrelated private context even when paraphrasing. Scrub logs
and transcripts while preserving the evidence needed to reproduce the failure.
-->

- [ ] I searched existing issues and this is not a duplicate

## Environment (required)
<!-- Required. We assume an agent filed this report — tell us which one and
     where it ran. We weigh reports by what produced them. List plugins whose
     skills or tools were used, whose instructions materially shaped the work,
     or that evidence implicates in the failure. Include loaded/injected
     instructions that plausibly confound the observation unless a clean
     reproduction rules them out. Label possible confounders as uncertain;
     mere installation or catalog listing does not count. -->

| Field | Value |
|-------|-------|
| Superpowers version | |
| Harness (Claude Code, Cursor, etc.) | |
| Harness version | |
| Your model + version | |
| Superpowers skills loaded, used, or implicated | |
| Plugins used or relevant to this failure | |
| OS + shell | |

## Is this a Superpowers issue or a platform issue?
<!-- Superpowers is a plugin. Some reported "bugs" are actually issues
     in the underlying platform or model. If you're not sure, try
     reproducing without Superpowers installed.

     If the problem persists without Superpowers, file the issue with
     your platform instead. -->

- [ ] I confirmed this issue does not occur without Superpowers installed

## What happened?
<!-- Be specific. "It doesn't work" is not a bug report. -->

## Original initiating prompt (required for agent-session reports)
<!-- Preserve the original wording and order of safe spans. Replace private
     paths, identifiers, secrets, and unrelated request spans with stable
     placeholders; mark omissions instead of paraphrasing. Include a scrubbed
     transcript line marker when available. If no agent session exists, state
     that and explain how the failure was reproduced. -->

## Steps to reproduce
1.
2.
3.

## Expected behavior
<!-- What should have happened? -->

## Actual behavior
<!-- What happened instead? -->

## Debug log or conversation transcript
<!-- A debug log or conversation transcript showing the issue is the
     single most helpful thing you can include. Without one, we're
     guessing. Screenshots of error output are also useful. Redact private
     paths, secrets, and unrelated prompts before sharing; use stable aliases
     for session, task, and correlation IDs. -->
