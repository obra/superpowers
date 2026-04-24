# Architecture Profile Matching

This reference is consulted by `skills/brainstorming/SKILL.md` during the "Match architecture profile" step (runs between "Explore project context" and "Ask clarifying questions").

## Lookup order

1. Repo-level override: `<repo>/.claude/ultrapowers-architecture-defaults.json` — if present, its profiles **replace** (not merge) user-level ones.
2. User-level: `~/.claude/ultrapowers-architecture-defaults.json` — baseline profiles.
3. Neither file → skip this step silently; fall back to normal clarifying questions.

## File schema

```json
{
  "profiles": [
    {
      "id": "<stable-id>",
      "description": "<one-line human description>",
      "signals": ["<lowercase-phrase>", "..."],
      "stack": { "<role>": "<tool-identity>", "...": "..." },
      "skills": ["<skill-name-with-or-without-pack-prefix>"],
      "reference_projects": ["<project-name>"]
    }
  ]
}
```

**Important:** `stack` entries store **tool identity only** — no version pins. Each deep-research run resolves the current latest per tool. The seed file stays future-proof.

## Matching algorithm

```
match_profile(idea_text, profiles):
    normalized = lowercase(idea_text)
    scored = []
    for p in profiles:
        count = number of signals in p.signals that appear in normalized (word boundary)
        if count >= 1:
            scored.append((p, count))

    if len(scored) == 0:
        return None, "no match — skip"
    if len(scored) == 1:
        return scored[0][0], "suggest"
    return scored, "ambiguous — ask user to pick"
```

## Suggestion UX

**Single match:**

> "This looks like a **{profile.description}**. My default stack for these is {comma-separated stack values} (based on {reference_projects}). Want to use this stack, or discuss alternatives?"

- `use defaults` / `yes` → bake stack + skills into spec's Architecture section; seed `skills-audit` with the profile's `skills` list.
- `discuss alternatives` / `no` → proceed to clarifying questions, no stack bake-in.

**Multiple matches:**

> "This could fit {N} profiles:
> 1. **{profile[0].description}** — matches: {list of hit signals} ({count} signals)
> 2. **{profile[1].description}** — matches: {list} ({count} signals)
>
> Which fits, or `neither`?"

## Seed profiles

Seeded on first run of modified brainstorming via the consent prompt (see `skills/brainstorming/SKILL.md` §Architecture profile matching). The file is **not** written unilaterally.

### Profile: `marketing-content-site`

```json
{
  "id": "marketing-content-site",
  "description": "Brochureware, personal site, agency/consultancy, blog, content-heavy",
  "signals": ["marketing", "content", "blog", "landing", "personal site", "consultancy", "agency", "brochure"],
  "stack": {
    "framework": "astro",
    "ui": "react-islands",
    "styling": "tailwindcss",
    "language": "typescript",
    "database": "neon+drizzle (when needed)",
    "email": "resend",
    "icons": "astro-icon + @iconify-json/tabler",
    "deploy": "netlify"
  },
  "skills": [
    "ultrapowers-dev:typescript-best-practices",
    "ultrapowers-dev:tailwind-patterns",
    "ultrapowers-dev:react-best-practices",
    "neon-drizzle-patterns"
  ],
  "reference_projects": ["datatide-web", "WebPage (enniomaldonado.com)"]
}
```

### Profile: `saas-product-app`

```json
{
  "id": "saas-product-app",
  "description": "Authed product / dashboard / subscription / multi-tenant",
  "signals": ["saas", "app", "product", "auth", "subscription", "dashboard", "tenant", "billing"],
  "stack": {
    "framework": "next.js (app router)",
    "ui": "react",
    "styling": "tailwindcss",
    "language": "typescript",
    "auth": "clerk",
    "database": "supabase",
    "payments": "stripe",
    "email": "resend",
    "i18n": "next-intl (if multilingual)",
    "testing": "vitest + @testing-library + playwright",
    "analytics": "@vercel/analytics",
    "deploy": "vercel"
  },
  "skills": [
    "ultrapowers-dev:nextjs-patterns",
    "ultrapowers-dev:react-patterns",
    "ultrapowers-dev:react-best-practices",
    "ultrapowers-dev:typescript-best-practices",
    "ultrapowers-dev:tailwind-patterns",
    "ultrapowers-dev:testing-tdd",
    "ultrapowers-dev:e2e-testing",
    "ultrapowers-dev:supabase-patterns",
    "clerk-nextjs-patterns",
    "stripe-nextjs-patterns",
    "nextjs-i18n-patterns"
  ],
  "reference_projects": ["ultrapowers-web"]
}
```

## Extending profiles

Users can add profiles by editing `~/.claude/ultrapowers-architecture-defaults.json` directly or through a future `project-setup profiles` mode. Keep `id` stable — it's referenced in specs and plans.
