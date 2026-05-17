# Design Spec: Agentic Development Harness

**Date:** 2026-05-17
**Status:** Approved
**Author:** josuerf + AI Assistant

## Summary

Um Automated Verification Harness full-stack para o plugin superpowers-prepared que transforma o ciclo de desenvolvimento agêntico em um loop fechado de Execução-Validação-Correção. O Harness garante que nenhuma task seja considerada completa sem passar por validações automáticas de lint, type-check, testes, coverage, segurança e domain-specific checks.

## Architecture

### Core Principle: Core Library (Opção A)

Lógica de validação centralizada em `lib/harness/`, chamada por hooks, skills, CLI e subagents. Stack-agnostic com módulos por stack carregados sob demanda.

### Directory Structure

```
superpowers-prepared/
├── lib/
│   └── harness/
│       ├── index.ts              — Entry point, orchestrator
│       ├── config.ts             — Parser .harness-workspace.json + .harness.config.json
│       ├── discovery.ts          — Auto-detecção de stacks + workspace scanning
│       ├── runner.ts             — Executor de comandos com timeout + output parsing
│       ├── reporter.ts           — Geração de relatórios JSON + MD por feature
│       ├── boundary.ts           — extract_boundary_context (AST parsing)
│       ├── installer.ts          — Instalação sob demanda de ferramentas externas
│       ├── validators/
│       │   ├── lint.ts           — ESLint, Prettier, dotnet format, black
│       │   ├── typecheck.ts      — tsc, dotnet build, mypy, go build
│       │   ├── test.ts           — jest, vitest, dotnet test, pytest, go test
│       │   ├── coverage.ts       — Coverage gate por arquivo modificado
│       │   ├── security.ts       — Semgrep, Trivy, gitleaks, npm audit
│       │   ├── integration.ts    — API contracts, e2e
│       │   ├── domain-specific.ts— Lighthouse, EXPLAIN, TFLint
│       │   └── migration.ts      — Análise de migrações de banco
│       ├── stacks/
│       │   ├── base.ts           — Interface IStackHandler
│       │   ├── react-nextjs.ts
│       │   ├── csharp-aspnet.ts
│       │   ├── terraform.ts
│       │   ├── python-fastapi.ts
│       │   ├── node-express.ts
│       │   └── go-std.ts
│       └── reviewers/
│           ├── base-prompt.md    — System prompt base ReviewerAgent
│           ├── secops-prompt.md  — System prompt base SecOps Agent
│           └── stacks/
│               ├── react-nextjs.md
│               ├── csharp-aspnet.md
│               └── terraform.md
├── tools/
│   └── harness/
│       ├── cli.ts                — CLI entry point
│       ├── install-tools.ts      — Instala ferramentas externas
│       └── scan-workspace.ts     — Re-scan do workspace
├── hooks/
│   └── post-task-validation.js   — Hook automático pós-task
└── skills/
    ├── harness-verify/
    │   └── SKILL.md
    └── extract-boundary/
        └── SKILL.md
```

## Validation Pipeline

### verify-local (Ralph Loop do Subagente)

1. **lint** → ESLint/Prettier/dotnet format/black
2. **typecheck** → tsc/dotnet build/mypy/go build
3. **test** → jest/vitest/dotnet test/pytest/go test
4. **coverage** → Gate de cobertura mínima (default: 80%)

**Target:** < 30s | Fail-fast com erro estruturado + contexto da spec

### verify-all (Reconciliação do Main Agent)

1-4. Tudo do verify-local
5. **security** → Semgrep + gitleaks + npm audit
6. **integration** → API contracts, e2e
7. **domain-specific** → Lighthouse (FE), EXPLAIN (DB), TFLint (IaC)

**Target:** < 5min | Gera report MD → Main Agent delega correção se falhar

## Core Components

### HarnessRunner

Orquestra execução dos validadores na ordem correta. Cada validador retorna:

