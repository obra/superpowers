---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging - Debugging Sistematico

## Vision General

Fijos random desperdician tiempo y crean nuevos bugs. Parches rapidos enmascaran problemas subyacentes.

**Principio central:** SIEMPRE encuentra causa raiz antes de intentar fixes. Fijos de sintomas son fracaso.

**Violar la letra de este proceso es violar el espiritu de debugging.**

## La Ley de Hierro

```
SIN FIXES SIN INVESTIGACION DE CAUSA RAIZ PRIMERO
```

Si no has completado Fase 1, no puedes proponer fixes.

## Las Cuatro Fases

Debes completar cada fase antes de proceder a la siguiente.

### Fase 1: Investigacion de Causa Raiz

**ANTES de intentar CUALQUIER fix:**

1. **Leer Mensajes de Error Cuidadosamente**
   - No saltes errores o warnings
   - Frecuentemente contienen la solucion exacta
   - Lee stack traces completamente
   - Nota numeros de linea, paths de archivos, codigos de error

2. **Reproducir Consistentemente**
   - Puedestriggerlo confiablemente?
   - Cuales son los pasos exactos?
   - Pasa todo el tiempo?
   - Si no es reproducible → reuni mas datos, no adivines

3. **Chequear Cambios Recientes**
   - Que cambio que podria causar esto?
   - Git diff, commits recientes
   - Nuevas dependencias, cambios de config
   - Diferencias ambientales

4. **Rastrear Flujo de Datos**

   **CUANDO error esta profundo en call stack:**

   - Donde originate el mal valor?
   - Que llamo esto con mal valor?
   - Sigue rastreando hasta encontrar la fuente
   - Arregla en la fuente, no en el sintoma

### Fase 2: Analisis de Patron

**Encuentra el patron antes de fixear:**

1. **Encontrar Ejemplos Trabajando**
   - Localiza codigo similar funcionando en el mismo codebase
   - Que trabaja que es similar a lo que esta roto?

2. **Comparar Contra Referencias**
   - Si estas implementando un patron, lee la implementacion de referencia COMPLETAMENTE
   - No skim - lee cada linea
   - Entiende el patron completamente antes de aplicar

3. **Identificar Diferencias**
   - Que es diferente entre lo trabajando y lo roto?
   - Lista cada diferencia, sin embargo pequena
   - No asumas "eso no puede importar"

4. **Entender Dependencias**
   - Que otros componentes necesita esto?
   - Que settings, config, ambiente?
   - Que suposiciones hace?

### Fase 3: Hipotesis y Testing

**Metodo cientifico:**

1. **Formar Una Unica Hipotesis**
   - Estado claramente: "Pienso que X es la causa raiz porque Y"
   - Escribelo
   - Se especifico, no vago

2. **Testear Minimalmente**
   - Haz el CAMBIO MAS PEQUENO posible para testear hipotesis
   - Una variable a la vez
   - No arregles multiples cosas a la vez

3. **Verificar Antes de Continuar**
   - Funciono? Si → Fase 4
   - No funciono? Formar NUEVA hipotesis
   - NO agregues mas fixes encima

4. **Cuando No Sabes**
   - Di "No entiendo X"
   - No finjas saber
   - Pide ayuda
   - Investiga mas

### Fase 4: Implementacion

**Arregla la causa raiz, no el sintoma:**

1. **Crear Caso de Test Fallando**
   - Reproduccion mas simple posible
   - Test automatizado si es posible
   - Debe tener antes de fixear

2. **Implementar Un Solo Fix**
   - Aborda la causa raiz identificada
   - UN cambio a la vez
   - No "mientras estoy aqui" improvements
   - No bundled refactoring

3. **Verificar Fix**
   - Test pasa ahora?
   - Ningun otro test roto?
   - Issue realmente resuelto?

4. **Si Fix No Funciona**
   - STOP
   - Cuenta: Cuantos fixes has intentado?
   - Si < 3: Return to Phase 1, re-analiza con nueva informacion
   - **Si >= 3: STOP y questiona la arquitectura**

## Referencia Rapida

| Fase | Actividades Clave | Criterios de Exito |
|------|-------------------|-------------------|
| **1. Causa Raiz** | Leer errores, reproducir, chequear cambios, reunir evidencia | Entender QUE y POR QUE |
| **2. Patron** | Encontrar ejemplos trabajando, comparar | Identificar diferencias |
| **3. Hipotesis** | Formar teoria, testear minimal | Confirmado o nueva hipotesis |
| **4. Implementacion** | Crear test, fix, verificar | Bug resuelto, tests pasan |

## Cuando el Proceso Revela "Sin Causa Raiz"

Si la investigacion sistematica revela que el issue es verdaderamente ambiental, timing-dependent, o externo:

1. Has completado el proceso
2. Documenta lo que investigaste
3. Implementa manejo apropiado (retry, timeout, mensaje de error)
4. Agrega monitoring/logging para investigacion futura

**Pero:** 95% de casos de "sin causa raiz" son investigacion incompleta.
