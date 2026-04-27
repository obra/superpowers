---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review - Solicitando Code Review

Despachar subagent code-reviewer para atrapar issues antes de que cascaden. El reviewer recibe contexto precisamente crafteado para evaluacion - nunca el historial de tu sesion. Esto mantiene al reviewer enfocado en el work product, no tu proceso de pensamiento, y preserva tu propio contexto para trabajo continuo.

**Principio central:** Revisa temprano, revisa seguido.

## Cuando Solicitar Review

**Obligatorio:**
- Despues de cada tarea en subagent-driven development
- Despues de completar feature mayor
- Antes de merge a main

**Opcional pero valioso:**
- Cuando estas atascado (perspectiva fresca)
- Antes de refactoring (baseline check)
- Despues de arreglar bug complejo

## Como Solicitar

**1. Obtener git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Despachar code-reviewer subagent:**

Usar Task tool con code-reviewer type.

**3. Actuar en feedback:**
- Arreglar Critical issues inmediatamente
- Arreglar Important issues antes de proceder
- Nota Minor issues para luego
- Push back si reviewer esta equivocado (con razonamiento)

## Red Flags

**Nunca:**
- Saltar review porque "es simple"
- Ignorar Critical issues
- Proceder con Important issues sin arreglar
- Discutir con feedback tecnico valido

**Si reviewer wrong:**
- Push back con razonamiento tecnico
- Mostrar codigo/tests que prueban que funciona
- Solicitar clarificacion
