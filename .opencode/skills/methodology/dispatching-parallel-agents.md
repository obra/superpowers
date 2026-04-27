---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents - Despachando Agentes en Paralelo

## Vision General

Delegas tareas a agentes especializados con contexto aislado. Por precisely crafting their instructions and context, aseguras que se mantengan enfocados y tengan exito en su tarea. No deberian heredar nunca el contexto o historial de tu sesion - construyes exactamente lo que necesitan.

Cuando tienes multiples failures independientes (diferentes test files, diferentes subsystems, diferentes bugs), investigarlos secuencialmente desperdicia tiempo. Cada investigacion es independiente y puede happening en paralelo.

**Principio central:** Despacha un agente por dominio de problema independiente. Deja que trabajen concurrentemente.

## Cuando Usar

**Usa cuando:**
- 3+ archivos de test fallando con diferentes causas raiz
- Multiples subsystems rotos independientemente
- Cada problema puede entenderse sin contexto de otros
- Sin estado compartido entre investigaciones

**No uses cuando:**
- Failures estan relacionados (arreglar uno podria arreglar otros)
- Necesitas entender estado completo del sistema
- Agentes interferirian entre si

## El Patron

### 1. Identificar Dominios Independientes

Agrupar failures por lo que esta roto:
- File A tests: Flujo de aprobacion de tool
- File B tests: Comportamiento de completion batch
- File C tests: Funcionalidad de abort

Cada dominio es independiente.

### 2. Crear Tareas de Agente Enfocadas

Cada agente recibe:
- **Scope especifico:** Un test file o subsystem
- **Goal claro:** Hacer que estos tests pasen
- **Constraints:** No cambiar otro codigo
- **Output esperado:** Resumen de lo que encontraste y arreglaste

### 3. Despachar en Paralelo

```bash
Task("Fix agent-tool-abort.test.ts failures")
Task("Fix batch-completion-behavior.test.ts failures")
Task("Fix tool-approval-race-conditions.test.ts failures")
# All three run concurrently
```

### 4. Revisar e Integrar

Cuando agentes returnan:
- Leer cada resumen
- Verificar fixes no conflictuan
- Ejecutar full test suite
- Integrar todos los cambios

## Errores Comunes

**Muy broad:** "Fix all the tests" - agente se pierde

**Sin contexto:** "Fix the race condition" - agente no sabe donde

**Sin constraints:** Agente podria refactorear todo

**Output vago:** "Fix it" - no sabes que cambio

## Verificacion

Despues de que agentes returnan:
1. **Revisar cada resumen** - Entender que changing
2. **Chequear conflictos** - Agents editaron el mismo codigo?
3. **Ejecutar suite completa** - Verificar todos los fixes work together
4. **Spot check** - Agentes pueden hacer errores sistematicos
