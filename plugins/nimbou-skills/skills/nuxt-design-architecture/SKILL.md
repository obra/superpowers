---
name: nuxt-design-architecture
description: Use when deciding how to decompose a Nuxt 4 + Vuetify 3 interface into components, composables, utils, and config — component tiers, SOLID boundaries, extraction heuristics, and communication contracts. Pairs with nuxt-design-posture (micro visual) and nuxt-design-composition (macro hierarchy). Local GUIDELINES.md wins on implementation conflict.
---

# Nuxt Design — Architecture

## Overview

Disciplina de decomposição de interfaces Nuxt/Vuetify em componentes, composables, utils e config. Foco em SOLID aplicado ao frontend Vue 3: onde cortar, o que cada camada owns, como comunicar entre níveis.

Esta skill é a fonte genérica. O `GUIDELINES.md` do projeto vence em conflito de implementação — vide `Contrato` no fim.

## When to Use

- Decidindo criar componente novo vs reutilizar/ampliar existente.
- SFC crescendo além do confortável — decidir quando e onde cortar.
- Escolhendo entre composable, util, config ou plugin.
- Modelando comunicação: props, emits, v-model, slots, provide/inject ou store.
- `nuxt-think` precisa fechar "Componentes a reutilizar / a criar / Composables".
- `nuxt-audit` auditando "Componentização e ownership".
- `/design-md` preenchendo a seção **Component Architecture** do `GUIDELINES.md`.

## When NOT to Use

- Escolha de fontes, paleta, tokens CSS, padrões visuais banidos → `nuxt-design-posture`.
- Hierarquia de página, hero, landing vs product UI, motion ritmo → `nuxt-design-composition`.
- Decisão por feature específica (reutilizar qual componente, quais emits) → `nuxt-think` (que consulta esta skill).
- Correção de bug funcional → `nuxt-debug`.

## Pré-condição

O **Working Model** (visual thesis, content plan, interaction thesis) precisa estar escrito — ver `nuxt-design-composition`. Decisão de arquitetura sem content plan tende a quebrar nos próximos dois commits.

## Component Tiers

| Tier                   | Dono de                                            | Exemplos                                            | Location típica                           |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Primitive**          | Apresentação neutra, sem domínio                   | `AppButton`, `AppTextField`, `AppChip`              | `components/ui/`, `components/base/`      |
| **Domain Component**   | Semântica de negócio, rendering + interação local  | `ProjectCard`, `OrderLineRow`, `InvoiceStatusBadge` | `components/<feature>/` próximo à feature |
| **Page / Route Owner** | Route params, data loading, orquestração top-level | `pages/projects/[id].vue`                           | `pages/`                                  |
| **Layout Shell**       | Chrome persistente (header, sidebar, grid base)    | `default.vue`, `admin.vue`                          | `layouts/`                                |

Regras de tier:

- Primitive **não conhece domínio**. Se o nome precisa do domínio pra fazer sentido (`ProjectButton`), é domain component.
- Domain component **não conhece rota**. Recebe dados via props; não chama `useRoute` ou `navigateTo`.
- Page **não acumula handlers filho-only**. Se o handler só afeta uma região, o handler vive naquela região.
- Layout shell **não renderiza conteúdo de feature**. Só chrome.

## Extraction Heuristics (quando extrair)

Gatilhos para criar componente novo:

- **Repetição semântica**: o mesmo markup com o mesmo papel aparece em **3+ locais**.
- **Tamanho de SFC**: > **~150 linhas** → revisar; > **~300 linhas** → dividir.
- **API pública crescendo**: **≥5 props** OR **≥2 slots nomeados** OR **≥3 emits** sugere componente com responsabilidade dupla.
- **Lógica reativa cruzando view**: o mesmo `computed`/`watch` aparece em outra view → composable.
- **Template com aninhamento `v-if`/`v-for` > 2**: quase sempre hora de extrair sub-componente ou config.

Gatilhos para **NÃO** extrair:

- **Especulação**: "pode ser reutilizado no futuro". O segundo consumidor real é o trigger.
- **Prematura**: markup idêntico mas papel semântico diferente (cuidado: dois botões visualmente iguais fazendo coisas opostas não viram o mesmo componente).
- **Micro-extração**: componente com 1 prop e 3 linhas de template. Fica inline.

## SOLID por camada

### SRP — Single Responsibility

| Camada           | Responsabilidade única               |
| ---------------- | ------------------------------------ |
| Page             | Route + data + orquestração          |
| Domain component | Renderização local + interação local |
| Composable       | Estado reativo reutilizável          |
| Util             | Transformação pura                   |

Se uma função responde "faz X **e** Y", parta em duas.

### OCP — Open for extension, closed for modification

- **Slots antes de props condicionais**. Ao invés de `<Card :show-footer="true" :footer-text="..." />`, exponha `<Card><template #footer>...</template></Card>`.
- Scoped slots para expor estado interno ao consumidor (lista que empresta cada item ao slot).

### LSP — Liskov substitution

- Componentes que aceitam o mesmo contrato de props são intercambiáveis.
- Dois "tipos" de Card devem aceitar os mesmos slots e props, não surpresas pontuais.

### ISP — Interface segregation

- Props focados. Evite **god props** tipo `variant: 'primary' | 'secondary' | 'warning' | 'info' | 'compact' | 'dense' | 'raised' | 'flat'`.
- Prefira **2 componentes** focados a **1** com `variant: string` gigante.

### DIP — Dependency inversion

- Componente **não** importa store, service ou SDK diretamente.
- Dependências reativas entram via composable (`useProject()`, `useAuth()`).
- Torna o componente testável em isolamento sem montar toda a infra.

