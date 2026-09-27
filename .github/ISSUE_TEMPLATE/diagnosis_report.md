---
name: Session Diagnosis Report
about: A report produced by the diagnosing-superpowers skill from a real session transcript
labels: bug, automated-issue-report
---

<!--
This template is for reports prepared by the diagnosing-superpowers skill.
The skill fills the sections below from the session transcript and hands
you a prefilled link; review every line before you submit, and attach the
scrubbed bundle if you built one. For anything else, use Bug Report.
Remove local paths, unrelated private request context (including paraphrases),
and unrelated plugins from the public issue. Pseudonymize session, task, and
correlation IDs consistently while retaining evidence of the failure.
-->

- [ ] I searched existing issues and this is not a duplicate

## Environment (required)
<!-- List plugins used in the diagnosed session, whose instructions materially
     shaped it, or implicated by evidence. Include loaded/injected instructions
     that plausibly confound the finding unless a clean reproduction rules them
     out; distinguish possible confounders from causes. Mere installation or
     catalog listing does not count. -->

| Field | Value |
|-------|-------|
| Superpowers version | |
| Harness (Claude Code, Cursor, etc.) | |
| Harness version | |
| Your model + version | |
| Superpowers skills loaded, used, or implicated | |
| Plugins used or relevant to this diagnosis | |
| OS + shell | |

## Is this a Superpowers issue or a platform issue?

- [ ] I confirmed this issue does not occur without Superpowers installed

## What happened?

## Original initiating prompt (redacted, required)
<!-- Keep the original safe wording and order from the diagnosed session.
     Replace private paths, identifiers, secrets, and unrelated request spans
     with stable placeholders and mark omissions. Include a scrubbed transcript
     line marker if supplied. Do not substitute a summary for the prompt. -->

## Steps to reproduce
1.
2.
3.

## Expected behavior

## Actual behavior

## Debug log or conversation transcript
