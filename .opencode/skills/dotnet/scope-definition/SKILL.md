---
name: scope-definition
description: Definir el alcance incremental de un proyecto: qué se implementa ahora (POC/MVP) vs qué crece después. Garantiza que la arquitectura del POC sea idéntica al diseño completo para que el crecimiento sea aditivo. Usar durante domain-analysis y clean-arch-design.
compatibility: opencode
---

## El principio fundamental

La estructura del POC debe ser idéntica a la del producto completo.
La diferencia está en cuántas clases hay dentro de cada capa, no en
cómo están organizadas.

**Crecimiento aditivo**: agregar nuevas clases, métodos y módulos.
**Crecimiento destructivo**: renombrar, reorganizar, cambiar contratos.

Un buen scope POC garantiza que el equipo nunca tenga que hacer
crecimiento destructivo.

## Preguntas que guían la definición de scope

Para cada feature o concepto del dominio, evaluar:

1. **¿Es necesario para demostrar el flujo completo de valor?**
   Si no está, ¿el sistema puede hacer su trabajo principal?
   → Si no puede: es scope POC.
   → Si puede igual: es extensión futura.

2. **¿Depende de infraestructura compleja?** (buses de mensajes,
   integraciones externas, autenticación real, configuración dinámica)
   → En POC: mockear o hardcodear el mínimo viable.
   → En producto: implementar correctamente.

3. **¿Agrega complejidad de dominio o complejidad técnica?**
   Complejidad de dominio (nuevas reglas de negocio): puede ir en POC
   si es central al flujo.
   Complejidad técnica (escalabilidad, performance, UX avanzada):
   diferir al producto.

## Cómo documentar el scope

Para cada Bounded Context, para cada feature, para cada interfaz:

```
Scope POC: [qué se implementa — ser específico]
Producto completo: [qué se agrega — ser específico]
```

Ser específico significa: no "se simplifica" sino "4 cuestionarios fijos
cargados con HasData() seed, sin configuración desde UI, sin versioning".

## Qué siempre va en el scope completo desde el inicio

Aunque el POC sea simple, estos elementos siempre deben existir desde el primer día con su forma definitiva:

- Nombres de aggregates, entities y VOs (el lenguaje ubicuo no cambia)
- Interfaces de repositorio (los contratos, no las implementaciones)
- Estructura de carpetas del módulo completo
- Domain events y su firma (qué datos llevan)
- Reglas de dependencia entre capas

Lo que sí cambia entre POC y producto:
- Cuántos campos tienen los aggregates
- Complejidad de las validaciones
- Número de queries/commands implementados
- Riqueza de la UI
- Infraestructura real vs mocks