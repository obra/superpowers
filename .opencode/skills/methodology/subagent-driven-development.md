---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Ejecuta plan despachando subagent fresco por tarea, con revision de dos etapas despues de cada una: compliance de spec primero, luego calidad de codigo.

**Por que subagentes:** Delegas tareas a agentes especializados con contexto aislado. Al craftear precisamente sus instrucciones y contexto, aseguras que se mantengan enfocados y tengan exito en su tarea. Nunca deberian heredar el contexto o historial de tu sesion - construyes exactamente lo que necesitan. Esto tambien preserva tu propio contexto para trabajo de coordinacion.

**Principio central:** Fresh subagent por tarea + two-stage review (spec primero, luego calidad) = alta calidad, iteracion rapida

## El Proceso

```
[Leer plan, extraer todas las tareas con texto completo, notar contexto, crear TodoWrite]
    |
    v
[Mas tareas remain?] --> SI --> [Despachar implementer subagent]
    |                                      |
    | NO                                    v
    |                           [Implementer subagent implementa, tests, commit, self-reviews]
    |                                      |
    |                                      v
    |                           [Despachar spec reviewer subagent]
    |                                      |
    |                                      v
    |                           [Spec reviewer confirma codigo match spec?]
    |                                      |
    | NO                                    v
    |                           [Implementer subagent arregla gaps de spec]
    |                                      |
    | YES                                  v
    |                           [Despachar code quality reviewer subagent]
    |                                      |
    |                                      v
    |                           [Code quality reviewer aprueba?]
    |                                      |
    | NO                                    v
    |                           [Implementer subagent arregla issues de calidad]
    |                                      |
    | YES                                  v
    |                           [Marcar tarea completa en TodoWrite]
    |                                      |
    +--------------------------------------+
                                              |
                                              v
                                    [Despachar final code reviewer para toda implementacion]
                                              |
                                              v
                                    [Usar finishing-a-development-branch skill]
```

## Seleccion de Modelo

Usa el modelo menos poderoso que pueda manejar cada rol para conservar costo y aumentar velocidad.

**Tareas de implementacion mecanica** (funciones aisladas, specs claros, 1-2 archivos): usa un modelo rapido y barato.

**Tareas de integracion y juicio** (coordinacion multi-archivo, pattern matching, debugging): usa un modelo standard.

**Tareas de arquitectura, diseno, y revision**: usa el modelo mas capaz disponible.

## Manejo de Status del Implementer

Implementer subagents reportan uno de cuatro statuses:

**DONE:** Procede a revision de spec compliance.

**DONE_WITH_CONCERNS:** El implementer completo el trabajo pero flaggio dudas. Lee las preocupaciones antes de proceder.

**NEEDS_CONTEXT:** El implementer necesita informacion que no fue provista. Provee el contexto faltante y re-despacha.

**BLOCKED:** El implementer no puede completar la tarea. Evalua el blocker:
1. Si es problema de contexto, provee mas contexto y re-despacha con el mismo modelo
2. Si la tarea requiere mas razonamiento, re-despacha con un modelo mas capaz
3. Si la tarea es muy grande, dividela en piezas mas pequenas
4. Si el plan mismo esta mal, escala al humano

**Nunca ignores una escalacion o fuerces el mismo modelo a reintentar sin cambios.**

## Integracion

**Workflow skills requeridos:**
- **superpowers:using-git-worktrees** - REQUIRED: Configurar workspace aislado antes de empezar
- **superpowers:writing-plans** - Crea el plan que esta skill ejecuta
- **superpowers:requesting-code-review** - Template de code review para reviewer subagents
- **superpowers:finishing-a-development-branch** - Completar desarrollo despues de todas las tareas

**Subagentes deberian usar:**
- **superpowers:test-driven-development** - Subagentes siguen TDD para cada tarea

**Workflow alternativo:**
- **superpowers:executing-plans** - Usar para sesion paralela en vez de ejecucion en misma sesion
