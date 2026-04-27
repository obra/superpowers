---
name: plan
description: Crea un plan de implementacion detallado a partir de un diseno aprobado usando writing-plans skill
---

# Plan Command

Crea un plan de implementacion detallado siguiendo la metodologia Superpowers.

## Uso

```
/plan [topic]
```

## Descripcion

Este comando activa el skill `writing-plans`:

1. **Mapea archivos** - Identifica archivos a crear/modificar
2. **Descompone tareas** - En pasos pequenos (2-5 min cada uno)
3. **Estructura el plan** - Con headers y tareas bien definidas
4. **Auto-review** - Verifica coverage del spec

## Prerequisito

Debe existir un spec aprobado en `docs/superpowers/specs/` (creado via `/start` o `/brainstorm`).

## Output

Guarda el plan en `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.

## Siguiente Paso

Despues de `/plan`, usar `/execute-plan` para ejecutar.

## Integracion

```
/start → /plan → /execute-plan
```

El orchestrator coordina automaticamente entre skills.
