---
name: nuxt-design-posture
description: Use when the composition is already framed and the remaining decisions are micro-aesthetic — font selection, color tokens, spacing scale, motion techniques, and forbidden CSS patterns (border-left stripes, gradient text). Pairs with nuxt-design-composition (macro hierarchy, landing vs product UI) and /design-md (project guardrails).
---

# Nuxt Design — Posture

## Overview

Disciplina de micro-detalhes estéticos para interfaces Nuxt/Vuetify: o que pintar (fonte, cor, escala, padrão CSS), não o que montar. Composição, hierarquia e sequência de página são tratadas em `nuxt-design-composition`.

## When to Use

- Decidindo fonte, paleta, tokens de espaçamento, easing, bans CSS.
- `nuxt-design-composition` já fechou a hierarquia macro e falta o tratamento fino.
- `/design-md` precisa preencher "Visual Guardrails" com regras concretas.

## When NOT to Use

- Hierarquia de página, hero, sequência de seções, landing vs product UI → `nuxt-design-composition`.
- Estrutura de componentes de uma feature → `nuxt-think`.
- Correção de bug visual pontual → `nuxt-debug`.

## Pré-condição

Antes de qualquer decisão de token, o **Working Model** (visual thesis, content plan, interaction thesis) precisa estar escrito — ver `nuxt-design-composition`. Se não estiver, pare e feche lá primeiro.

## Tipografia

### Princípios (aplicar sempre, sem consultar referência)

- Use escala modular com fluid sizing (`clamp`) em headings de páginas de marketing/conteúdo. Use escalas fixas em `rem` para UIs de app e dashboards (nenhum design system sério usa fluid type em UI de produto).
- Menos tamanhos, mais contraste. Escala de 5 passos com razão ≥ 1.25 entre passos cria hierarquia mais clara que 8 tamanhos 1.1× apart.
- Line-height escala inversamente ao line-length. Coluna estreita pede leading apertado; coluna larga pede mais ar. Para texto claro sobre fundo escuro, ADICIONE 0.05-0.1 ao line-height normal — tipo leve lê como peso menor e precisa respirar mais.
- Line-length no corpo: ~65-75ch.

### Procedimento de seleção de fonte (antes de digitar qualquer nome)

Modo de falha natural do modelo: "me disseram para não usar Inter, então pego minha próxima favorita, que vira o novo monocultura." Evite com este procedimento, em ordem:

**Passo 1.** Leia o brief uma vez. Escreva 3 palavras concretas para a voz da marca (ex: "warm and mechanical and opinionated", "calm and clinical and careful", "fast and dense and unimpressed", "handmade and a little weird"). NÃO "modern" ou "elegant" — são categorias mortas.

**Passo 2.** Liste as 3 fontes que você escolheria reflexivamente. Provavelmente estão nesta lista:

```
reflex_fonts_to_reject:
  Fraunces, Newsreader, Lora, Crimson, Crimson Pro, Crimson Text,
  Playfair Display, Cormorant, Cormorant Garamond,
  Syne, IBM Plex Mono, IBM Plex Sans, IBM Plex Serif,
  Space Mono, Space Grotesk, Inter, DM Sans,
  DM Serif Display, DM Serif Text, Outfit, Plus Jakarta Sans,
  Instrument Sans, Instrument Serif
```

Rejeite toda fonte desta lista. São os defaults de treinamento que criam monocultura entre projetos.

**Passo 3.** Explore um catálogo com as 3 palavras em mente. Fontes: Google Fonts, Pangram Pangram, Future Fonts, Adobe Fonts, ABC Dinamo, Klim Type Foundry, Velvetyne. Procure algo que sirva à marca como um **objeto físico** — uma legenda de museu, uma placa pintada à mão, o manual de um mainframe dos anos 70, a etiqueta de tecido dentro de um casaco, um livro infantil impresso em jornal barato. Rejeite a primeira coisa que "parece design" — é o mesmo reflexo treinado. Continue procurando.

**Passo 4.** Cross-check. Fonte certa para brief "elegante" NÃO é necessariamente serifada. Para brief "técnico" NÃO é necessariamente sans. Para brief "warm" NÃO é Fraunces. Se a escolha final bater com o padrão reflexo, volte ao Passo 3.

### Regras

