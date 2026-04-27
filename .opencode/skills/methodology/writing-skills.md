---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills - Escribiendo Skills

## Vision General

**Escribir skills ES Test-Driven Development aplicado a documentacion de procesos.**

Escribes casos de prueba (pressure scenarios con subagents), los observas fallar (baseline behavior), escribes el skill (documentacion), observas tests pasar (agentes comply), y refactoreas (close loopholes).

**Principio central:** Si no observaste un agente fallar sin el skill, no sabes si el skill ensena lo correcto.

**REQUIRED BACKGROUND:** Debes entender superpowers:test-driven-development antes de usar este skill.

## Que es un Skill?

Un **skill** es una guia de referencia para tecnicas probadas, patrones, o tools. Skills ayudan a futuras instancias de Claude a encontrar y aplicar enfoques efectivos.

**Skills son:** Tecnicas reusables, patrones, tools, guias de referencia

**Skills NO SON:** Narrativas sobre como resolviste un problema una vez

## Estructura de Directorio

```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Solo si necesita
```

**Flat namespace** - todos los skills en un namespace buscable

## Estructura SKILL.md

**Frontmatter (YAML):**
- Dos campos requeridos: `name` y `description`
- Max 1024 caracteres total
- `name`: Solo letras, numeros, y guiones (no parentesis, chars especiales)
- `description`: Tercera persona, describe SOLO cuando usar (NO que hace)
  - Empezar con "Use when..." para enfocarse en condiciones de trigger
  - Incluir sintomas especificos, situaciones, y contextos

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.

## When to Use
Bullet list with SYMPTOMS and use cases
When NOT to use

## Core Pattern (for techniques/patterns)
Before/after code comparison

## Quick Reference
Table or bullets for scanning common operations

## Common Mistakes
What goes wrong + fixes
```

## TDD Mapping para Skills

| Concepto TDD | Creacion de Skill |
|--------------|------------------|
| **Test case** | Pressure scenario con subagent |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Agente viola regla sin skill (baseline) |
| **Test passes (GREEN)** | Agente comply con skill presente |
| **Refactor** | Close loopholes mientras mantiene compliance |

## La Ley de Hierro

```
SIN SKILL SIN UN TEST FALLANDO PRIMERO
```

Esto aplica a skills NUEVOS y EDITS a skills existentes.

Escribir skill antes de testear? Eliminalo. Empieza de nuevo.
Edit skill sin testear? Misma violacion.

## Cuando Crear un Skill

**Crear cuando:**
- Tecnica no era intuitivamente obvia para ti
- Referenciarias esto en proyectos futuros
- Patron aplica ampliamente (no especifico de proyecto)
- Otros se beneficiarian

**No crear para:**
- Soluciones one-off
- Practicas standard bien documentadas en otro lugar
- Convenciones especificas de proyecto (poner en AGENTS.md)
- Constraints mecanicos (si es enforzable con regex/validation, automatizalo)

## Verificacion

Despues de escribir cualquier skill, DEBES:

1. **Probar con subagents** - Ejecutar scenarios sin skill, documentar baseline
2. **Verificar compliance** - Con skill presente, agente deberia comply
3. **Cerrar loopholes** - Agregar contadores explicit para racionalizaciones

## La Linea de Fondo

**Crear skills ES TDD para documentacion de procesos.**

Misma Ley de Hierro: No skill sin test fallando primero.
Mismo ciclo: RED (baseline) → GREEN (escribir skill) → REFACTOR (cerrar loopholes).
Mismos beneficios: Mejor calidad, menos sorpresas, resultados a prueba de balas.
