---
name: brainstorm
description: Inicia una sesion de diseno antes de cualquier implementacion - sigue la metodologia Superpowers
---

# Brainstorm Command

Inicia una sesion de brainstorming siguiendo la metodologia Superpowers.

## Uso

```
/brainstorm
```

## Descripcion

Este comando activa el skill `brainstorming` que guia el proceso de diseno:

1. **Explorar contexto** - Revisa archivos, docs, commits recientes
2. **Preguntas clarificadoras** - Una a una, entiende proposito/constraints/criterios
3. **Proponer enfoques** - 2-3 opciones con trade-offs y recomendacion
4. **Presentar diseno** - En secciones, obtener aprobacion por cada una
5. **Escribir spec** - Guardar en `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
6. **Auto-review** - Verificar placeholders, contradicciones, ambiguedad
7. **Usuario aprueba** - Antes de continuar a implementacion

## Flujo

```
Usuario → /brainstorm → brainstorming skill → writing-plans skill → Plan de implementacion
```

## Restriccion

**NO se puede escribir codigo sin haber pasado por este proceso.**

Este es un GATE obligatorio segun la metodologia Superpowers.
