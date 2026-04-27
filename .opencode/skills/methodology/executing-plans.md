---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans - Ejecutando Planes

## Vision General

Carga plan, revisa criticamente, ejecuta todas las tareas, reporta cuando complete.

**Anuncia al inicio:** "Estoy usando el skill executing-plans para implementar este plan."

## El Proceso

### Step 1: Cargar y Revisar Plan
1. Leer archivo de plan
2. Revisar criticamente - identificar cualquier pregunta o concern about the plan
3. Si concerns: Levantarlos con tu pareja humano antes de empezar
4. Si no concerns: Crear TodoWrite y proceder

### Step 2: Ejecutar Tareas

Para cada tarea:
1. Marcar como in_progress
2. Seguir cada paso exactamente (plan tiene pasos Pequenas)
3. Ejecutar verificaciones como especificado
4. Marcar como completada

### Step 3: Completar Desarrollo

Despues de que todas las tareas completen y verifiquen:
- Anuncia: "Estoy usando el skill finishing-a-development-branch para completar este trabajo."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Seguir ese skill para verificar tests, presentar opciones, ejecutar eleccion

## Cuando Parar y Pedir Ayuda

**PARA de ejecutar inmediatamente cuando:**
- Hit un blocker (dependency faltante, test falla, instruccion poco clara)
- Plan tiene gaps criticos previniendo empezar
- No entiendes una instruccion
- Verificacion falla repetidamente

**Pide clarificacion en lugar de adivinar.**

## Cuando Revisar Pasos Anteriores

**Return to Review (Step 1) when:**
- Partner actualiza el plan basado en tu feedback
- Enfoque fundamental necesita repensar

**No fuerces a traves de blockers** - para y pregunta.
