# CLAUDE.md — Skill Hub Master Template

> Este arquivo e o template master para novos projetos. Copie, adapte `[PLACEHOLDERS]`, e comece.

---

## Identidade

- **Projeto**: [NOME_DO_PROJETO]
- **Descricao**: [Uma linha descrevendo o projeto]
- **Stack**: [Next.js 15 / React 19 / TypeScript / Tailwind v4 / Supabase / etc.]
- **Idioma padrao**: Portugues BR (copy/conteudo) | English (code/commits)

---

## Regras Absolutas

1. **Pense antes de executar** — Use `/think` para tarefas complexas antes de codar
2. **Leia contexto primeiro** — Sempre leia `briefs/BRAND-CONTEXT.md` + `STATE.md` antes de agir
3. **vibe-design e OBRIGATORIO** — Todo output visual (HTML/CSS/JS) passa pela skill vibe-design
4. **TypeScript strict, zero `any`** — Codigo production-grade com tipos completos
5. **Mobile-first responsive** — 3 breakpoints minimos (375/768/1440)
6. **WCAG AA minimo** — Contraste 4.5:1, focus states, alt texts, aria labels
7. **Nunca hardcode secrets** — Use `.env` para todas as chaves
8. **Quantifique tudo** — Scores, metricas, numeros concretos (nunca "bom" ou "ruim")
9. **1 CTA por contexto** — Objetivo claro e unico por secao
10. **Conventional commits em ingles** — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

---

## Anti-Patterns (NUNCA faca)

- Executar sem pensar quando o problema e complexo
- Dar sugestoes genericas sem contexto do projeto
- Gerar HTML/CSS sem a skill vibe-design
- Ignorar mobile ou acessibilidade
- Hardcodar secrets no codigo
- Usar opinioes sem dados quantificados
- Fazer 10 coisas mediocres ao inves de 3 excelentes
- Usar cores/fontes genericas sem design tokens
- Ignorar BRAND-CONTEXT.md quando existe
- Copiar copy de concorrente sem adaptacao

---

## Skills Disponiveis

As skills ativam automaticamente por contexto da conversa. Veja `CATALOG.md` para a lista completa.

### Categorias

| Categoria | Skills | Quando Ativa |
|-----------|--------|--------------|
| **Strategy** | briefing-strategy, creative-strategist, project-architect | Planejamento, brainstorm, arquitetura |
| **Design** | vibe-design, ui-ux-design, ui-ux-pro-max, ui-styling, design-system, brand, web-design, banner-design, slides | Qualquer output visual |
| **Frontend** | frontend-react | React, componentes, hooks, Next.js |
| **Backend** | backend-api, database-schema | APIs, rotas, banco de dados, Prisma |
| **DevOps** | cicd-deploy, observability, testing-patterns | Deploy, monitoring, testes |
| **Workflow** | TDD, debugging, planning, code-review, git-worktrees | Fluxo de desenvolvimento |
| **Marketing** | copywriting, ads, email, CRO, trafego, Instagram, video | Marketing digital, growth |
| **E-commerce** | SCOUT, NOVA, COPY, PIXEL, DATA, GROWTH, AUTOMATOR, QA, GRAM | Operacoes de e-commerce/dropshipping |

---

## Comandos Rapidos

| Comando | O que faz |
|---------|-----------|
| `/brief` | Discovery de projeto (10 perguntas → brainstorm → requisitos → stack) |
| `/plan` | Planejamento de implementacao (arquitetura → waves → tarefas atomicas) |
| `/think` | Analise profunda com multiplas perspectivas |
| `/brainstorm` | Gera 12+ ideias, filtra, prioriza top 3 |
| `/suggest` | Sugestoes de melhoria priorizadas por ICE score |
| `/analyze` | Analise de performance com recomendacoes |
| `/review` | Code review checklist (seguranca, a11y, performance) |
| `/commit` | Conventional commit automatico do diff staged |
| `/deploy` | Pipeline completo (lint → type-check → test → build → deploy) |
| `/eval` | Roda avaliacoes de skill contra test cases |

---

## Estrutura do Projeto

```
[NOME_DO_PROJETO]/
├── CLAUDE.md                    # Este arquivo (instrucoes globais)
├── CATALOG.md                   # Indice completo de skills
├── STATE.md                     # Estado atual do projeto
├── .env.example                 # Template de variaveis de ambiente
├── .mcp.json                    # Configuracao de MCP servers
├── briefs/
│   └── BRAND-CONTEXT.md         # Contexto de marca (lido por todas as skills)
├── .claude/
│   ├── settings.json            # Hooks de seguranca e formatacao
│   ├── commands/                # Slash commands
│   ├── agents/                  # Subagent prompts
│   └── skills/                  # Skills organizadas por categoria
│       ├── strategy/            # Planejamento e arquitetura
│       ├── design/              # UI/UX e design visual
│       ├── frontend/            # React e frontend
│       ├── backend/             # APIs e banco de dados
│       ├── devops/              # Deploy e observabilidade
│       ├── workflow/            # Fluxo de dev (TDD, debug, review)
│       ├── marketing/           # Marketing digital
│       └── ecommerce/           # Operacoes de e-commerce
├── templates/                   # Templates reutilizaveis
├── docs/                        # Documentacao
└── src/                         # Codigo-fonte do projeto
```

---

## Roteamento de Skills

O roteamento e automatico por keywords na conversa:

```
"novo projeto" | "briefing" | "discovery"     → briefing-strategy
"arquitetura" | "planejar" | "tasks"          → project-architect
"analisa" | "pensa" | "estrategia"            → creative-strategist
"design" | "landing page" | "componente"      → vibe-design + ui-ux-design
"React" | "componente" | "hook" | "Next.js"   → frontend-react
"API" | "endpoint" | "autenticacao"           → backend-api
"database" | "schema" | "Prisma"              → database-schema
"deploy" | "Docker" | "CI/CD"                 → cicd-deploy
"monitoring" | "tracing" | "logs"             → observability
"teste" | "TDD" | "E2E"                       → testing-patterns
"copy" | "headline" | "CTA"                   → copywriting-persuasivo
"Facebook Ads" | "Meta Ads" | "campanha"      → facebook-ads
"email" | "automacao" | "carrinho"            → email-sequence / email-dmr
"conversao" | "CRO" | "bounce rate"           → page-cro
"oferta" | "VSL" | "upsell"                   → offer-engineering
"Instagram" | "reels" | "stories"             → instagram-strategy
"video" | "Kling" | "Seedance"                → video-creation
"trafego pago" | "funil" | "ROAS"             → trafego-pago
```

---

## Pipeline de Novo Projeto

```
1. /brief         → Discovery e requisitos
2. /plan          → Arquitetura e tarefas
3. Implementacao  → Skills ativam por contexto
4. /review        → Quality check
5. /deploy        → Pipeline de deploy
6. /suggest       → Melhorias finais
```

---

## Como Adaptar Este Template

1. **Substitua [PLACEHOLDERS]** no topo com dados do seu projeto
2. **Remova categorias** de skills que nao usa (ex: ecommerce se nao e loja)
3. **Adicione regras especificas** do seu dominio na secao "Regras Absolutas"
4. **Crie `briefs/BRAND-CONTEXT.md`** com identidade visual, tom de voz, paleta
5. **Configure `.mcp.json`** com os MCP servers que precisa
6. **Ajuste `.claude/settings.json`** com hooks de seguranca do seu projeto
