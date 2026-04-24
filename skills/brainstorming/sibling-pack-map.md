# Sibling-Pack Keyword Map

This map is consulted by `skills/brainstorming/SKILL.md` during the "Scan for sibling-pack skills" step.

Matching is **case-insensitive, whole-word/phrase**. A signal must appear in the approved design or derived from user answers to trigger the suggestion. If the same signal matches multiple skills, include all matches.

## `ultrapowers-dev` map

| Signal | Suggested skill |
|---|---|
| python | `ultrapowers-dev:python-best-practices` |
| typescript / ts | `ultrapowers-dev:typescript-best-practices` |
| javascript / js (non-TS) | `ultrapowers-dev:javascript-best-practices` |
| react | `ultrapowers-dev:react-best-practices`, `ultrapowers-dev:react-patterns` |
| next.js / nextjs | `ultrapowers-dev:nextjs-patterns` |
| fastapi | `ultrapowers-dev:fastapi-patterns` |
| django | `ultrapowers-dev:django-patterns` |
| flask | `ultrapowers-dev:flask-patterns` |
| express | `ultrapowers-dev:express-patterns` |
| nestjs | `ultrapowers-dev:nestjs-patterns` |
| rails | `ultrapowers-dev:rails-patterns` |
| laravel | `ultrapowers-dev:laravel-patterns` |
| spring boot | `ultrapowers-dev:spring-boot-patterns` |
| angular | `ultrapowers-dev:angular-patterns` |
| tailwind | `ultrapowers-dev:tailwind-patterns` |
| supabase | `ultrapowers-dev:supabase-patterns` |
| rust | `ultrapowers-dev:rust-best-practices` |
| go / golang | `ultrapowers-dev:go-best-practices` |
| java | `ultrapowers-dev:java-best-practices` |
| kotlin | `ultrapowers-dev:kotlin-best-practices` |
| swift | `ultrapowers-dev:swift-best-practices` |
| dart | `ultrapowers-dev:dart-best-practices` |
| flutter | `ultrapowers-dev:dart-best-practices` *(no Flutter-specific skill today — Dart skill is closest match; revisit if a Flutter skill ships)* |
| c / c++ / cpp | `ultrapowers-dev:c-cpp-best-practices` |
| csharp / c# | `ultrapowers-dev:csharp-best-practices` |
| php | `ultrapowers-dev:php-best-practices` |
| ruby | `ultrapowers-dev:ruby-best-practices` |
| testing / tdd | `ultrapowers-dev:testing-tdd` |
| e2e / playwright / cypress | `ultrapowers-dev:e2e-testing` |
| sql / postgres / mysql / sqlite | `ultrapowers-dev:sql-best-practices` |
| database / schema | `ultrapowers-dev:database-design` |
| cache / caching | `ultrapowers-dev:caching` |
| auth / authentication / authorization | `ultrapowers-dev:auth-security` |
| api / rest / graphql | `ultrapowers-dev:api-design` |
| observability / logging / tracing | `ultrapowers-dev:observability` |
| resilience / retry / circuit breaker | `ultrapowers-dev:resilience` |
| background job / queue / worker | `ultrapowers-dev:background-jobs` |
| rag / embedding / vector | `ultrapowers-dev:rag-ai` |
| ci/cd / pipeline | `ultrapowers-dev:ci-cd` |
| type safety / generics | `ultrapowers-dev:type-safety` |
| error handling | `ultrapowers-dev:error-handling` |
| design pattern / solid | `ultrapowers-dev:design-patterns` |
| architecture / microservice / monolith | `ultrapowers-dev:architecture` |
| frontend design / ui | `ultrapowers-dev:frontend-design` |
| web design / accessibility | `ultrapowers-dev:web-design-guidelines` |
| browser automation | `ultrapowers-dev:browser-automation` |
| tool call / function call | `ultrapowers-dev:tool-calling` |
| agent loop | `ultrapowers-dev:agent-loop` |
| orchestrator / workers | `ultrapowers-dev:orchestrator-workers` |
| multi-agent debate | `ultrapowers-dev:multi-agent-debate` |
| multi-agent handoff | `ultrapowers-dev:multi-agent-handoffs` |
| dag / workflow | `ultrapowers-dev:dag-workflows` |
| parallelization | `ultrapowers-dev:parallelization` |
| ratatui / tui | `ultrapowers-dev:ratatui-patterns` |
| plugin | `ultrapowers-dev:plugin-development` |

