---
name: execute-plan
description: Ejecuta un plan de implementacion existente con revision entre tareas
---

# Execute Plan Command

Ejecuta un plan de implementacion previamente creado siguiendo la metodologia Superpowers.

## Uso

```
/execute-plan
```

## Descripcion

Este comando activa el skill `executing-plans` que:

1. **Carga y revisa** - Lee el archivo del plan
2. **Ejecuta tareas** - Una a una, siguiendo pasos exactamente
3. **Verifica** - Cada paso con su verificacion
4. **Completa** - Usa `finishing-a-development-branch` skill

## Prerequisito

Debe existir un plan en `docs/superpowers/plans/` creado previamente via `/brainstorm` + `writing-plans`.

## Opciones de Ejecucion

**1. Subagent-Driven (recomendado)**
- Un subagent fresco por tarea
- Revision de dos etapas: spec compliance + code quality

**2. Inline Execution**
- Ejecutar en la sesion actual
- Con checkpoints de revision

## Integracion

```
/brainstorm → /plan → /execute-plan → /finish
```

Este flujo completo sigue la metodologia Superpowers.
