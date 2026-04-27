---
name: start
description: Inicia una sesion completa de desarrollo con brainstorming y planning
---

# Start Command

Inicia una sesion completa de desarrollo con el flujo metodologico completo.

## Uso

```
/start [descripcion del proyecto]
```

## Descripcion

Combina los comandos `/brainstorm` y `/plan` para iniciar el flujo completo:

1. **Brainstorming** - Diseno y especificaciones usando `brainstorming` skill
2. **Planning** - Plan de implementacion detallado usando `writing-plans` skill
3. **Preparacion** - Listo para ejecutar

## Cuando Usar

- Nuevo proyecto desde cero
- Nueva feature significativa
- Cualquier trabajo que requiera diseno primero

## Flujo

```
/start → brainstorming skill → writing-plans skill → listo para /execute-plan
```

## Proceso

1. **Explorar contexto** - Revisa estructura actual del proyecto
2. **Preguntas clarificadoras** - Una a una via orchestrator
3. **Proponer enfoques** - 2-3 opciones con trade-offs
4. **Presentar diseno** - Por secciones, obtener aprobacion
5. **Escribir spec** - Guardar en docs/superpowers/specs/
6. **Crear plan** - En docs/superpowers/plans/

## Nota

Este comando inicia el proceso. La ejecucion real del plan se hace con `/execute-plan`.

El desarrollador interactua SOLO con @orchestrator, quien coordina todos los skills y subagentes automaticamente.
