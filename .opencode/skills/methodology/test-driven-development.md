---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Vision General

Escribe el test primero. Observalo fallar. Escribe codigo minimal para pasar.

**Principio central:** Si no observaste el test fallar, no sabes si prueba lo correcto.

**Violar la letra de las reglas es violar el espiritu de las reglas.**

## La Ley de Hierro

```
SIN CODIGO DE PRODUCCION SIN UN TEST FALLANDO PRIMERO
```

Escribir codigo antes del test? Eliminalo. Empieza de nuevo.

**Sin excepciones:**
- No lo guardes como "referencia"
- No lo "adaptes" mientras escribes tests
- No lo mires
- Eliminar significa eliminar

## Red-Green-Refactor

### RED - Escribir Test Fallando

Escribe un test minimal mostrando lo que deberia pasar.

```csharp
[Fact]
public void Should_RetryFailedOperations_ThreeTimes()
{
    // Arrange
    var attempts = 0;
    var operation = () =>
    {
        attempts++;
        if (attempts < 3) throw new Exception("fail");
        return "success";
    };
    
    // Act
    var result = RetryOperation(operation);
    
    // Assert
    Assert.Equal("success", result);
    Assert.Equal(3, attempts);
}
```

**Requisitos:**
- Una cosa
- Nombre claro
- Codigo real (sin mocks a menos que sea inevitable)

### Verificar RED - Observalo Fallar

**OBLIGATORIO. Nunca saltes.**

```bash
dotnet test path/to/test.cs
```

Confirmar:
- Test falla (no errores)
- Mensaje de fallo es el esperado
- Falla porque feature falta (no typos)

**Test pasa?** Estas testeando comportamiento existente. Corrige el test.

**Test errores?** Corrige el error, re-ejecuta hasta que falle correctamente.

### GREEN - Codigo Minimal

Escribe el codigo mas simple para pasar el test.

```csharp
public async Task<string> RetryOperation(Func<string> operation)
{
    for (int i = 0; i < 3; i++)
    {
        try
        {
            return await Task.FromResult(operation());
        }
        catch
        {
            if (i == 2) throw;
        }
    }
    throw new Exception("unreachable");
}
```

No agregues features, refactores otro codigo, o "mejores" mas alla del test.

### Verificar GREEN - Observalo Pasar

**OBLIGATORIO.**

```bash
dotnet test path/to/test.cs
```

Confirmar:
- Test pasa
- Otros tests siguen pasando
- Output pristine (sin errores, warnings)

**Test falla?** Corrige codigo, no test.

**Otros tests fallan?** Corrige ahora.

### REFACTOR - Limpiar

Despues de green solo:
- Remueve duplicacion
- Mejora nombres
- Extrae helpers

Mantener tests green. No agregar behavior.

### Repetir

Siguiente test fallando para siguiente feature.

## Verificacion Checklist

Antes de marcar trabajo completo:

- [ ] Cada nuevo metodo/funcion tiene un test
- [ ] Observe cada test fallar antes de implementar
- [ ] Cada test fallo por razon esperada (feature falta, no typo)
- [ ] Escribi codigo minimal para pasar cada test
- [ ] Todos los tests pasan
- [ ] Output pristine (sin errores, warnings)
- [ ] Tests usan codigo real (mocks solo si es inevitable)
- [ ] Edge cases y errores cubiertos

No puedes marcar todos los checkbox? Salteaste TDD. Empieza de nuevo.

## Cuando Quedas Bloqueado

| Problema | Solucion |
|----------|----------|
| No se como testear | Escribe la API que desearias. Escribe assertion primero. |
| Test muy complicado | Diseno muy complicado. Simplifica interface. |
| Debo mockear todo | Codigo muy acoplado. Usa inyeccion de dependencias. |
| Setup de test enorme | Extrae helpers. Ainda complejo? Simplifica diseno. |

## Debugging Integration

Bug encontrado? Escribe test fallando reproduciendolo. Sigue ciclo TDD. Test prueba fix y previene regresion.

Nunca arregles bugs sin un test.

## Regla Final

```
Codigo de produccion → test existe y fallo primero
De otra forma → no es TDD
```

Sin excepciones sin permiso de tu pareja humano.