- **DO** escala modular com fluid sizing em headings.
- **DO** variar pesos e tamanhos para hierarquia clara.
- **DO** variar a escolha entre projetos. Se o último usou display serifado, procure sans, monospace ou display face.
- **DO** carregar fontes via `@nuxt/fonts` ou CSS custom; registre no tema.
- **DO NOT** Inter, Roboto, Arial, Open Sans, system defaults — nem trocar pela segunda favorita. Toda fonte em `reflex_fonts_to_reject` está banida.
- **DO NOT** monospace como atalho preguiçoso para "técnico/dev".
- **DO NOT** ícones grandes com cantos arredondados acima de todo heading.
- **DO NOT** uma família só para a página toda. Pareie display + body.
- **DO NOT** escala plana (tamanhos muito próximos). Mire ≥ 1.25 entre passos.
- **DO NOT** corpo longo em uppercase. All-caps só para labels curtos e headings.

## Cor & Tema

### Princípios (aplicar sempre, sem consultar referência)

- Use **OKLCH**, não HSL. OKLCH é perceptualmente uniforme — passos iguais em lightness _parecem_ iguais, o que HSL não entrega. Ao se aproximar do branco ou preto, REDUZA chroma — chroma alto em lightness extrema fica berrante. Um azul claro em 85% de lightness quer ~0.08 de chroma, não os 0.15 da cor base.
- **Tinte seus neutros em direção à hue da marca.** Chroma de 0.005-0.01 já é perceptível e cria coesão subconsciente entre cor da marca e superfícies de UI. A hue sai do brief desta marca, não de fórmula "warm = amigável" / "cool = tech". Pegue a hue real da marca primeiro, depois tinte tudo em direção a ela.
- **Regra 60-30-10 é sobre peso visual, não contagem de pixels.** 60% neutro/surface, 30% texto secundário e borders, 10% accent. Accents funcionam PORQUE são raros.

### Seleção de tema (light vs dark)

Tema deve ser **derivado** de audiência e contexto de uso, não escolhido do default. Leia o brief: quando o produto é usado, por quem, em que ambiente?

- DEX de perpétuos durante trading rápido → dark
- Portal hospitalar em celular à noite por pacientes ansiosos → light
- App de leitura infantil → light
- Fórum de motos vintage (usuário na garagem às 21h) → dark
- Dashboard de observabilidade para SREs em escritório escuro → dark
- Checklist de casamento em domingo de manhã → light
- Player de música para escuta em fones à noite → dark
- Homepage de revista de gastronomia em pausa de café → light

Não default tudo para light "para jogar seguro". Não default tudo para dark "pra ficar cool". Ambos são o reflexo preguiçoso. O tema certo é o que o usuário real quer no contexto real.

### Regras

- **DO** funções modernas de cor (`oklch`, `color-mix`, `light-dark`).
- **DO** tintar neutros em direção à hue da marca.
- **DO NOT** texto cinza em fundo colorido — fica lavado. Use um tom do próprio fundo.
- **DO NOT** `#000` puro ou `#fff` puro. Sempre tinte.
- **DO NOT** a paleta AI: ciano sobre escuro, gradientes roxo→azul, accents neon em fundo escuro.
- **DO NOT** gradient text para impacto (veja **Absolute Bans**).
- **DO NOT** default dark mode com accents brilhantes. Parece "cool" sem exigir decisão.
- **DO NOT** default light mode "por segurança" tampouco.

## Tokens de Espaçamento

- **Escala 4pt com tokens semânticos**: `--space-xs`, `--space-sm`, `--space-md`, não `--spacing-8`. Escala: **4, 8, 12, 16, 24, 32, 48, 64, 96**. 8pt é grossa demais — frequentemente você vai querer 12px entre dois valores.
- Use `gap` em vez de margins para espaçamento entre irmãos. Elimina margin collapse e hacks.
- **Grid auto-ajustável**: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` — grid responsivo sem breakpoint para conteúdo em cards.
- **Container queries** (`@container`) para componentes; **viewport queries** para layout de página. Card numa sidebar adapta à largura da sidebar, não da viewport.
- Corpo com `max-width: 65-75ch`. Passar disso cansa o olho.

Para decisões sobre **se deve ter card** ou **quantas seções na página** → `nuxt-design-composition`.

## Absolute Bans

Estes padrões CSS **nunca** são aceitáveis. São as impressões digitais mais reconhecíveis de design gerado por AI. Match-and-refuse: se você se pegar prestes a escrever qualquer um, pare e reescreva o elemento com estrutura diferente.

### BAN 1 — Side-stripe borders em cards/list items/callouts/alerts

- **Padrão**: `border-left:` ou `border-right:` com largura > 1px
- **Inclui**: cores hard-coded E variáveis CSS
- **Proibido**: `border-left: 3px solid red`, `border-left: 4px solid #ff0000`, `border-left: 4px solid var(--color-warning)`, `border-left: 5px solid oklch(...)` etc.
- **Por quê**: é o "toque de design" mais abusado em admin, dashboard, médico. Nunca parece intencional — independente de cor, radius, opacidade ou se a variável chama "primary", "warning" ou "accent".
- **Reescreva**: estrutura diferente. Não troque só por `box-shadow` inset. Considere borders completas, background tints, números/ícones à esquerda, ou nenhum indicador visual.

