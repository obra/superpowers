---
name: nuxt-design-composition
description: Use when shaping the overall composition, hierarchy, and narrative of a Nuxt 4 + Vuetify 3 interface — landing pages, first viewports, page sequences, or product UI shells (dashboards, admin, workspaces). Pairs with nuxt-design-posture for micro aesthetic details (fonts, color tokens, CSS bans).
---

# Nuxt Design — Composition

## Overview

Disciplina de composição macro: o que montar, em que hierarquia, em que sequência. Landing page vs product UI são tratados como modos distintos. Detalhes estéticos (fontes, cor, tokens) são fechados em `nuxt-design-posture`.

## When to Use

- Definindo o primeiro viewport de uma landing / marketing page.
- Desenhando a shell de um dashboard, admin ou workspace operacional (product UI).
- Revisando uma página que "tem as peças certas" mas não se sustenta.
- `/design-md` precisa preencher a composição visual do `DESIGN.md` e o mapeamento de modo no `GUIDELINES.md`.

## When NOT to Use

- Escolha de fontes, paleta, tokens de espaçamento, padrões CSS banidos → `nuxt-design-posture`.
- Estrutura de componentes de uma feature específica → `nuxt-think`.
- Correção de bug visual → `nuxt-debug`.

## Working Model (antes de codar)

Escreva estas 3 coisas primeiro:

- **Visual thesis**: uma frase descrevendo mood, material e energia.
- **Content plan**: para landing — hero, support, detail, final CTA. Para product UI — workspace, navigation, inspector/context, ações.
- **Interaction thesis**: 2-3 ideias de motion que mudam a sensação da página.

Cada seção ganha um único job, uma única ideia visual dominante, um único takeaway ou ação.

Classifique também o **modo**: `landing` (marketing, brand-led, imagery-first) ou `product UI` (operacional, utility-first, dense-readable). As regras adiante mudam conforme o modo.

## First Viewport as a Poster, Not a Document

Trate o primeiro viewport como um **pôster**, não um documento:

- Comece pela composição, não pelos componentes.
- Prefira hero full-bleed ou âncora visual em full-canvas.
- A marca/produto deve ser o texto mais alto.
- Copy curto o bastante para escanear em segundos.
- Whitespace, alignment, scale, cropping e contrast antes de qualquer chrome.
- Limite o sistema: 2 typefaces no máximo, 1 accent color por default.
- **Cardless by default**: sections, columns, dividers, lists e media blocks no lugar.

(Vale principalmente para landing. Para product UI, veja a seção específica abaixo.)

## Landing Pages

### Sequência canônica

1. **Hero**: marca/produto, promessa, CTA, um visual dominante.
2. **Support**: uma feature, oferta ou prova concreta.
3. **Detail**: atmosfera, workflow, profundidade ou story.
4. **Final CTA**: converter, começar, visitar ou contatar.

### Hero rules

- Uma única composição.
- Imagem full-bleed ou plano visual dominante.
- **Canonical full-bleed**: o hero corre edge-to-edge sem herdar gutters da página, container emoldurado, ou max-width compartilhado. Só a coluna interna de texto/ação é constrangida.
- Ordem: **brand first, headline second, body third, CTA fourth**.
- No default: nada de hero cards, stat strips, logo clouds, pill soup, floating dashboards.
- Headline: ~2-3 linhas no desktop, legível em uma olhada no mobile.
- Coluna de texto estreita e ancorada em área calma da imagem.
- Texto sobre imagem mantém contraste forte e tap targets claros.

### Testes destrutivos

- Se o primeiro viewport ainda funciona sem a imagem → a imagem é fraca.
- Se a marca some ao esconder a nav → a hierarquia é fraca.

### Viewport budget

- Header fixo/sticky conta contra o hero. Header + conteúdo do hero precisam caber no viewport inicial em tamanhos comuns de desktop e mobile.
- Usando `100vh`/`100svh`: subtraia chrome persistente (`calc(100svh - header-height)`) ou sobreponha o header em vez de empilhá-lo em normal flow.

## Product UI (dashboards, admin, workspaces)

Default para restraint estilo Linear:

- Hierarquia de superfície calma.
- Tipografia e espaçamento fortes.
- Poucas cores.
- Informação densa, mas legível.
- Chrome mínimo.
- **Cards só quando o card É a interação.**

Organize em torno de:

- Workspace primário
- Navegação
- Contexto secundário ou inspector
- Um único accent para ação ou estado

Evite:

- Mosaicos de dashboard-card.
- Borders grossas em toda região.
- Gradientes decorativos atrás de UI rotineira.
- Vários accent colors competindo.
- Ícones ornamentais que não melhoram scanning.

**Regra de sanidade**: se um painel vira layout plano sem perder significado, remova o tratamento de card.

## Utility Copy For Product UI

Em dashboards, admin tools e workspaces operacionais: prefira **copy utilitária** à copy de marketing.

- Priorize orientação, status e ação sobre promessa, mood ou voz de marca.
- Comece pela superfície operacional: KPIs, charts, filters, tables, status, task context. Não introduza um hero a não ser que o usuário peça.
- Section headings dizem **o que a área é** ou **o que se pode fazer lá**.
- Bom: "Selected KPIs", "Plan status", "Search metrics", "Top segments", "Last sync".
- Evite linhas aspiracionais, metáforas, linguagem de campanha, banners de executive-summary em superfícies de produto.
- Texto de apoio explica escopo, comportamento, freshness ou decision value em uma frase.
- Se uma frase poderia estar num hero de homepage ou num ad, reescreva até soar como UI de produto.
- Se uma seção não ajuda a operar, monitorar ou decidir, remova.
- **Litmus**: um operador que escaneia só headings, labels e números entende a página imediatamente?

