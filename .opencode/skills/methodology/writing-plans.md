---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans - Escribiendo Planes de Implementacion

Escribe planes de implementacion completos asumiendo que el ingeniero tiene cero contexto de nuestro codebase y gusto cuestionable. Documenta todo lo que necesitan saber: que archivos tocar para cada tarea, codigo, testing, docs que podrian necesitar revisar, como testearlo. Dale todo el plan como tareas pequenas. DRY. YAGNI. TDD. Commits frecuentes.

Asume que son un desarrollador habilidoso, pero no saben casi nada sobre nuestro toolset o dominio del problema. Asume que no saben muy bien diseno de tests.

**Anuncia al inicio:** "Estoy usando el skill writing-plans para crear el plan de implementacion."

**Contexto:** Esto deberia ejecutarse en un worktree dedicado (creado por brainstorming skill).

**Guardar planes en:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

## Estructura del Archivo

Antes de definir tareas, mapea que archivos seran creados o modificados y lo que cada uno es responsable. Aqui es donde las decisiones de descomposicion se blocagean.

- Disena unidades con limites claros e interfaces bien definidas
- Razonas mejor sobre codigo que puedes mantener en contexto a la vez
- Archivos que cambian juntos deberian vivir juntos. Split por responsabilidad, no por capa tecnica
- En codebases existentes, sigue patrones establecidos

## Granularidad de Tareas Pequenas

**Cada paso es una accion (2-5 minutos):**
- "Write the failing test" - paso
- "Run it to make sure it fails" - paso
- "Write minimal code to make the test pass" - paso
- "Run the tests and make sure they pass" - paso
- "Commit" - paso

## Estructura del Plan

**Cada plan DEBE comenzar con este header:**

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Estructura de Tarea

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.cs`
- Modify: `exact/path/to/existing.cs:123-145`
- Test: `tests/exact/path/to/test.cs`

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public void Should_Do_Something()
{
    // Arrange
    var service = new Service();
    
    // Act
    var result = service.Execute();
    
    // Assert
    Assert.Equal(expected, result);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/path/test.cs --filter "Should_Do_Something"`
Expected: FAIL with compilation error

- [ ] **Step 3: Write minimal implementation**

```csharp
public class Service
{
    public string Execute() => "result";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/path/test.cs --filter "Should_Do_Something"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.cs src/path/Service.cs
git commit -m "feat: add specific feature"
```
```

## Sin Placeholders

Cada paso debe contener el contenido real que un ingeniero necesita. Estos son **fallos del plan** - nunca los escribas:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code)
- Pasos que describen que hacer sin mostrar como (code blocks requeridos para pasos de codigo)

## Auto-Review

Despues de escribir el plan completo, mira el spec con ojos frescos y verifica el plan contra este.

**1. Spec coverage:** Puedes señalar una tarea que implemente cada seccion/requisito en el spec? Lista cualquier gap.

**2. Placeholder scan:** Busca en tu plan red flags - cualquiera de los patrones de arriba. Corrigelos.

**3. Type consistency:** Los tipos, firmas de metodos, y nombres de propiedades que usaste en tareas posteriores coinciden con lo definido en tareas anteriores?

Si encuentras problemas, corrigelos inline. Si encuentras un requisito del spec sin tarea, agrega la tarea.

## Handoff de Ejecucion

Despues de guardar el plan, ofrece opcion de ejecucion:

**"Plan completo guardado en `docs/superpowers/plans/<filename>.md`. Dos opciones de ejecucion:**

**1. Subagent-Driven (recomendado)** - Despacho un subagent fresco por tarea, revision entre tareas, iteracion rapida

**2. Inline Execution** - Ejecutar tareas en esta sesion usando executing-plans, ejecucion en lotes con checkpoints

**Cual prefieres?**

**Si se elige Subagent-Driven:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review

**Si se elige Inline Execution:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
