---
name: poc
description: Crea una prueba de concepto rapida para validar ideas sin overhead metodologico completo
---

# POC Command

Crea una prueba de concepto rapida para validar ideas sin overhead metodologico.

## Uso

```
/poc [descripcion rapida]
```

## Descripcion

Para validacion rapida de conceptos:

1. **Scope limitado** - Solo lo esencial para probar el concepto
2. **Sin brainstorming completo** - Diseno minimal
3. **Sin TDD riguroso** - Solo verificacion basica
4. **Prototipo rapido** - Para mostrar viabilidad

## Cuando Usar POC

- Validar viabilidad de una idea antes de invertir en diseno completo
- Prototipo para presentacion a stakeholder
- Spike tecnico para evaluar alternativas
- Exploracion rapida de stack o patron nuevo

## Proceso POC

1. **Analisis rapido** - Dominio y scope minimal
2. **Diseno basico** - Estructura de carpetas nada mas
3. **Implementacion POC** - Solo lo necesario para probar
4. **Validacion** - Que funcione, sin tests exhaustivos

## Limites

POC NO es para produccion:
- Codigo de prueba, no disenado para mantenibilidad
- Sin tests exhaustivos
- Sin documentacion completa

## Conversion a Proyecto Real

Si la POC funciona y el proyecto avanza:
1. Crear spec completo via `/start`
2. Crear plan via `/plan`
3. Ejecutar via `/execute-plan` con TDD completo

## Diferencia con /start

| Aspecto | /start | /poc |
|---------|--------|------|
| Brainstorming | Completo | Minimal |
| TDD | Obligatorio | Solo verificacion basica |
| Documentacion | Completa | Solo lo necesario |
| Tiempo | Mayor | Rapido |
| Produccion | Listo | No (requiere flujo completo) |