```typescript
interface ValidationResult {
  passed: boolean;
  errors: ParsedError[];
  warnings: string[];
  duration: number;
}
```

Fail-fast: se um validador falha, para e devolve erro parseado + contexto da spec.

### ErrorParser

Transforma output bruto em erros estruturados:

```typescript
interface ParsedError {
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: 'error' | 'warning';
}
```

Agrupa por tipo (lint, type, test), sugere correções, comprime output para otimizar tokens.

### SpecContextInjector

Cruza erros com a spec da task. Exemplo:

```
❌ Test falhou: should-return-401-unauthorized
📋 Spec exige: auth middleware na rota /api/users
💡 Sugestão: Implementar middleware de auth antes do handler
```

### FeatureReporter

Gera relatórios em `.harness/reports/<feature>/<timestamp>-verify-report.md`

Nome da feature: branch name → spec title → timestamp

## Stack Modules

### IStackHandler Interface

```typescript
interface IStackHandler {
  name: string;
  detect(projectRoot: string): boolean;
  lintCmd(): string;
  typecheckCmd(): string;
  testCmd(files?: string[]): string;
  coverageCmd(): string;
  securityTools(): SecurityTool[];
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[];
}
```

Cada stack (react-nextjs, csharp-aspnet, terraform, etc.) implementa esta interface.

## Reviewer Agents

### Base Prompt (common a todas as stacks)

Social accountability framing. Checklist universal: SOLID, Clean Code, Design Patterns, tratamento de erros, performance básica.

### Stack Modules (carregados sob demanda)

- **React/Next.js:** Component isolation, prop drilling check, error boundaries, Core Web Vitals, acessibilidade (WCAG)
- **C#/ASP.NET:** DI patterns, async/await anti-patterns, idempotência em APIs, telemetry/OpenTelemetry, rate limiting
- **Terraform:** State management, non-blocking resources, least privilege IAM, secret exposure no IaC

### SecOps Agent

Analisa relatórios do Semgrep/Trivy/gitleaks. Determina verdadeiro/falso positivo. Gera regras de exceção auditáveis. Classifica severidade real.

### Flow na Reconciliação

1. Main Agent spawna ReviewerAgent → passa diff + stack modules relevantes
2. ReviewerAgent analisa → gera relatório estruturado
3. Se issues → Main Agent delega correção ao subagente originador
4. Subagente corrige → re-runs verify-local → devolve
5. ReviewerAgent re-review only affected files → aprova ou repete

## Hook Automático + Skills

### PostTaskValidation Hook

Disparado automaticamente quando o agente para de editar arquivos (detectado pelo track-edits hook):

1. Detecta quais arquivos foram modificados
2. Identifica o projeto/stack afetado via .harness-workspace.json
3. Executa verify-local (lint → typecheck → test → coverage)
4. Se passou → permite continuar
5. Se falhou → bloqueia, devolve erro estruturado + contexto da spec

### Skill: harness-verify

Ativada manualmente pelo agente ou usuário:

- `/verify local` → verify-local (passos 1-4)
- `/verify all` → verify-all (passos 1-7)
- `/verify security` → apenas security scan

### Skill: extract-boundary

Extrai contexto de fronteira para subagents via AST parsing. Mapeia dependências diretas, tipos e contratos. Injeta apenas o necessário no subagent prompt.

## Integração com subagent-driven-development

Modificações no SKILL.md do subagent-driven-development:

1. Antes de dispatchar implementer → invoca `extract-boundary` para contexto mínimo
2. No prompt do implementer → injeta: "Após cada alteração, rode `npx harness verify-local`"
3. Após implementer completar → Main Agent spawna ReviewerAgent + SecOps Agent
4. ReviewerAgent analisa → se issues → delega correção ao mesmo subagente
5. Após correção → re-runs verify-local → ReviewerAgent re-review
6. Quando todas as tasks da wave completam → Main Agent faz merge + verify-all

