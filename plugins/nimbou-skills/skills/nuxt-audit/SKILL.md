---
name: nuxt-audit
description: Audit Nuxt 4 + Vuetify 3 frontend work for architecture, reuse, hardening, performance, and final polish without editing code.
---

# Nuxt Audit

Read `reference/quality-rules.md` before auditing.

This is the single frontend review pass for Nuxt/Vuetify work in this repository. Do not split the review into separate "harden", "extract", "optimize", or "polish" passes. Cover all of those dimensions here.

## Design File Resolution

Before auditing, locate the nearest `DESIGN.md` and `GUIDELINES.md` in the target project for the area being changed.

Resolution order:
1. If the request names a route, page, feature, or component path, start from that directory and walk upward.
2. If the request does not name a path, infer the likely ownership area from the target feature and inspect that subtree first.
3. Use the first local `GUIDELINES.md` you find as the primary implementation source.
4. Use the first local `DESIGN.md` you find as the primary visual source.
5. If broader app-level or project-level files also exist higher in the tree, use them as fallback context only.

If one or both files do not exist, continue with the repository rules, call out the missing file as a `Sugestao`, and suggest generating or refreshing them with `/design-md`.

## Severity

- Critico - breaks architecture, maintainability, resilience, or user-visible correctness.
- Atencao - convention drift, weak reuse, or performance debt that should be fixed soon.
- Sugestao - non-blocking improvement, guideline gap, or cleanup opportunity.

## Audit Dimensions

- Componentizacao e ownership
- Arquitetura, SOLID, e fluxo de dados
- Localidade de estado e canal de comunicacao
- Reuso e extracao de componentes, composables, utils, e config
- Hardening: erro, vazio, loading, overflow, i18n, e dados extremos
- Performance: rendering, requests, hydration, images, and bundle behavior
- Polish: spacing, alignment, consistency, copy seams, and visual drift
- Convencoes Nuxt e Vuetify
- Catalogo
- CSS e SCSS

## Audit Method

1. Read the nearest `GUIDELINES.md` and `DESIGN.md` and extract the local rules that apply to the target area.
2. Inspect the route/page owner first, then child components, composables, stores, and styles.
3. Compare the implementation to existing patterns before inventing a better one.
4. Separate issues by type:
   - bug or broken behavior
   - guideline drift
   - missing extraction opportunity
   - hardening gap
   - performance or polish debt
5. Check whether the implementation ignored an obvious local primitive, wrapper, table shell, dialog pattern, empty-state pattern, or entity autocomplete that the project already provides.
6. Check whether state is living too high: page handlers that only proxy child work, prop drilling without a natural reason, or a store introduced for simple parent-child coordination.
7. Check whether the same data is fetched or watched in multiple owners without a clear reason.
8. Do not fix code. Produce a report that can drive the next implementation pass directly.

## Output

Produce a report with:

### Resumo

- Scope audited
- `GUIDELINES.md` files consulted
- `DESIGN.md` files consulted
- Counts per severity

### Achados

List each finding with:
- severity
- area
- file or feature reference
- why it is a problem
- the smallest concrete correction direction

Common high-value findings to look for when the local guideline supports them:
- rebuilt local shell instead of existing project primitive or wrapper
- destructive action confirmed with browser-native confirm instead of local pattern
- manual entity autocomplete despite existing domain-specific picker
- duplicated page/composable fetch ownership
- store used for simple parent-child communication
- missing loading, empty, error, success, overflow, or responsive handling in a meaningful flow
- local style drift such as raw CSS values where project tokens or required preprocessors should apply

### Proximo passo sugerido

End with one concrete next command or next action, using the findings as input for the implementation pass in the current session.
