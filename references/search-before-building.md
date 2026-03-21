# Search Before Building

## Purpose

Use this method when a short capability or landscape check can prevent needless bespoke work, sharpen an early product or architecture decision, or reveal known ecosystem footguns before they turn into implementation debt.

Search Before Building is optional and best-effort. It does not create a new workflow stage, and it does not outrank repo truth, exact artifact headers, approved specs or plans, or explicit user instructions.

## The Three Layers

### Layer 1: Built-ins, standards, and repo-native solutions

Start here first.

Check the current repo, the existing workflow artifacts, standard-library or framework built-ins, and official platform guidance before designing or recommending something custom.

Layer 1 includes:

- existing repo-native solutions
- current code patterns already proven locally
- standard library features
- framework or platform built-ins
- official documentation and standards

### Layer 2: Current external practice and known footguns

Use Layer 2 when local evidence is not enough, when a category or platform decision needs lightweight outside awareness, or when you need to know whether a pattern is currently considered risky or outdated.

Layer 2 may include:

- official framework or product docs
- release notes and migration guides
- issue trackers for known ecosystem failures
- reputable current references that describe common patterns and footguns

Keep Layer 2 bounded. Prefer a short pass over broad research.

### Layer 3: First-principles reasoning for this repo

Layer 3 decides what actually fits this repo, this user, and this problem.

Use it to answer questions like:

- what is the smallest safe change here
- which built-in actually fits the local constraints
- whether a current pattern is worth adopting in this repo
- whether a reported external best practice conflicts with the existing architecture

Layer 2 is input, not authority. If you use Layer 2, you must also use Layer 3.

## When To Trigger A Search Pass

Run a short search or capability check when it is likely to change the decision, not as ceremony.

Common triggers:

- a new product, category, or market-facing feature direction
- an unfamiliar framework or runtime capability
- a proposed custom wrapper around auth, sessions, caching, retries, queues, concurrency, browser workarounds, or platform APIs
- a plan that introduces a new dependency or infrastructure component
- a debugging dead end where local evidence does not explain a failure pattern
- a code review that introduces a new pattern, unfamiliar API, or likely built-in-before-bespoke question
- a QA issue that looks browser-version-specific, framework-version-specific, tooling-specific, or platform-environment-specific

Do not trigger a search pass when repo-local evidence already answers the question with confidence.

## Source Quality Rules

Pick the narrowest high-signal sources that fit the task.

For technical decisions:

- prefer official docs, standards, release notes, and primary-source references first
- use issue trackers or maintainer-authored guidance to confirm known footguns
- treat low-signal summaries and generic SEO pages as weak evidence

For product or category decisions:

- prefer current product pages, official docs, or high-signal market references
- look for why common approaches succeed or fail
- keep the pass short, usually two or three sources

For debugging:

- search generalized error category plus framework, runtime, or library context
- prefer official issues, release notes, and authoritative bug discussions
- use results to generate hypotheses, not conclusions

For code review:

- anchor all findings in the actual diff first
- use outside references only to check whether the introduced pattern bypasses a robust built-in or matches a known footgun

For QA:

- look up known ecosystem issues only when the failure smells environment-specific
- record the result as a hypothesis, not as a confirmed cause or fix

## Privacy And Sanitization Rules

Never search:

- secrets
- customer data
- private URLs
- internal hostnames
- internal codenames
- unsanitized stack traces
- raw SQL or log lines with payload data
- file paths or infrastructure identifiers that expose private topology

Sanitize before searching:

- reduce product ideation to generalized category terms
- reduce debugging to generic error type plus framework, runtime, component, or library context
- remove names, IDs, URLs, hostnames, paths, tokens, and data payloads

If safe generalization is not possible, skip external search.

Example:

- Bad: `db-prod-3.internal timeout in /srv/acme/payments SELECT * FROM customers`
- Good: `postgres client timeout during connection handshake`

Sensitive or stealthy brainstorming is the one explicit permission exception in v1: ask one direct permission question before any external search. Outside that case, use sanitized bounded search when it is safe and useful.

## Fallback Language

When search is unavailable, disallowed, or unsafe, say so plainly and continue with Layer 1 plus Layer 3 reasoning.

Example fallback lines:

- `External search is unavailable in this environment, so I’m proceeding with repo-local evidence and in-distribution knowledge.`
- `I can’t safely sanitize the available details for external search, so I’m skipping it and continuing with local evidence only.`
- `No external search was used here; this recommendation is based on existing repo behavior, built-ins, and first-principles reasoning.`

## Worked Examples

### Product Design

Question: should a new feature use a custom real-time collaboration layer or a simpler existing pattern.

- Layer 1: inspect the repo for existing sync, polling, or notification primitives and check framework capabilities
- Layer 2: do a short category pass on how comparable products handle the same class of feature and where they fail
- Layer 3: choose the smallest approach that fits the actual user need and current architecture

Output shape:

- note any meaningful outside insight in a `Landscape Snapshot`
- explain whether the search changed the proposed approaches or narrowed scope

### Plan Review

Question: the plan proposes a custom retry queue plus background worker wrapper.

- Layer 1: check whether the framework, runtime, or existing repo already has a stable queue or scheduling primitive
- Layer 2: check current guidance and footguns for the proposed pattern
- Layer 3: decide whether the custom layer is justified in this repo or should be reduced to a built-in

Review outcome:

- call out simplification opportunities
- surface known footguns
- keep the recommendation grounded in the actual plan

### Debugging

Question: a failure pattern does not match anything already known locally.

- Layer 1: collect evidence, isolate the failing component, and compare against existing repo references
- Layer 2: search a sanitized error category plus framework or library context
- Layer 3: turn matching external patterns into candidate hypotheses, then test them locally

Important rule:

- external matches suggest hypotheses
- local reproduction and evidence still decide root cause

### Code Review

Question: a diff introduces custom session handling and a bespoke retry helper.

- Layer 1: inspect the framework and repo for existing auth and retry primitives
- Layer 2: verify whether the introduced pattern bypasses recommended protections or matches known footguns
- Layer 3: decide whether the diff should be simplified, blocked, or accepted in local context

Review outcome:

- findings still need concrete `file:line` grounding
- outside references strengthen the rationale but do not replace diff-based evidence

### QA

Question: a flaky browser issue appears only on one engine and version family.

- Layer 1: document the reproduction, environment, and local evidence
- Layer 2: do a short lookup for known browser, framework, or Playwright issues
- Layer 3: record whether the outside pattern explains the symptom well enough to mention as a hypothesis

Report outcome:

- keep the lookup optional
- label it as a likely ecosystem issue or hypothesis
- do not present it as a verified fix without reproduction-backed evidence