## `ultrapowers-business` map

| Signal | Suggested skill |
|---|---|
| seo | `ultrapowers-business:seo-audit` |
| ai seo / llm seo | `ultrapowers-business:ai-seo` |
| copy / headline / landing page | `ultrapowers-business:copywriting` |
| page conversion / cro | `ultrapowers-business:page-cro` |
| pricing | `ultrapowers-business:pricing-strategy` |
| email sequence / drip | `ultrapowers-business:email-sequence` |
| cold email / outbound | `ultrapowers-business:cold-email` |
| social / linkedin / twitter | `ultrapowers-business:social-content` |
| paid ads / google ads / meta ads | `ultrapowers-business:paid-ads` |
| schema markup / structured data | `ultrapowers-business:schema-markup` |
| analytics / tracking / ga4 | `ultrapowers-business:analytics-tracking` |
| signup flow | `ultrapowers-business:signup-flow-cro` |
| onboarding | `ultrapowers-business:onboarding-cro` |
| form / lead capture | `ultrapowers-business:form-cro` |
| popup / modal | `ultrapowers-business:popup-cro` |
| paywall / upgrade | `ultrapowers-business:paywall-upgrade-cro` |
| churn / retention | `ultrapowers-business:churn-prevention` |
| referral / affiliate | `ultrapowers-business:referral-program` |
| launch / product hunt | `ultrapowers-business:launch-strategy` |
| site architecture / sitemap | `ultrapowers-business:site-architecture` |
| ab test / experiment | `ultrapowers-business:ab-test-setup` |
| pitch deck | `ultrapowers-business:pitch-deck` |
| sales enablement / battle card | `ultrapowers-business:sales-enablement` |
| lead magnet | `ultrapowers-business:lead-magnets` |
| free tool / calculator | `ultrapowers-business:free-tool-strategy` |
| revops / lead scoring / crm | `ultrapowers-business:revops` |
| content strategy | `ultrapowers-business:content-strategy` |
| programmatic seo | `ultrapowers-business:programmatic-seo` |
| competitor / alternatives | `ultrapowers-business:competitor-alternatives` |
| financial model / cap table | `ultrapowers-business:financial-modeling` |
| gdpr | `ultrapowers-business:gdpr-compliance` |
| soc 2 | `ultrapowers-business:soc2-compliance` |
| marketing ideas / growth | `ultrapowers-business:marketing-ideas` |
| marketing psychology | `ultrapowers-business:marketing-psychology` |
| technical writing / docs | `ultrapowers-business:technical-writing` |
| copy edit / proofread | `ultrapowers-business:copy-editing` |
| ad creative | `ultrapowers-business:ad-creative` |

## Usage

When `brainstorming` invokes this map:

1. Collect all signals from the approved design (architecture section, tech stack mentions, domain descriptions).
2. For each signal, collect matching skills from both tables.
3. For each matched skill, check the session's available-skills list (injected via `<system-reminder>`):
   - If `ultrapowers-dev:<skill>` or `ultrapowers-business:<skill>` appears in the list → **installed match**.
   - If the pack's prefix is entirely absent from the list → **missing match** (candidate for install prompt).
   - If the prefix is present but this specific skill isn't → treat as "installed, just not this specific skill" — don't trigger install prompt.
4. Deduplicate. Return two lists: `installed_matches`, `missing_matches`.

## Extending the map

Add new rows when a new sibling-pack skill is released. Keep the signal column lowercase. Prefer broad signals ("python") over narrow ones ("pytest fixtures") unless the narrow signal materially changes which skill is best.
