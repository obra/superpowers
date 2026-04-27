---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions
---

# Receiving Code Review - Recibiendo Feedback de Code Review

## Vision General

Code review requiere evaluacion tecnica, no performance emocional.

**Principio central:** Verificar antes de implementar. Preguntar antes de asumir. Correccion tecnica sobre confort social.

## El Patron de Respuesta

```
CUANDO recibes feedback de code review:

1. LEER: Feedback completo sin reaccionar
2. ENTENDER: Re-stating requirement in own words (or ask)
3. VERIFICAR: Check against codebase reality
4. EVALUAR: Tecnicamente sound for THIS codebase?
5. RESPONDER: Technical acknowledgment or reasoned pushback
6. IMPLEMENTAR: Uno a la vez, testear cada uno
```

## Respuestas Forbidden

**NUNCA:**
- "You're absolutely right!"
- "Great point!" / "Excellent feedback!"
- "Let me implement that now" (before verification)

**EN SU LUGAR:**
- Re-state el requerimiento tecnico
- Preguntar preguntas clarificadoras
- Push back con razonamiento tecnico si esta mal
- Solo empezar a trabajar (acciones > palabras)

## Cuando hacer Push Back

Haz push back cuando:
- Sugerencia rompe funcionalidad existente
- Reviewer carece de contexto completo
- Viola YAGNI (unused feature)
- Tecnicamente incorrecto para este stack
- Razones de legacy/compatibilidad existen
- Conflicta con decisiones arquitecturales de tu pareja

**Como hacer push back:**
- Usa razonamiento tecnico, no defensividad
- Haz preguntas especificas
- Referencia tests/codigo trabajando
- Involucra a tu pareja si es arquitectural

## Reconociendo Feedback Correcto

Cuando feedback ES correcto:
```
✅ "Fixed. [Brief description of what changed]"
✅ "Good catch - [specific issue]. Fixed in [location]."
✅ [Just fix it and show in the code]

❌ "You're absolutely right!"
❌ "Great point!"
❌ "Thanks for catching that!"
```

**Por que no gracias:** Acciones hablan. Solo arreglalo. El codigo mismo muestra que escuchaste el feedback.

**Si te agarras por escribir "Thanks":** ELIMINALO. Estado el fix en su lugar.
