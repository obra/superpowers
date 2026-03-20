# [SKILL_NAME] — SKILL.md Template

> Copie este template para criar novas skills. Substitua `[PLACEHOLDERS]`.

---

## Identidade

```yaml
name: [skill-name]
description: [Uma linha descrevendo a skill]
category: [strategy|design|frontend|backend|devops|workflow|marketing|ecommerce]
version: 1.0.0
triggers:
  - "[keyword1]"
  - "[keyword2]"
  - "[keyword3]"
```

---

## Quando Ativar

Use esta skill SEMPRE que o usuario pedir [DESCRICAO_DO_CONTEXTO].
Tambem ative quando mencionar: "[trigger1]", "[trigger2]", "[trigger3]".

---

## Pipeline

### Fase 1 — Analise
- [ ] Entender o pedido do usuario
- [ ] Ler contexto relevante (BRAND-CONTEXT.md, STATE.md)
- [ ] Identificar restricoes e requisitos

### Fase 2 — Planejamento
- [ ] Definir abordagem
- [ ] Listar dependencias
- [ ] Estimar complexidade

### Fase 3 — Execucao
- [ ] Implementar solucao
- [ ] Validar contra requisitos
- [ ] Testar resultado

### Fase 4 — Entrega
- [ ] Formatar output final
- [ ] Verificar qualidade (checklist abaixo)
- [ ] Apresentar resultado ao usuario

---

## Regras

1. [Regra especifica #1 da skill]
2. [Regra especifica #2 da skill]
3. [Regra especifica #3 da skill]

---

## Checklist de Qualidade

- [ ] Output atende ao pedido original
- [ ] Codigo/conteudo esta em PT-BR (ou idioma do projeto)
- [ ] Sem hardcoded secrets
- [ ] Mobile-first (se visual)
- [ ] Acessivel (se visual)
- [ ] Quantificado (metricas concretas, nao opinioes)

---

## Referencias

Arquivos de referencia em `./references/`:
- `[reference-file].md` — [Descricao]

---

## Evals

Test cases em `./evals/evals.json`:

```json
[
  {
    "id": "eval-001",
    "input": "[Prompt de teste]",
    "expected": "[Resultado esperado]",
    "criteria": ["[criterio-1]", "[criterio-2]"]
  }
]
```
