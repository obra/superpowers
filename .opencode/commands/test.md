---
name: test
description: Ejecuta tests con coverage y genera reporte de verificacion
---

# Test Command

Ejecuta tests con coverage y genera reporte de verificacion.

## Uso

```
/test [opciones]
```

## Opciones

| Opcion | Descripcion |
|--------|-------------|
| `--unit` | Solo tests unitarios |
| `--integration` | Solo tests de integracion |
| `--all` | Todos los tests (default) |
| `--coverage` | Genera reporte de coverage |
| `--report` | Genera reporte en PDF/Excel |

## Ejemplo

```bash
/test --all --coverage --report
```

## Proceso

1. **Build** - `dotnet build` verifica que compila sin warnings
2. **Test** - `dotnet test --collect:"XPlat Code Coverage"`
3. **Coverage** - Analiza % por capa (Domain, Application, Infrastructure)
4. **Reporte** - Genera output en formato legible

## Gates

- Tests deben pasar 100% antes de merge
- Coverage debe ser > 80% para codigo nuevo
- Si coverage es bajo, usar `/review` para identificar debt

## Output Tipico

```
Tests: 156 total, 156 passed, 0 failed
Coverage: Domain 94%, Application 87%, Infrastructure 72%
Status: READY FOR MERGE
```

## Integracion

El orchestrator usa este comando automaticamente antes de `@qa-reviewer` checkpoint.

## Verificacion antes de Claim

El skill `verification-before-completion` exige EVIDENCIA real, no solo creencias.

```
❌ "Tests deberian pasar ahora"
✅ [Run: dotnet test] [See: 0 failures] "All tests pass"
```
