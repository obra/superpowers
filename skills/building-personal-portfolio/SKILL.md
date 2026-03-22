---
name: building-personal-portfolio
description: "Use when building a developer portfolio from scratch, when an existing portfolio gets no response, when pivoting careers from a non-software role, or when showcasing real projects without a long formal work history."
---

# Building a Personal Portfolio

## Overview

**A portfolio is evidence, not aspiration.**

Show what you've deployed and the problem it solves — not a list of technologies you know. One real production project with measurable impact outperforms ten tutorial demos.

## When to Use

- Pivoting careers (field technician → developer, ops → engineer, etc.)
- Building from scratch with limited formal employment history
- Existing portfolio gets no response from recruiters or collaborators
- You have real projects but don't know how to present them professionally

**Don't use for:**
- Senior engineers with 5+ years history (resume + GitHub profile suffices)
- Design/UX portfolios (different emphasis on visual case studies)

## Core Pattern: Evidence Over Aspiration

```
❌ WEAK                              ✅ STRONG
─────────────────────────────────────────────────────────────────
"I know Python, React, and SQL"   → "1,719 ISP boxes indexed in SQLite"
"Passionate developer"            → "Telecom tech → Python developer"
"I built a bot"                   → "Bot in production, used by field teams daily"
"Interested in automation"        → "Eliminated manual WhatsApp lookups for 3 teams"
"See my GitHub"                   → Live preview + repo link + impact metric
```

## Portfolio Structure

Build in this order — each section has one job:

1. **Hero** — Role clarity + one-line proof ("Bot in production, 1,719 ISP boxes indexed")
2. **Featured project** — Deep dive on your best real work: problem → solution → metrics
3. **How I can help** — Translate skills into client/employer pain points, not feature lists
4. **Stack** — Technologies grouped by purpose, not alphabetically
5. **Contact** — Direct channels only (no fake forms)

## Quick Reference

| Element | Strong | Weak |
|---------|--------|------|
| Headline | "I automate field ops with real Python tools." | "Junior Full Stack Developer" |
| Project description | Problem + solution + metrics | Feature list |
| Stack section | Grouped by purpose | Alphabetical dump of 15+ tools |
| Status badge | "In production ✓" | "Personal project" |
| Impact metric | "1,719 boxes indexed" | "Built a CRUD app" |
| CTA | "See the repository" | "Download CV" (if CV isn't ready) |
| Contact | `mailto:` links | Form that doesn't work |

## Implementation

### Featured project block

Every featured project needs these five elements:

```
Status:   In production / Active / In development
Problem:  One sentence — the real operational pain
Solution: What your software does (not how it works internally)
Metrics:  Numbers — rows, users, operations automated, time saved
Flow:     User action → your system → outcome
Stack:    4–6 technologies, linked to repo
```

### Hero headline

Write it as if describing a role to a hiring manager — under 10 words:

```
❌ "Full Stack Developer | Python | React | SQL | Node.js"
✅ "I automate field operations with real Python tools."
✅ "Telecom tech building ISP automation software."
```

### "How I can help" section

Don't list skills — list pain points you solve:

```
❌ "I know Python and can build bots"
✅ "If your ISP team uses WhatsApp to locate infrastructure,
    I can build the tool that replaces that."
```

### Keep project data in a structured file

Separate content from presentation. Add future projects in one place:

```js
// src/data/projects.js
export const projects = [
  {
    id: 'your-project',
    title: 'Project Name',
    status: 'production',       // 'production' | 'development' | 'coming-soon'
    description: 'Problem + solution in one sentence.',
    stack: ['Tech1', 'Tech2'],
    metrics: [{ label: 'N units', description: 'What they represent' }],
    repoUrl: 'https://github.com/...',
    flow: ['Step 1', 'Step 2', 'Step 3', 'Outcome'],
  }
]
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "I'm a passionate developer" opener | Delete it. Open with your strongest project instead. |
| 15+ technologies listed | Show only what you actually used in the featured project. |
| No project status indicator | Add: In production / In development / Archived. |
| Broken or fake contact form | Use `mailto:` — a broken form destroys trust instantly. |
| CV download CTA without a CV | Remove it until the CV exists. |
| Tutorial projects as main content | Move them to GitHub; feature only real, deployed work. |
| 3+ "Coming soon" placeholders | One real project beats five placeholders. |
| No scroll or navigation | Add anchor links from day one — recruiters scan fast. |

## Real-World Impact

This pattern applies directly when:

- You have field expertise but no CS degree or bootcamp certificate
- You're applying for remote or freelance roles where portfolio = the interview
- You're transitioning and need to prove you ship working software, not just study it

A portfolio with one in-production project, measurable impact, and a direct contact link consistently outperforms portfolios with five tutorial CRUD apps and a generic "about me" paragraph.
