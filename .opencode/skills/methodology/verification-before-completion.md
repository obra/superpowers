---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs
---

# Verification Before Completion - Verificacion Antes de Completar

## Vision General

Afirmar que el trabajo esta completo sin verificacion es deshonestidad, no eficiencia.

**Principio central:** Evidencia antes que afirmaciones, siempre.

**Violar la letra de esta regla es violar el espiritu de esta regla.**

## La Ley de Hierro

```
SIN AFIRMACIONES DE COMPLETION SIN EVIDENCIA DE VERIFICACION FRESCA
```

Si no has ejecutado el comando de verificacion en este mensaje, no puedes afirmar que pasa.

## La Funcion Gate

```
ANTES de afirmar cualquier status o expresar satisfaccion:

1. IDENTIFICAR: Que comando prueba esta afirmacion?
2. EJECUTAR: Ejecutar el COMANDO COMPLETO (fresco, completo)
3. LEER: Output completo, chequear exit code, contar failures
4. VERIFICAR: El output confirma la afirmacion?
   - Si NO: Estado status actual con evidencia
   - Si YES: Estado afirmacion CON evidencia
5. SOLO ENTONCES: Hacer la afirmacion

Saltar cualquier paso = mentir, no verificar
```

## Fracasos Comunes

| Afirmacion | Require | No Suficiente |
|------------|---------|---------------|
| Tests pasan | Test command output: 0 failures | Ejecucion previa, "should pass" |
| Linter clean | Linter output: 0 errors | Chequeo parcial, extrapolacion |
| Build succeed | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |

## Red Flags - STOP

- Usando "should", "probably", "seems to"
- Expresando satisfaccion antes de verificacion ("Great!", "Perfect!", "Done!", etc.)
- A punto de commit/push/PR sin verificacion
- Confiando en success reports de agentes
- Confiando en verificacion parcial
- Pensando "just this once"
- Cansado y queriendo que el trabajo termine
- **CUALQUIER redaccion que implica success sin haber ejecutado verificacion**

## Patron Clave

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

## Por Que Esto Importa

- Tu pareja dijo "No te creo" - confianza rota
- Funciones indefinidas shipped - crashear
- Requisitos faltantes shipped - features incompletas
- Tiempo desperdiciado en completcion falsa → redirect → rework

## La Linea de Fondo

**Sin shortcuts para verificacion.**

Ejecuta el comando. Lee el output. ENTONCES afirma el resultado.

Esto es innegociable.
