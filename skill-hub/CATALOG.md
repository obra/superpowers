# Skill Hub — Catalogo Completo

> 73 skills organizadas em 8 categorias, extraidas de 6 repositorios.

---

## Origem das Skills

| Repo | Skills | Foco |
|------|--------|------|
| `bullcast` | 11 | Full-stack dev (Next.js + Python + Supabase) |
| `ui-ux-pro-max-skill` | 7 | Design intelligence (50+ estilos, 161 paletas, BM25 search) |
| `claude-cookbooks` | 4 | Education, API patterns, financial models |
| `superpowers` | 14 | Dev workflow (TDD, debugging, planning, code review) |
| `ecommerce-ops` | 12 | E-commerce ops (ads, copy, CRO, email, video) |
| `braza-ofertas` | 25 | Dropshipping ops (9 agents + 8 marketing + 8 workflows) |

---

## 1. Strategy (3 skills)

| Skill | Origem | Descricao | Triggers |
|-------|--------|-----------|----------|
| `briefing-strategy` | bullcast | Discovery de projeto em 5 fases (perguntas → brainstorm → requisitos → stack → next steps) | "briefing", "discovery", "novo projeto", "requisitos", "MVP" |
| `creative-strategist` | ecommerce-ops | Pensamento profundo, analise critica, brainstorming estrategico | "analisa", "pensa", "estrategia", "brainstorm", "como melhorar" |
| `project-architect` | bullcast | Arquitetura de sistemas, wave-based task management, ERD | "arquitetura", "system design", "roadmap", "tasks", "planejar" |

**Path**: `.claude/skills/strategy/`

---

## 2. Design (10 skills)

| Skill | Origem | Descricao | Triggers |
|-------|--------|-----------|----------|
| `vibe-design` | bullcast/ecommerce-ops | **OBRIGATORIO** — Framework premium Awwwards-level, 6-phase pipeline, GSAP | "design bonito", "premium", "animacoes", "glassmorphism", "landing page" |
| `ui-ux-design` | bullcast | Design system completo, Figma MCP, component library, accessibility | "UI", "UX", "design system", "Figma", "componentes", "wireframe" |
| `ui-ux-pro-max` | ui-ux-pro-max-skill | Intelligence engine: 50+ estilos, 161 paletas, 57 font pairings, BM25 search | "estilo", "paleta", "tipografia", "product type", "design intelligence" |
| `ui-styling` | ui-ux-pro-max-skill | shadcn/ui + Tailwind CSS + canvas design, 60+ fonts | "shadcn", "Tailwind", "tema", "dark mode", "componente UI" |
| `design-system` | ui-ux-pro-max-skill | Token architecture (primitive→semantic→component), CSS variables, specs | "design tokens", "spacing", "typography scale", "CSS variables" |
| `brand` | ui-ux-pro-max-skill | Brand voice, visual identity, messaging frameworks, asset management | "marca", "brand", "identidade visual", "tom de voz", "style guide" |
| `design-unified` | ui-ux-pro-max-skill | Logo gen (55 estilos), CIP (50 deliverables), icons, social photos | "logo", "CIP", "icone", "foto social", "mockup" |
| `web-design` | ecommerce-ops | E-commerce pages: hero, product, checkout, category (Tailwind v4) | "banner", "hero", "product page", "checkout", "loja" |
| `banner-design` | ui-ux-pro-max-skill | Banners para social media, ads, web heroes, print | "banner", "ad creative", "social media image" |
| `slides` | ui-ux-pro-max-skill | Apresentacoes HTML com Chart.js, design tokens, layouts responsivos | "slide", "apresentacao", "pitch deck", "presentation" |

**Path**: `.claude/skills/design/`

---

## 3. Frontend (1 skill)

| Skill | Origem | Descricao | Triggers |
|-------|--------|-----------|----------|
| `frontend-react` | bullcast | React 19 patterns, Server Components, RSC, TypeScript strict, Suspense | "React", "componente", "hook", "Next.js", "Vite", "zustand" |

