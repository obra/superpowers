---
name: review
description: Ejecuta code review del codigo actual usando el agente code-reviewer subagent
---

# Review Command

Ejecuta code review del codigo actual.

## Uso

```
/review [rama]
```

## Descripcion

Activa el subagent `@code-reviewer` para revisar codigo:

1. **Alignment con plan** - Verifica que codigo match spec
2. **Code quality** - SOLID, patterns, naming
3. **Arquitectura** - Separation of concerns
4. **Documentacion** - Comments, headers
5. **Seguridad** - Vulnerabilidades potenciales

## Proceso

1. Obtener SHAs de git para el rango a revisar
2. Despachar subagent `@code-reviewer` con contexto
3. Recibir feedback estructurado
4. Actuar segun severity

## Issues Clasificados

| Severity | Descripcion | Accion |
|----------|-------------|--------|
| **Critical** | Must fix, bloquea merge | Arreglar inmediatamente |
| **Important** | Should fix, antes de proceed | Arreglar antes de siguiente tarea |
| **Minor** | Nice to have | Para luego |

## Git Integration

Si no se especifica rama, revisa HEAD actual.

```bash
/review                    # Revisa HEAD actual
/review feature/login     # Revisa rama feature/login
/review origin/main...HEAD # Revisa comparando con main
```

## Integracion con Workflow

El orchestrator despacha `@code-reviewer` automaticamente:
- Despues de cada task en SDD
- Antes de merge a main
- Cuando estas atascado (perspectiva fresca)

## Ejemplo de Output

```
CODE REVIEW REPORT
=================

BLOQUEANTES:
- [C1] Domain tiene dependencia hacia Infrastructure
- [C2] Missing null checks en ProductRepository

SUGERENCIAS:
- [S1] Considerar usar record en lugar de class para DTOs
- [S2] Magic strings en AppSettings, usar constants

APROBADO: Condicional
Condiciones: Arreglar C1, C2 antes de merge
```

## Verificacion Obligatoria

El skill `verification-before-completion` exige que el desarrollador revise el codigo ANTES de declararlo aprobado.
