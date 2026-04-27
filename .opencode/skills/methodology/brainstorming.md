---
name: brainstorming
description: Use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.
---

# Brainstorming - Disenando Ideas Antes de Implementar

Ayuda a convertir ideas en disenos y especificaciones completas a traves de dialogo colaborativo natural.

Comienza entendiendo el contexto del proyecto actual, luego haz preguntas una a la vez para refinar la idea. Una vez que entiendas lo que estas construyendo, presenta el diseno y obtén la aprobacion del usuario.

<HARD-GATE>
NO invoques ninguna skill de implementacion, escribas codigo, generes estructura de proyecto, ni tomes ninguna accion de implementacion hasta que hayas presentado un diseno y el usuario lo haya aprobado. Esto aplica a TOD proyecto sin importar su aparente simplicidad.
</HARD-GATE>

## Anti-Patron: "Esto Es Muy Simple Para Necesitar Un Diseno"

Cada proyecto pasa por este proceso. Una lista de tareas, una funcion utilitaria, un cambio de configuracion - todos. Los proyectos "simples" son donde las suposiciones no examinadas causan el mayor trabajo desperdiciado. El diseno puede ser corto ( unas pocas oraciones para proyectos realmente simples), pero DEBES presentarlo y obtener aprobacion.

## Checklist

DEBES crear una tarea para cada uno de estos elementos y completarlos en orden:

1. **Explorar contexto del proyecto** - revisar archivos, docs, commits recientes
2. **Ofrecer companero visual** (si el tema involucra preguntas visuales) - esto es su propio mensaje, no combinado con una pregunta clarificadora
3. **Hacer preguntas clarificadoras** - una a la vez, entender proposito/constraints/criterios de exito
4. **Proponer 2-3 enfoques** - con trade-offs y tu recomendacion
5. **Presentar diseno** - en secciones escaladas a su complejidad, obtener aprobacion del usuario despues de cada seccion
6. **Escribir doc de diseno** - guardar en `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` y commit
7. **Auto-review del spec** - verificacion rapida inline de placeholders, contradicciones, ambiguedad, scope
8. **Usuario revisa spec escrito** - pedir que revise el archivo spec antes de proceder
9. **Transicion a implementacion** - invocar skill writing-plans para crear plan de implementacion

## Proceso Despues del Diseno

**Documentacion:**

- Escribir el diseno validado (spec) a `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Commit el documento de diseno a git

**Auto-Review del Spec:**
Despues de escribir el documento spec, mira con ojos frescos:

1. **Placeholder scan:** Alguna "TBD", "TODO", secciones incompletas, o requisitos vagos? Corrigelos.
2. **Consistencia interna:** Alguna seccion contradice a otra? La arquitectura coincide con las descripciones del feature?
3. **Scope check:** Esta lo suficientemente enfocado para un solo plan de implementacion, o necesita descomposicion?
4. **Ambiguedad check:** Podria algun requisito interpretarse de dos maneras diferentes? Si es asi, elige uno y hacelo explicito.

Corrige cualquier problema inline. No necesitas re-revisar - solo corrige y continua.

**Gate de Revision del Usuario:**
Despues de que el loop de revision del spec pase, pide al usuario que revise el spec escrito antes de continuar:

> "Spec escrito y comprometido en `<path>`. Por favor revisa y avisame si quieres hacer cambios antes de empezar a escribir el plan de implementacion."

Espera la respuesta del usuario. Si solicita cambios, hazlos y re-ejecuta el loop de revision del spec. Solo continua una vez que el usuario apruebe.

**Implementacion:**

- Invoca el skill writing-plans para crear un plan de implementacion detallado
- NO invoques ninguna otra skill. writing-plans es el siguiente paso.

## Principios Clave

- **Una pregunta a la vez** - No abrummes con multiples preguntas
- **Opcion multiple preferida** - Mas facil de responder que abierto cuando es posible
- **YAGNI rigurosamente** - Remueve features innecesarios de todos los disenos
- **Explorar alternativas** - Siempre propone 2-3 enfoques antes de settling
- **Validacion incremental** - Presenta diseno, obtén aprobacion antes de avanzar
- **Se flexible** - Vuelve y clarifica cuando algo no tiene sentido