**Path**: `.claude/skills/frontend/`

---

## 4. Backend (2 skills)

| Skill | Origem | Descricao | Triggers |
|-------|--------|-----------|----------|
| `backend-api` | bullcast | REST/GraphQL APIs, JWT/OAuth auth, middleware stack, Zod validation | "API", "REST", "GraphQL", "endpoint", "autenticacao", "middleware" |
| `database-schema` | bullcast | Prisma ORM, migrations, RLS policies, Supabase PostgreSQL | "database", "schema", "Prisma", "migration", "tabela", "SQL" |

**Path**: `.claude/skills/backend/`

---

## 5. DevOps (3 skills)

| Skill | Origem | Descricao | Triggers |
|-------|--------|-----------|----------|
| `cicd-deploy` | bullcast | Docker, GitHub Actions, Vercel deployment, multi-env pipeline | "deploy", "Docker", "CI/CD", "GitHub Actions", "Vercel", "pipeline" |
| `observability` | bullcast | OpenTelemetry, Langfuse (LLM tracing), structured logging, alerting | "monitoring", "tracing", "logs", "metricas", "alerting", "APM" |
| `testing-patterns` | bullcast | TDD red-green-refactor, Vitest (unit), Playwright (E2E), test pyramid | "teste", "TDD", "E2E", "Playwright", "Vitest", "coverage" |

**Path**: `.claude/skills/devops/`

---

## 6. Workflow (13 skills)

> Origem: `superpowers` — Fluxo completo de desenvolvimento para AI coding agents.

| Skill | Descricao |
|-------|-----------|
| `brainstorming` | Refinamento Socratico de ideias, spec documents |
| `dispatching-parallel-agents` | Coordenacao de tarefas independentes em paralelo |
| `executing-plans` | Execucao de planos em sessoes separadas |
| `finishing-a-development-branch` | Conclusao de trabalho com merge/PR |
| `receiving-code-review` | Processar e responder feedback de code review |
| `requesting-code-review` | Despachar code review de trabalho completo |
| `subagent-driven-development` | Execucao com subagents + two-stage review |
| `systematic-debugging` | Debug em 4 fases com root cause analysis |
| `test-driven-development` | Ciclo RED-GREEN-REFACTOR com principios TDD |
| `using-git-worktrees` | Branches isolados com git worktrees |
| `verification-before-completion` | Verificacao antes de declarar task completa |
| `writing-plans` | Criacao de planos detalhados de implementacao |
| `writing-skills` | Criacao de novas skills seguindo best practices |

**Path**: `.claude/skills/workflow/`

---

## 7. Marketing (10 skills)

| Skill | Origem | Descricao | Triggers |
|-------|--------|-----------|----------|
| `marketing-growth` | bullcast | Growth loops, CRO, SEO, analytics, launch strategy | "marketing", "SEO", "growth", "analytics", "launch" |
| `copywriting-persuasivo` | ecommerce-ops | AIDA/PAS/BAB frameworks, headlines, CTAs, scripts de venda | "copy", "headline", "CTA", "texto persuasivo" |
| `offer-engineering` | ecommerce-ops | Ofertas irresistiveis, VSL, upsell/downsell/OTO, price anchoring | "oferta", "VSL", "upsell", "bundle", "garantia" |
| `email-sequence` | ecommerce-ops | Welcome, cart abandon, post-purchase sequences | "email", "automacao", "carrinho abandonado" |
| `email-dmr` | ecommerce-ops | Direct response email marketing, broadcast, reativacao | "email flow", "abandono", "welcome series", "newsletter" |
| `page-cro` | ecommerce-ops | CRO audit 12 dimensoes, A/B testing, exit intent | "conversao", "CRO", "bounce rate", "A/B test" |
| `trafego-pago` | ecommerce-ops | Cross-platform paid traffic (Meta + Google + TikTok) | "trafego pago", "funil", "budget", "ROAS", "CAC" |
| `facebook-ads` | ecommerce-ops | Meta Ads completo: audiences, creatives, bidding, pixel | "Facebook Ads", "Meta Ads", "retargeting", "lookalike" |
| `instagram-strategy` | ecommerce-ops | Grid, reels, stories, hashtags, calendario editorial | "Instagram", "reels", "stories", "engajamento" |
| `video-creation` | ecommerce-ops | Kling 3.0 + Seedance 2.0 prompts, storyboards, video ads | "video", "Kling", "Seedance", "reels", "TikTok" |