### BAN 2 — Gradient text

- **Padrão**: `background-clip: text` (ou `-webkit-background-clip: text`) combinado com background em gradiente
- **Proibido**: qualquer combinação que faça o fill do texto vir de `linear-gradient`, `radial-gradient` ou `conic-gradient`
- **Por quê**: gradient text é decorativo, não significativo — top 3 de design tell de AI.
- **Reescreva**: cor sólida única. Para ênfase, use peso ou tamanho, não fill em gradiente.

## Detalhes Visuais

- **DO** elementos decorativos intencionais que reforçam a marca: gradientes de malha, texturas de grão, padrões geométricos, transparências em camadas, sombras dramáticas, cursores customizados. Cada um alinhado ao tom escolhido.
- **DO NOT** glassmorphism em tudo (blur, glass cards, glow borders decorativos).
- **DO NOT** sparklines como decoração.
- **DO NOT** rounded rectangles com drop shadow genérico.

## Movimento (técnicas)

- **DO** easing exponencial (`ease-out-quart/quint/expo`) para desaceleração natural.
- **DO** animações de altura via `grid-template-rows` em vez de `height`.
- **DO** CSS transitions, `<Transition>` e `<TransitionGroup>` do Vue antes de qualquer dependência adicional.
- **DO NOT** animar layout (`width`, `height`, `padding`, `margin`). Só `transform` e `opacity`.
- **DO NOT** bounce ou elastic. Parece datado; objetos reais desaceleram suavemente.
- **DO NOT** bibliotecas de motion extras sem justificativa no `DESIGN.MD`.

Para o **ritmo** (quantos motions por página, quais momentos ancoram) → `nuxt-design-composition`.

## Integração com Vuetify 3

- Customize tokens no `vuetify.config` antes de escrever CSS local.
- Use `v-theme-provider` para escopar variantes de tema em seções específicas.
- Quando sobrescrever CSS de componente Vuetify, documente a razão no `DESIGN.MD`.
- `slots` e `density` resolvem a maioria dos ajustes antes de qualquer CSS custom.
- Vuetify traz Material Design como default — se a marca não é Material, redefina os tokens no tema em vez de fugir via `!important`.

## Contrato com skills e artefatos

- **`nuxt-design-composition`**: define a arquitetura visual (hierarquia, hero, sequência, landing vs product UI). Esta skill preenche-a com tokens, fontes, cores e técnicas.
- **`nuxt-design-architecture`**: decompõe a UI em componentes/composables/utils. Ortogonal a esta skill — arquitetura ≠ estética.
- **`nuxt-think`**: consulta esta skill ao preencher `Direcao visual` da feature, depois de `nuxt-design-composition` fechar a estrutura.
- **`/design-md` (comando)**: esta skill é fonte da seção "Visual Posture" do `DESIGN.MD`.
- **`DESIGN.MD` do projeto**: quando existir, vence em conflito. Esta skill justifica, não substitui.

## Red flags — pare e reconsidere

- Fonte padrão do Vuetify porque "é rápido".
- Fonte da lista `reflex_fonts_to_reject` como escolha final.
- Cor base em HSL em vez de OKLCH.
- Chroma alto em lightness extrema (≥0.12 acima de 85% L).
- Gradiente roxo → rosa sobre branco "porque fica bonito".
- `border-left: > 1px` em card, callout, alerta ou list item.
- `background-clip: text` com gradiente em heading.
- Mesmo token de spacing em tudo (sem ritmo).
- Default dark ou light sem relação com contexto de uso.
