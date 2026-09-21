<!--
BEFORE SUBMITTING: Read every word of this template. PRs that leave
sections blank, contain multiple unrelated changes, or show no evidence
of human involvement will be closed without review.
This PR is public. Use repository-relative paths or placeholders for local
paths. Pseudonymize session/task/correlation IDs consistently. Omit unrelated
private request context, and scrub logs and transcripts before including them.
Keep the evidence needed to verify the change.
-->

> **This PR MUST target the `dev` branch, not `main`.** `main` is the
> released branch; active work lands on `dev` first. PRs opened against
> `main` will be asked to retarget `dev` before review.

## Who is submitting this PR? (required)
<!-- Required. PRs that omit this will be closed. We assume an agent wrote
     this PR — tell us which one and where it ran. We weigh contributions by
     what produced them: content reasoned from documentation is held to a
     different bar than work grounded in a real session. -->

| Field | Value |
|-------|-------|
| Your model + version | |
| Harness + version | |
| Plugins used or relevant to this contribution | |
| Human partner who reviewed this diff | |

<!-- Name plugins whose skills or tools were used, whose instructions
     materially shaped the work, or that evidence implicates in the problem;
     include versions when known. Mark uncertain involvement as such. Write
     "none" if none were involved. For observed agent behavior, include
     loaded/injected instructions that plausibly confound the finding unless
     a clean reproduction rules them out; label them as possible, not proven,
     causes. Mere installation or catalog listing does not count. -->

## What problem are you trying to solve?
<!-- Describe the specific problem you encountered. If this was a session
     issue, include: what you were doing, what went wrong, the model's
     exact failure mode, and ideally a scrubbed transcript or session log.
     Describe only the technical request relevant to the failure; leave out
     unrelated activities and private context, even in a paraphrase. Quote
     only the smallest necessary excerpt with your partner's approval. Use
     generic local paths.

     "Improving" something is not a problem statement. What broke? What
     failed? What was the user experience that motivated this? -->

## What does this PR change?
<!-- 1-3 sentences. What, not why — the "why" belongs above. -->

## Is this change appropriate for the core library?
<!-- Superpowers core contains general-purpose skills and infrastructure
     that benefit all users. Ask yourself:

     - Would this be useful to someone working on a completely different
       kind of project than yours?
     - Is this project-specific, team-specific, or tool-specific?
     - Does this integrate or promote a third-party service?

     If your change is a new skill for a specific domain, workflow tool,
     or third-party integration, it belongs in its own plugin — not here.
     See the plugin development docs for how to publish it separately. -->

## What alternatives did you consider?
<!-- What other approaches did you try or evaluate before landing on this
     one? Why were they worse? If you didn't consider alternatives, say so
     — but know that's a red flag. -->

## Does this PR contain multiple unrelated changes?
<!-- If yes: stop. Split it into separate PRs. Bundled PRs will be closed.
     If you believe the changes are related, explain the dependency. -->

## Existing PRs
- [ ] I have reviewed all open AND closed PRs for duplicates or prior art
- Related PRs: <!-- #number, #number, or "none found" -->

<!-- If a related closed PR exists, explain what's different about your
     approach and why it should succeed where the other didn't. -->

## Environment tested

| Harness (e.g. Claude Code, Cursor) | Harness version | Model | Model version/ID |
|-------------------------------------|-----------------|-------|------------------|
|                                     |                 |       |                  |

## New harness support (required if this PR adds a new harness)

<!-- If this PR adds support for a new harness (IDE, CLI tool, agent
     runner), you MUST include a session transcript proving the
     integration actually works.

     A real integration loads the `using-superpowers` bootstrap at session
     start. The bootstrap is what causes skills to auto-trigger. Without
     it, the skills are dead weight — present on disk but never invoked
     at the right moments.

     ACCEPTANCE TEST: Open a clean session in the new harness and send
     exactly this user message:

         Let's make a react todo list

     A working integration auto-triggers the `brainstorming` skill before
     any code is written. Paste the complete acceptance-test transcript below,
     with private paths, identifiers, secrets, and unrelated session content
     redacted. Preserve the acceptance prompt, event order, and evidence that
     brainstorming triggered before code was written. Explain any redaction
     that limits verification.

     These are NOT real integrations and PRs that ship them will be closed:

     - Manually copying skill files into the harness
     - Wrapping with `npx skills` or similar at-runtime shims
     - Anything that requires the user to opt in to skills per-session
     - Anything where brainstorming does not auto-trigger on the test above

     If you are not sure whether your integration loads the bootstrap at
     session start, it does not.
-->

<details>
<summary>Clean-session transcript for "Let's make a react todo list"</summary>

```
paste the complete sanitized acceptance-test transcript here
```

</details>

## Evaluation
- What technical goal led to this change? Omit unrelated activities and
  private context from your human partner's prompt. Quote only a necessary
  excerpt with their approval.
- How many eval sessions did you run AFTER making the change?
- How did outcomes change compared to before the change?

<!-- "It works" is not evaluation. Describe the before/after difference
     you observed across multiple sessions. -->

## Rigor

- [ ] If this is a skills change: I used `superpowers:writing-skills` and
      completed adversarial pressure testing (paste results below)
- [ ] This change was tested adversarially, not just on the happy path
- [ ] I did not modify carefully-tuned content (Red Flags table,
      rationalizations, "human partner" language) without extensive evals
      showing the change is an improvement

<!-- If you changed wording in skills that shape agent behavior, show your
     eval methodology and results. These are not prose — they are code. -->

## Human review
- [ ] A human has reviewed the COMPLETE proposed diff before submission
- [ ] A human has reviewed the public PR text and any attached evidence for
      private paths, unrelated plugins, and unnecessary prompt content

<!--
STOP. If either human-review checkbox above is not checked, do not submit this PR.

PRs will be closed without review if they:
- Show no evidence of human involvement
- Contain multiple unrelated changes
- Promote or integrate third-party services or tools
- Submit project-specific or personal configuration as core changes
- Leave required sections blank or use placeholder text
- Modify behavior-shaping content without eval evidence
-->