**Path**: `.claude/skills/marketing/`

---

## 8. E-commerce (25 skills)

> Origem: `braza-ofertas` — Operacao completa de dropshipping BR.

### 8.1 Agents (9)

| Agent | Dominio | Trigger |
|-------|---------|---------|
| `SCOUT` | Research, CI, product scoring SSB v2.0 | "SCOUT: avalia [produto]" |
| `NOVA` | Meta Ads performance + Shopify store ops | "NOVA: analisa campanhas" |
| `COPY` | PT-BR copywriting, UGC briefs, VSL scripts | "COPY: cria ad pro [produto]" |
| `PIXEL` | AI image generation (Nano Banana Pro 2) | "PIXEL: gera imagens" |
| `DATA` | Analytics, P&L, unit economics, anomaly detection | "DATA: diagnostica metricas" |
| `GROWTH` | SEO BR, WhatsApp, email, upsell, TikTok Shop | "GROWTH: diversifica canais" |
| `AUTOMATOR` | n8n automation, webhooks, workflow pipelines | "AUTOMATOR: automatiza [processo]" |
| `QA` | Quality assurance gatekeeper (APPROVED/REJECTED) | "QA: audita [produto]" |
| `GRAM` | Instagram strategy, bio, feed, reels, editorial | "GRAM: cria conteudo" |

### 8.2 Marketing Skills (8)

| Skill | Descricao |
|-------|-----------|
| `page-cro` | CRO audit framework (12 dimensoes) |
| `copywriting-ptbr` | 5 frameworks para PT-BR |
| `paid-ads-meta` | Meta Ads test + scale phases |
| `product-scoring` | SSB v2.0 multi-criteria scoring |
| `instagram-content` | Pipeline de conteudo Instagram |
| `analytics-tracking` | Pixel + CAPI + GA4 + UTM |
| `ab-testing` | A/B testing (Taguchi method) |
| `seo-local-br` | SEO + Google Shopping Brasil |

### 8.3 Workflows (8)

| Workflow | Descricao |
|----------|-----------|
| `product-launch` | Pipeline completo: research → loja → campanha |
| `test-sprint-7day` | Sprint de validacao de produto em 7 dias |
| `weekly-optimization` | Ciclo de otimizacao semanal |
| `creative-refresh` | Rotacao de criativos |
| `image-pipeline` | Batch image generation via Nano Banana 2 |
| `n8n-automation` | Setup de workflow n8n + integracoes |
| `daily-briefing` | Check de performance diario (5 min) |
| `mega-research` | Pipeline de pesquisa profunda |

**Path**: `.claude/skills/ecommerce/`

---

## Composicao de Skills

Skills ativam juntas quando o contexto pede:

| Pedido | Skills Ativadas |
|--------|----------------|
| "Cria landing page pro produto" | vibe-design + web-design + copywriting-persuasivo |
| "Planeja a arquitetura do app" | briefing-strategy + project-architect |
| "Cria componente React acessivel" | frontend-react + ui-ux-design + testing-patterns |
| "Deploy com CI/CD" | cicd-deploy + testing-patterns |
| "Analisa campanha Meta" | creative-strategist + facebook-ads + page-cro |
| "Lanca produto novo na loja" | SCOUT → NOVA → COPY → PIXEL → GRAM → QA |
