---
name: vibe-security
description: Audits codebases for common security vulnerabilities that AI coding assistants introduce in "vibe-coded" applications. Checks for exposed API keys, broken access control (Supabase RLS, Firebase rules), missing auth validation, client-side trust issues, insecure payment flows, and more. Use this skill whenever the user asks about security, wants a code review, mentions "vibe coding", or when you're writing or reviewing code that handles authentication, payments, database access, API keys, secrets, or user data — even if they don't explicitly mention security. Also trigger when the user says things like "is this safe?", "check my code", "audit this", "review for vulnerabilities", or "can someone hack this?".
license: MIT
metadata:
  author: Chris Raroque
  version: "1.0"
---

Audit code for security vulnerabilities commonly introduced by AI code generation. These issues are prevalent in "vibe-coded" apps — projects built rapidly with AI assistance where security fundamentals get skipped.

AI assistants consistently get these patterns wrong, leading to real breaches, stolen API keys, and drained billing accounts. This skill exists to catch those mistakes before they ship.


## The Core Principle

Never trust the client. Every price, user ID, role, subscription status, feature flag, and rate limit counter must be validated or enforced server-side. If it exists only in the browser, mobile bundle, or request body, an attacker controls it.


## Audit Process

Examine the codebase systematically. For each step, load the relevant reference file only if the codebase uses that technology or pattern. Skip steps that aren't relevant.

1. **Secrets & Environment Variables** — Scan for hardcoded API keys, tokens, or credentials. Check for secrets exposed via client-side env var prefixes (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`). Verify `.env` is in `.gitignore`. See `references/secrets-and-env.md`.

2. **Database Access Control** — Check Supabase RLS policies, Firebase Security Rules, or Convex auth guards. This is the #1 source of critical vulnerabilities in vibe-coded apps. See `references/database-security.md`.

3. **Authentication & Authorization** — Validate JWT handling, middleware auth, Server Action protection, and session management. See `references/authentication.md`.

4. **Rate Limiting & Abuse Prevention** — Ensure auth endpoints, AI calls, and expensive operations have rate limits. Verify rate limit counters can't be tampered with. See `references/rate-limiting.md`.

5. **Payment Security** — Check for client-side price manipulation, webhook signature verification, and subscription status validation. See `references/payments.md`.

6. **Mobile Security** — Verify secure token storage, API key protection via backend proxy, and deep link validation. See `references/mobile.md`.

7. **AI / LLM Integration** — Check for exposed AI API keys, missing usage caps, prompt injection vectors, and unsafe output rendering. See `references/ai-integration.md`.

8. **Deployment Configuration** — Verify production settings, security headers, source map exposure, and environment separation. See `references/deployment.md`.

9. **Data Access & Input Validation** — Check for SQL injection, ORM misuse, and missing input validation. See `references/data-access.md`.

If doing a partial review or generating code in a specific area, load only the relevant reference files.


## Core Instructions

- Report only genuine security issues. Do not nitpick style or non-security concerns.
- When multiple issues exist, prioritize by exploitability and real-world impact.
- If the codebase doesn't use a particular technology (e.g., no Supabase), skip that section entirely.
- When generating new code, consult the relevant reference files proactively to avoid introducing vulnerabilities in the first place.
- If you find a critical issue (exposed secrets, disabled RLS, auth bypass), flag it immediately at the top of your response — don't bury it in a long list.


## Output Format

Organize findings by severity: **Critical** → **High** → **Medium** → **Low**.

For each issue:
1. State the file and relevant line(s).
2. Name the vulnerability.
3. Explain what an attacker could do (concrete impact, not abstract risk).
4. Show a before/after code fix.

Skip areas with no issues. End with a prioritized summary.

### Example Output

#### Critical

**`lib/supabase.ts:3` — Supabase `service_role` key exposed in client bundle**

The `service_role` key bypasses all Row-Level Security. Anyone can extract it from the browser bundle and read, modify, or delete every row in your database.

```typescript
// Before
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!)

// After — use the anon key client-side; service_role belongs only in server-side code
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```

#### High

**`app/api/checkout/route.ts:15` — Price taken from client request body**

An attacker can set any price (including $0.01) by modifying the request. Prices must be looked up server-side.

```typescript
// Before
const session = await stripe.checkout.sessions.create({
  line_items: [{ price_data: { unit_amount: req.body.price } }]
})

// After — look up the price server-side
const product = await db.products.findUnique({ where: { id: req.body.productId } })
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: product.stripePriceId }]
})
```

### Summary

1. **Service role key exposed (Critical):** Anyone can bypass all database security. Rotate the key immediately and move it to server-side only.
2. **Client-controlled pricing (High):** Attackers can purchase at any price. Use server-side price lookup.


## When Generating Code

These rules also apply proactively. Before writing code that touches auth, payments, database access, API keys, or user data, consult the relevant reference file to avoid introducing the vulnerability in the first place. Prevention is better than detection.


## References

- `references/secrets-and-env.md` — API keys, tokens, environment variable configuration, and `.gitignore` rules.
- `references/database-security.md` — Supabase RLS, Firebase Security Rules, and Convex auth patterns.
- `references/authentication.md` — JWT verification, middleware, Server Actions, and session management.
- `references/rate-limiting.md` — Rate limiting strategies and abuse prevention.
- `references/payments.md` — Stripe security, webhook verification, and price validation.
- `references/mobile.md` — React Native and Expo security: secure storage, API proxy, deep links.
- `references/ai-integration.md` — LLM API key protection, usage caps, prompt injection, and output sanitization.
- `references/deployment.md` — Production configuration, security headers, and environment separation.
- `references/data-access.md` — SQL injection prevention, ORM safety, and input validation.