## Cards — decisão macro

**Cardless by default.** Use sections, columns, dividers, lists e media blocks antes de alcançar um card.

Permita cards apenas quando:

- O card é a unidade de interação (clicável, selecionável, arrastável).
- O agrupamento de campos só faz sentido isolado visualmente.
- O conteúdo precisa de elevação para sobreviver sobre um fundo complexo.

Rejeite:

- Envelope de card em todo bloco "para separar visualmente".
- Aninhar card dentro de card.
- Grids idênticos de cards (mesmo tamanho, ícone + heading + texto, repetidos ao infinito).
- Hero metric layout (número grande + label pequeno + stats de apoio + gradient accent).

(Anti-padrões micro — como `border-left` em cards — ficam em `nuxt-design-posture`.)

## Imagery

Imagery faz trabalho narrativo.

- Ao menos uma imagem forte e realista para brands, venues, páginas editoriais, produtos de lifestyle.
- Prefira fotografia in-situ a gradientes abstratos ou objetos 3D fake.
- Escolha/corte imagens com uma área tonal estável para o texto.
- Não use imagens com signage, logos ou typographic clutter brigando com a UI.
- Não gere imagens com UI frames, splits, cards ou painéis embutidos.
- Múltiplos momentos = múltiplas imagens, não uma colagem.

Primeiro viewport precisa de âncora visual real. Textura decorativa não basta.

## Copy

- Linguagem de produto, não comentário de design.
- Que o headline carregue o significado.
- Copy de apoio costuma ser uma frase curta.
- Corte repetição entre seções.
- Não coloque linguagem de prompt ou comentário de design na UI.
- Cada seção tem uma responsabilidade: explicar, provar, aprofundar ou converter.

**Heurística**: se deletar 30% da copy melhora a página, continue deletando.

## Motion Target (ritmo, não técnica)

Para trabalho visualmente liderado, envie **2-3 motions intencionais**:

- Uma **entrance sequence** no hero.
- Um efeito **scroll-linked, sticky ou depth**.
- Uma **transição de hover, reveal ou layout** que afia a affordance.

Para product UI, menos é mais: 1 motion ancorando a mudança de estado (drawer, menu, skeleton → conteúdo) costuma bastar.

Em Nuxt/Vue: prefira `<Transition>`, `<TransitionGroup>`, `motion-v` ou CSS puro antes de bibliotecas React-centric. Para scroll-linked, combine `useScroll` do VueUse com `transform` e `opacity`.

Para **como** implementar (easing, propriedades, `grid-template-rows` vs `height`) → `nuxt-design-posture`.

## Hard Rules

- Sem cards by default.
- Sem hero cards by default.
- Sem hero boxed ou center-column quando o brief pede full-bleed.
- Sem mais de uma ideia dominante por seção.
- Sem seção precisando de muitos UI devices pequenos para se explicar.
- Sem headline superando a marca em páginas branded.
- Sem filler copy.
- Sem split-screen hero a não ser que o texto sente num lado calmo e unificado.
- Sem mais de 2 typefaces sem razão clara.
- Sem mais de 1 accent color a não ser que o produto já tenha sistema forte.
- Sem centralizar tudo. Left-aligned com layout assimétrico parece mais desenhado.

## Reject These Failures

- Grid genérico de SaaS cards como primeira impressão.
- Imagem bonita com presença de marca fraca.
- Headline forte sem ação clara.
- Imagery agitada atrás do texto.
- Seções repetindo o mesmo mood statement.
- Carousel sem propósito narrativo.
- UI de app feita de cards empilhados em vez de layout.
- Dashboard aberto com um hero aspiracional no topo.

## Litmus Checks (revisão final)

- A marca ou produto é inconfundível no primeiro screen?
- Existe um único visual anchor forte?
- A página é entendível escaneando apenas os headlines?
- Cada seção tem um job?
- Os cards são realmente necessários?
- Motion melhora hierarquia ou atmosfera (ou é ornamental)?
- O design ainda pareceria premium se todos os drop shadows decorativos fossem removidos?
- **Em product UI**: um operador entende a página escaneando só headings, labels e números?

## AI Slop Test

Se você mostrasse essa interface para alguém e dissesse "AI fez isso", acreditariam imediatamente?

Se sim, é o problema. Interface distintiva faz alguém perguntar "como isso foi feito?", não "qual AI fez?".

## Contrato com skills e artefatos

- **`nuxt-design-posture`**: responsável pelos micro-detalhes estéticos (fontes, cor, tokens, CSS bans, motion techniques). Esta skill define a arquitetura visual; posture a preenche.
- **`nuxt-design-architecture`**: responsável pela decomposição em componentes/composables/utils (tiers, SOLID, extração, contratos). Esta skill organiza a página; architecture organiza o código por trás dela.
- **`nuxt-think`**: consulta esta skill quando o request envolve landing, hero, estrutura de página, ou shell de product UI.
- **`/design-md` (comando)**: esta skill é fonte da seção **Layout** do `DESIGN.md` e da seção **Mode and Route Mapping** do `GUIDELINES.md`; posture fecha micro estética; architecture fecha implementação.
- **`DESIGN.md` do projeto**: quando existir, vence em conflito visual.
