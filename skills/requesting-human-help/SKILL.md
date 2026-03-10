---
name: requesting-human-help
description: Use when blocked by capability limits (UI testing, local execution, VPN-only systems, MFA/captcha), or before irreversible/high-risk actions (deleting data, deploying to production, sending external messages, handling credentials) that require human judgment or approval
---

# Requesting Human Help

## Overview

Ad hoc help requests fail: they're inconsistent, lack context, and return unverifiable responses.

**Core principle:** Turn human collaboration into a structured, evidence-driven, auditable request with explicit acceptance criteria.

## When to Use

**Capability/access boundaries:**
- Testing UI on a real device or browser you cannot control
- Running commands on a local machine or VPN-only system
- Completing flows requiring MFA, CAPTCHA, or physical hardware
- Subjective visual checks ("does this look right?")

**High-risk / high-uncertainty steps:**
- Deleting data, dropping tables, wiping storage
- Deploying to production or staging environments
- Sending external emails, Slack messages, or notifications
- Handling or rotating sensitive credentials
- Any irreversible action where being wrong is costly

**Do NOT use for:**
- Questions you can answer by reading files, docs, or web search
- Low-risk, reversible local actions you can attempt yourself
- Anything recoverable you should just try first

## The Request Format

Present every help request as a structured block. Include ALL fields — missing fields are the top cause of execution errors.

```
## Human Help Needed

**Goal:** [One sentence: what outcome is needed]

**Why I can't do this:** [Specific blocker — capability limit or risk reason]

**Context:**
- [Relevant state: what has already been done, what the system looks like]
- [File paths, URLs, service names, environment]

**Prerequisites before starting:**
- [ ] [What must be true / set up before the human begins]

**Steps:**
1. [Explicit, numbered, unambiguous instruction]
2. [Each step should be doable without guessing]
3. ...

**Expected output / evidence needed:**
- [What to capture: screenshot, log output, command result, confirmation text]
- [Format: paste text output, attach screenshot, confirm yes/no]

**Acceptance criteria:**
- [ ] [Specific, verifiable condition that means "this worked"]
- [ ] [What distinguishes success from partial success]

**If something goes wrong:** [Who to contact or how to escalate]
```

## Validating the Human Response

When the human responds, verify before proceeding:

```
FOR EACH acceptance criterion:
  - Is it addressed in the response?
  - Is evidence provided (log, screenshot, output)?
  - Does the evidence confirm the criterion?

IF any criterion unmet:
  → Request ONLY the missing piece (minimal follow-up)
  → Do NOT re-ask everything

IF all criteria met:
  → State: "Confirmed: [criterion 1], [criterion 2]. Proceeding."
  → Continue workflow
```

**Never accept "looks good" or "done" without artifacts.** A screenshot or pasted output is the minimum bar for irreversible actions.

## The Audit Chain

Every request creates a record:

```
REQUEST → [structured block above]
HUMAN ACTION → [what they did]
EVIDENCE → [artifact they returned]
AGENT DECISION → [what you decided based on evidence]
```

Log this chain in your response so future debugging has a clear trail.

## Red Flags — STOP

- Attempting irreversible action without explicit human approval
- Proceeding because human said "go ahead" with no evidence
- Asking for help without prerequisites listed (human will get stuck)
- Accepting partial confirmation and assuming the rest is fine
- Re-asking the entire request when only one piece is missing

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Vague goal ("deploy the thing") | One-sentence outcome with system + environment |
| Missing prerequisites | List what must be true before step 1 |
| Ambiguous steps ("configure it") | Exact commands, menu paths, field values |
| No evidence requested | Always specify what to capture and how |
| Accepting "done" without artifact | Ask for the specific log or screenshot |
| Over-escalating routine actions | Only escalate capability limits and irreversible risks |
