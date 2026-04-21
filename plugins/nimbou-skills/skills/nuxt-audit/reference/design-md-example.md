# DESIGN.md — example

Fictional project. Use this file as a concrete reference when preenchendo um `DESIGN.MD` real via `/design-md`. It shows what migrates from the generic skills (`nuxt-design-posture`, `nuxt-design-composition`, `nuxt-design-architecture`) into project-specific decisions.

> **Não copie este arquivo como-é.** Ele ilustra o tipo e a granularidade da decisão — não os valores. Cada projeto preenche com suas próprias fontes, hues, paths e convenções.

Project: **Haven** — SaaS de observabilidade para SRE, com site institucional (`/`, `/pricing`, `/blog/*`) e workspace logado (`/app/*`) no mesmo deploy Nuxt 4.

---

## Product and Interface Context

- **Audience**: SREs e engenheiros de plataforma em empresas B2B médias. Leem o workspace 3–6h/dia, geralmente com outras ferramentas abertas.
- **Job**: consolidar alertas, correlacionar métricas entre serviços, responder incidentes sem trocar de ferramenta.
- **Tone**: preciso, quieto, mecânico. A UI deve desaparecer; o dado deve ficar.
- **Anti-look**: hero aspiracional, roxo-azul, cards floating, stat strips, ícones decorativos com cantos arredondados.

---

## Mode

`hybrid` — dois modos no mesmo deploy.

| Route | Mode | Skill baseline |
|---|---|---|
| `/`, `/pricing`, `/customers`, `/blog/*` | `landing` | `nuxt-design-composition` (landing) |
| `/app/*` (authenticated) | `product-ui` | `nuxt-design-composition` (product UI restraint) |
| `/docs/*` | `landing` (editorial variant) | idem |

Rule: o layout `layouts/marketing.vue` aplica o hero canon; o `layouts/app.vue` aplica o shell de product UI. Eles nunca compartilham componente de topo.

> See `nimbou-skills:nuxt-design-composition` for mode-specific rules.

---

## Visual Posture

### Typography

- **Display**: `GT Sectra Display` — serifada editorial, peso 500. Usada em `/` hero, `/blog/*` titles, `/app/*` empty states.
- **Body**: `Söhne` — sans grotesque opinativa, pesos 400/500/600. Default para corpo, UI, labels, números.
- **Mono**: `Söhne Mono` — tabular-nums para tabelas de métricas, logs, timestamps.
- **Rationale**: Sectra traz peso editorial sem pedir reverência; Söhne mantém densidade técnica sem parecer Inter. Par respeita `reflex_fonts_to_reject` (nenhuma das duas está na lista).
- **Scale marketing** (headings): `clamp(2rem, 6vw + 1rem, 5.5rem)`, razão 1.333 entre passos.
- **Scale product UI**: fixed `rem` — `0.75, 0.875, 1, 1.125, 1.25, 1.5, 2`. Sem fluid em dashboards.

### Color & Theme

- **Hue base**: `oklch(65% 0.15 240)` — azul frio, levemente esverdeado. Saiu do logo.
- **Theme default**: `dark` no `/app/*` (SREs em escritório escuro, uso prolongado); `light` no `/` e `/docs/*` (leitura diurna, contexto aquisitivo). `prefers-color-scheme` respeitado em ambos como override.
- **Neutral tint**: chroma `0.008` toward hue 240°. `--surface-0` = `oklch(98% 0.008 240)` no light, `oklch(12% 0.008 240)` no dark.
- **60-30-10**: 60% superfícies e chrome; 30% labels, bordas, estados secundários; 10% accent (hue base em 65% L no dark, 55% L no light).
- **Cores proibidas neste projeto**: vermelho puro (`oklch(65% 0.2 25)`) — usamos âmbar (`oklch(75% 0.15 85)`) para erro. Vermelho é reservado para "incidente P0" e não aparece em outro lugar.

### Spacing