## Workspace Discovery

### .harness-workspace.json

**Workspace mode** (raiz do workspace):

```json
{
  "version": "1",
  "generated": "2026-05-17T10:00:00Z",
  "lastScan": "2026-05-17T10:00:00Z",
  "projects": [
    { "path": "frontend", "stack": "react-nextjs", "config": "./frontend/.harness.config.json" },
    { "path": "backend", "stack": "csharp-aspnet", "config": "./backend/.harness.config.json" }
  ],
  "workspaceConfig": {
    "autoRescan": true,
    "reportPath": ".harness/reports"
  }
}
```

**Project mode** (dentro de um projeto individual):

```json
{
  "version": "1",
  "generated": "2026-05-17T10:00:00Z",
  "projectRoot": ".",
  "stack": "react-nextjs",
  "config": "./.harness.config.json"
}
```

O Harness detecta o modo pela presença/ausência do campo `projects`. Re-scan periódico detecta novos projetos automaticamente.

### .harness.config.json (por projeto)

```json
{
  "coverageMin": 80,
  "securityScan": {
    "enabled": true,
    "tools": { "semgrep": true, "gitleaks": true, "npmAudit": true, "trivy": false }
  },
  "domainSpecific": {
    "lighthouse": { "enabled": true, "budget": { "performance": 90 } },
    "tflint": false
  },
  "timeout": { "verifyLocal": 30, "verifyAll": 300 },
  "failOn": { "lint": "error", "coverage": "warning", "security": "error" }
}
```

## Reports

### Estrutura

```
.harness/reports/
├── auth-middleware/
│   ├── 2026-05-17T14-30-verify-report.md
│   └── 2026-05-17T14-35-verify-report.md
└── user-dashboard/
    └── 2026-05-17T15-00-verify-report.md
```

### Format

```markdown
# Verify Report — auth-middleware
Date: 2026-05-17T14:30:00Z | Mode: verify-local | Duration: 18s

## Summary
✅ Lint: 0 errors, 2 warnings (unused imports)
✅ TypeCheck: passed (tsc, 12 files)
✅ Tests: 8/8 passing (jest)
⚠️ Coverage: 78% (target: 80%) — 2 files abaixo do threshold

## Issues
1. src/middleware/auth.ts:42 — Missing test for invalid token case
   📋 Spec exige: "deve retornar 401 para tokens inválidos"
   💡 Sugestão: Adicionar teste com token expirado e malformado

## Recommendations
- Adicionar teste de edge case: token sem payload
- Considerar extrair constant para JWT_EXPIRY
```

## Commands

| Command | Description |
|---------|-------------|
| `/verify [local\|all\|security]` | Executa pipeline de verificação sob demanda |
| `/harness-status` | Report em Markdown do estado atual |
| `/explain-drift` | Diff semântico entre plano e implementação |
| `/scan-workspace` | Re-scaneia workspace por novos projetos |

## Tool Installation

Ferramentas externas (Semgrep, Trivy, gitleaks) instaladas sob demanda na primeira execução via npm wrappers. Configuração via `.harness.config.json` permite ativar/desativar individualmente.

## Database Migration Safety

Migrações destrutivas geram warning + sugestão de migração segura non-blocking. Não bloqueia, mas documenta o risco. Exemplo: adicionar coluna nullable → backfill → adicionar constraint.

## Design Principles

1. **DRY:** Lógica compartilhada entre hooks, skills e CLI
2. **Stack-agnostic:** Base genérica + módulos por stack sob demanda
3. **Token-efficient:** Erros parseados + estruturados, nunca output bruto
4. **Install-on-demand:** Ferramentas externas na primeira execução
5. **Workspace-aware:** Suporta multi-projeto com discovery automático
6. **Fail-fast:** Para no primeiro erro, devolve contexto acionável
7. **Spec-aligned:** Erros cruzados com critérios de aceitação da task