## Contratos de comunicação

| Mecanismo                   | Quando                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| **Props down + emits up**   | Default para parent ↔ child direto.                               |
| **`defineModel` / v-model** | Componente gerencia valor bidirecional.                           |
| **Named slots**             | Conteúdo composto ou customização estrutural.                     |
| **Scoped slots**            | Componente empresta estado interno ao consumidor.                 |
| **`provide` / `inject`**    | Cross-level regional, até ~3 níveis no mesmo subtree.             |
| **Store (Pinia)**           | Estado que sobrevive navegação OU cruza árvores não relacionadas. |

## Regra de níveis (prop drilling vs provide vs store)

- **≤ 2 níveis**: props + emits. Simples, explícito.
- **3 níveis no mesmo subtree**: `provide` + `inject` regional. Escopo do provider, não global.
- **Multi-rota, cross-tree, estado de app**: store (Pinia).

Não use store para uma única interação parent-child.
Não use `provide` como atalho para evitar pensar na API de props.

## Composable vs util vs config vs plugin

| Qual usar quando... | Sinais                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Composable**      | Usa `ref`/`computed`/`watch`/lifecycle. Retorna estado reativo + funções. Nome começa com `use`. |
| **Util**            | Função pura, stateless, sem reatividade. Entrada → saída determinística.                         |
| **Config**          | Declarativo: `const columns = [{ key, label, sortable }, ...]`. Tabs, steps, colunas, menus.     |
| **Plugin**          | Side-effect de app: diretiva global, interceptor de `$fetch`, registrar `i18n`.                  |

Erros comuns:

- Composable que retorna JSX/SFC → não é composable, é componente.
- Util que toca `ref` ou `reactive` → não é util, é composable.
- Config com funções e estado → não é config, é composable.

## Página vs domain component

- **Page orquestra**: carrega dados, lê/escreve route, compõe filhos, ações de alto nível.
- **Domain component resolve internamente**: não bounce-back de toda ação. Emite só quando o parent é **realmente** dono da próxima decisão (ex: navegação entre rotas, mutação que afeta outras árvores).

Teste rápido: se a page tem 20 handlers onde 15 só repassam pra outro filho, 15 estão no lugar errado.

## Testabilidade como critério

Critério de divisão que decide sem precisar opinar:

- **Componente que não monta em isolamento** (requer montar toda a page, ou mock de 4 composables) quebra SRP. Divida.
- **Composable que toca `document`, `window`, `navigator` sem guarda SSR** não é composable — é plugin ou util com side-effect.
- **Composable que retorna template** não existe. É componente.

Se testar dá trabalho desproporcional, a arquitetura está errada — não o teste.

## Refactor triggers (hora de dividir)

Sinais concretos:

- Template > ~80 linhas.
- `v-if` ou `v-for` aninhado > 2 níveis.
- Script com mais de 2 conceitos distintos (dados + filtros + exportação).
- Props crescem em **grupos temáticos** (3+ de paginação, 3+ de seleção) — cada grupo quer virar subcomponente ou composable.
- Watchers duplicados em child e parent observando o mesmo estado.
- Computed que depende de 5+ refs desconhecidos → composable isolado.
- Emit bubbling atravessando 3+ níveis.

## Anti-padrões

- **Emit bubbling cross-level**: child → parent → grandparent → grandgrand. Use `provide` regional ou store.
- **Composable retornando JSX/SFC**: é componente, não composable.
- **Util reativo**: `ref` em util é sinal de composable mal nomeado.
- **God props**: componente com 20+ props. Quebre em sub-componentes ou slots.
- **`Mixin`**: em Vue 3, sempre composable.
- **Store de uma prop**: criar Pinia store para uma única interação parent-child é overkill.
- **Page-god**: page com 300+ linhas orquestrando tudo. Extraia seções para domain components.
- **Prop drilling evitando inject**: 4 níveis passando a mesma prop quando um `provide` regional resolveria.
- **`defineExpose` generalizado**: expor métodos internos como API. Prefira v-model, slots ou composable compartilhado.

## Contrato com skills e artefatos

- **`nuxt-design-posture`**: fonte para micro estética (fontes, cor, tokens, CSS bans). Ortogonal a esta skill.
- **`nuxt-design-composition`**: fonte para hierarquia macro (hero, landing vs product UI, motion ritmo). Esta skill preenche os componentes que a composition organiza.
- **`nuxt-think`**: consulta esta skill + `GUIDELINES.md` local ao fechar "Componentes a reutilizar / a criar / Composables".
- **`nuxt-audit`**: audita "Componentização e ownership" contra `GUIDELINES.md` primário; esta skill é fallback para dimensões não declaradas localmente.
- **`/design-md` (comando)**: usa esta skill como fonte da seção **Component Architecture** do `GUIDELINES.md`.
- **`GUIDELINES.md` do projeto**: quando existir, vence em conflito. Esta skill é a postura genérica/fallback.

## Red flags — pare e reconsidere

- SFC passou de 300 linhas e "tá funcionando".
- Componente com 15+ props, todos opcionais, com lógica `if` interna baseada neles.
- Composable que aceita elemento DOM como argumento.
- Util importando `ref`, `reactive` ou `computed`.
- Mixin (não existe razão em Vue 3).
- Page com 40 handlers, metade delegando para `$refs.something.doX()`.
- `v-model` apontando para prop recebida sem emit correspondente.
- Domain component importando Pinia direto quando o parent já tem o estado.
- Emit com nome genérico (`update`, `change`, `event`) em vez de semântico (`status-toggled`, `archive-requested`).
- "Isso vai ser reutilizado no futuro" — especulação. Espere o segundo consumidor real.
