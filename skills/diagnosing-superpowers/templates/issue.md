Title: <skill or symptom>: <one-line observable> (<harness>)

- [x] I searched existing issues and this is not a duplicate (searched: <query terms>; closest: <#n title, or "none">)

Public draft: extract the minimum evidence needed to understand and verify the
claim from the complete local report. Do not copy its timeline, prompt text,
plugin inventory, or local paths wholesale. Scrub and audit this draft with
`references/redaction-policy.md` before showing it for approval, whether or
not a bundle exists. If required evidence cannot be shared safely, state the
public verification limit instead of exposing it.

## Environment (required)

Use included transcript line markers or public URLs for provenance. If neither
can be shared, write "local evidence not supplied" and state the limitation.
Do not copy local session, archive, or installation paths into this public draft.

| Field | Value | Provenance / supporting evidence |
|-------|-------|-------------------------------|
| Superpowers version | <version> (<sha or "not a checkout">) | <historical evidence / unverified snapshot / current observation / unknown>; <transcript line or public URL> |
| Harness (Claude Code, Cursor, etc.) | <harness> | <label>; <transcript line or public URL> |
| Harness version | <version> | <label>; <transcript line or public URL> |
| Your model + version | <model ids seen> | <label>; <transcript line or public URL> |
| Plugins used or relevant to this diagnosis | <used plugins and plausible loaded/injected confounders, with status and versions; "none" or "unknown"> | <label>; <transcript line or public source; note clean reproduction or uncertainty> |
| OS + shell | <os version>, <shell> | <label>; <transcript line or public URL> |

## Is this a Superpowers issue or a platform issue?

- [ ] I confirmed this issue does not occur without Superpowers installed

The reporter has not tried reproducing without superpowers. Evidence for
involvement is below; it does not establish cause.

## What happened?

<Technical problem statement without unrelated private context, then the
triage verdict. Cite `transcript line <n>` only if a sanitized supporting
excerpt or bundle is included; otherwise state that evidence remains local
and public verification is limited.>

## Steps to reproduce

1. <technical request only; omit unrelated private context even in paraphrase>
2. <the turns leading to the problem, one line each>
3. <the observable>

## Expected behavior

<from the problem statement>

## Actual behavior

<from the triage verdict>

## Debug log or conversation transcript

Scrubbed bundle: <attached after approval | available locally but not attached
| none built>. Redaction level: <level | not applicable>.
Sanitized supporting evidence: <minimum excerpt with transcript line markers
that supports the claim | not supplied; public verification is limited>.
Superpowers involvement per the diagnosis report: <possible | likely>, with
evidence at <transcript lines if included publicly | local evidence not
included>. This report does not propose a fix.

---
Filed with the `diagnosing-superpowers` skill. Model, harness, harness
version, and relevant plugins are listed above.