- **Escala**: 4pt default do fork — 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Tokens**: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`.
- **Container grid**: `--content-narrow: 40rem` (blog), `--content-regular: 72rem` (marketing), `--content-full: 100%` (app workspace).

### Absolute Bans Accepted Locally

- Mantemos os dois bans universais.
- **Exceção documentada**: `v-alert` da Vuetify expõe um `border-start-*` de 3px que é parte da API interna dela. Aceitamos em `v-alert` específico; não estendemos o padrão a cards ou list items.

> See `nimbou-skills:nuxt-design-posture` for deeper rules (reflex_fonts_to_reject, OKLCH reasoning, theme by context).

---

## Page Composition

### Landing sequence (marketing routes)

1. **Hero** — brand + "Observability that stays out of the way" + primary CTA + uma imagem in-situ de um operador em monitor dark.
2. **Proof** — três logos de clientes + um número concreto ("Replaces 3 tools in 70% of installs").
3. **Core feature** — correlação entre métricas e logs; screenshot real do workspace em dark mode.
4. **Objection handling** — compliance, auto-hospedagem, preço.
5. **Final CTA** — "Start monitoring in 10 minutes" com input de email direto (sem modal).

### Hero rules (local)

- Full-bleed canonical. Container `marketing.vue` tem `max-width` só na coluna de texto interna.
- Ordem: `Haven wordmark` > `headline 2 linhas desktop / 1 mobile` > `subhead 1 linha` > `CTA primary` > `link secundário "see how it works"`.
- Nav sticky conta contra o hero: `calc(100svh - 4rem)`.
- Proibido: hero com dashboard flutuando, stat strip sob o CTA, carousel de logos no hero.

### Product UI shell (`/app/*`)

- Left rail (80px) — ícones de seção, sem labels em default, labels em hover.
- Main workspace — lista densa à esquerda, inspector à direita quando selecionado.
- Top bar (48px) — breadcrumb + busca global. Sem logo, sem avatar decorativo.
- Accent: uma cor única (brand hue) para estado "selecionado" e para ação primary do contexto.

### Motion ritmo (local)

- **Marketing**: 2 motions por rota — hero entrance (stagger 120ms entre wordmark/headline/subhead/CTA) + scroll-linked parallax leve no hero image (translateY até 40px).
- **Product UI**: 1 motion por interação — drawer do inspector abre com `transform: translateX` + `opacity`, 180ms `ease-out-quart`. Nada de fade genérico em listas.

> See `nimbou-skills:nuxt-design-composition` for working model, destructive tests, utility copy rules.

---

## Component Architecture

### Tiers (paths reais)

| Tier | Location | Prefix | Notes |
|---|---|---|---|
| Primitive | `components/ui/` | `App*` (`AppButton`, `AppTextField`, `AppTable`) | Neutros, sem domínio. Wrappers finos sobre Vuetify. |
| Domain component | `components/<feature>/` | feature-first (`IncidentRow`, `MetricChart`, `AlertInspector`) | Local à feature em `/app/*`. |
| Marketing block | `components/marketing/` | `Marketing*` (`MarketingHero`, `MarketingProofRow`) | Só usados em `layouts/marketing.vue`. Nunca em `/app/*`. |
| Page / Route owner | `pages/` | route-colocated | Orquestra data + layout + composição. |
| Layout shell | `layouts/` | `default.vue`, `marketing.vue`, `app.vue` | Chrome persistente. |

Regra: nenhum componente em `components/marketing/` importa algo de `components/<feature>/` e vice-versa. Compartilhado vira `components/ui/`.

### SOLID ownership (traduzido para Haven)

- **Page owns**: `useRoute`, `useHead`, `definePageMeta`, chamadas `useFetch`/`useLazyFetch` iniciais, `provide` regional para inspectors.
- **Domain component owns**: rendering + interação local. **Proibido** importar Pinia direto — vem via composable.
- **Composable owns**: `useIncidents()`, `useMetricsQuery(params)`, `useAlertInspector()`. Retornam estado reativo + ações.
- **Util owns**: `formatDuration()`, `severityToColor()`, `sparkline(points)`. Puros, stateless.
- **Config owns**: `incidentColumns`, `navSections`, `severityLevels`. Imports, não funções.

### Extraction triggers (local — mais apertado que o genérico)

- SFC > 180 linhas → revisar; > 250 linhas → dividir. (Fork default é 150/300; Haven adota corte mais cedo.)
- API pública com ≥ 4 props → verificar se é dois componentes disfarçados.
- Mesmo `watch`/`computed` em 2 lugares → composable (sem esperar a terceira vez).

### Comunicação

- **Props + emits** até 2 níveis.
- **`provide`/`inject`** regional para inspector state (`provide('selectedIncidentId', ...)` no nível da rota).
- **Pinia** para auth, user preferences, live websocket de alertas. **Nada mais.**
- **`defineModel`** em todos os inputs — nunca `value` + `@update` manual.

### Anti-padrões locais (além dos genéricos)

- `defineExpose` proibido no `/app/*`. Se um parent precisa controlar um child, o estado vira `provide` ou composable compartilhado.
- Nenhum componente em `components/ui/` pode importar de `features/*` ou `stores/*`. CI trava.
- `v-html` só com input sanitizado via `DOMPurify`. Qualquer `v-html` sem ponteiro a sanitizer é bloqueio de review.
- Nenhum `setInterval` em componente. Sempre via composable com cleanup `onScopeDispose`.

> See `nimbou-skills:nuxt-design-architecture` for the generic ruleset (SFC size general thresholds, testability criterion, refactor triggers).

---

## UI Primitives and Layout

Preferidos neste projeto:

- **Data table**: `AppTable` (wrapper sobre `v-data-table-virtual` com defaults densidade, tabular-nums, row hover sutil). Nunca usar `v-data-table` pelado.
- **Form stack**: `AppFormStack` + `AppTextField` — spacing vertical consistente, labels fora do input.
- **Drawer/Inspector**: `AppInspector` (slideover direito, 480px, `v-theme-provider` escopado).
- **Empty states**: `AppEmpty` com slot `#illustration`, slot `#title`, slot `#action`. Nenhuma ilustração 3D — line art simples.
- **Code block**: `AppCode` (Söhne Mono, tabular-nums, `prefers-reduced-motion` respeitado no highlight animation).

Rule: se a feature precisa de um primitivo novo, ele nasce em `components/ui/` com `<catalog>`, não inline.

---

## Hardening Expectations

- **Loading**: skeleton dentro do card/row, não overlay global. Tempo mínimo 200ms para evitar flicker.
- **Empty**: sempre explica o estado com ação sugerida. "Nenhum incidente nos últimos 7 dias" + botão "expandir janela para 30 dias".
- **Error**: inline no card, com retry manual. Erro global só em auth failure.
- **Long text**: truncar com `line-clamp` + tooltip no hover. Nunca permitir overflow horizontal.
- **Large collections**: `v-data-table-virtual` obrigatório acima de 200 linhas.
- **Small screens**: `/app/*` colapsa left rail para bottom bar abaixo de 768px; inspector vira modal fullscreen.
- **i18n**: pt-BR + en-US. Todas strings via `$t()`. Layout testado com +30% de largura (alemão/português longos).

---

## Performance Expectations

- **Data**: `useLazyFetch` para listas não-críticas; `useFetch` apenas para dados do primeiro paint.
- **WebSocket**: um conn único global via plugin, canal por feature via composable.
- **Assets**: imagens via `<NuxtImg>` com `format="webp"` e `loading="lazy"` default. Lottie proibido; prefer SVG ou CSS.
- **Bundle**: rotas de `/app/*` em route-group separado. `/app/*` bundle < 350kb gzip.
- **Hydration**: nada de `window`/`document` fora de `onMounted`. Lint trava.

---

## Naming and Organization

- Domain components em PascalCase feature-first: `IncidentRow`, `MetricChartPanel`.
- Composables em camelCase com prefixo `use`: `useIncidents`, `useAlertInspector`.
- Utils em camelCase verb-first: `formatDuration`, `severityToColor`.
- Config files: plural PascalCase: `IncidentColumns`, `NavSections`.
- Pinia stores: `useAuthStore`, `useLiveAlertsStore`.
- Arquivos de feature moram em `components/<feature>/`; composables relacionados em `composables/<feature>/`.

---

## Audit Expectations

`nuxt-audit` audita contra este `DESIGN.MD` primeiro. Quando uma dimensão não está declarada, cai para:

- Visual drift → `nimbou-skills:nuxt-design-posture`.
- Composition drift → `nimbou-skills:nuxt-design-composition`.
- Architecture drift → `nimbou-skills:nuxt-design-architecture`.

Coverage específica que importa em Haven:

- Nenhum `v-data-table` pelado (deve ser `AppTable`).
- Nenhum componente `/app/*` importando Pinia direto.
- Nenhuma `setInterval` solta.
- Contraste em dark mode ≥ WCAG AA nos estados críticos (incident P0/P1).
- Todo `v-html` com sanitizer documentado.

---

## When To Update This File

- Uma nova feature introduziu um padrão que já se repete 2× (tabela virtualizada com filtros persistentes, por exemplo).
- Um refactor recorrente sempre chega no mesmo shape (extrair inspector state para composable).
- Uma exceção local a um ban genérico precisa ser registrada (ex: `v-alert` acima).
- Uma skill genérica ficou frouxa ou apertada demais para este projeto.

Última atualização: **2026-04-21** — adicionada seção Marketing block, exceção documentada do `v-alert`, regra de bundle size em `/app/*`.
