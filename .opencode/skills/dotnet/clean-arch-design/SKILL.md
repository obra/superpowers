---
name: clean-arch-design
description: Traducir un análisis de dominio DDD a estructura de proyecto .NET con Clean Architecture. Produce contratos de interfaz, estructura de carpetas y plan de dependencias. Usar después de domain-analysis.
compatibility: opencode
metadata:
  stack: dotnet-8-9-10
  pattern: clean-architecture
---

**Importante:** Cada microservicio = una solución .NET independiente.
Database-per-service, NO DB compartida.

## Input esperado
El output del skill `domain-analysis` — bounded contexts, aggregates,
domain events e interfaces de repositorio ya definidas.

## Output que produce

1. Estructura de carpetas por microservicio
2. Interfaces y contratos entre capas (sin implementación)
3. Reglas de dependencia por capa
4. Plan de registro de DI (qué se registra dónde)
5. Decisiones de EF Core (owned entities, HasData seeds)
6. Configuración Dapr (state management, pub/sub) por servicio

## Estructura de microservicio (por Bounded Context)

```
[NOMBRE].Services.[BC].Api/           ← API del microservicio
├── [BC].Domain/                      ← Entities, ValueObjects, Aggregates, Events
├── [BC].Application/               ← Commands, Queries, Handlers, DTOs (MediatR)
├── [BC].Infrastructure/             ← EF Core, Repositories, Dapr clients
├── Program.cs                        ← Minimal APIs + DI + Dapr
└── appsettings.json

[NOMBRE].Client.Blazor/              ← Blazor WebAssembly standalone
tests/[BC].Tests/                     ← Unit + Integration tests
```

Reglas:
- Un BC = Un microservicio = Una solución .sln
- Database-per-service (cada servicio su propia DB)
- Dapr sidecar para service invocation y pub/sub
- Minimal APIs (no Controllers)

**NO monolito-modular** — cada servicio independientemente desplegable.
## Proceso de diseño — seguir en orden

### Paso 1: Interfaces antes que implementaciones
Por cada repositorio identificado en domain-analysis:
```csharp
// Domain/Interfaces — solo operaciones que los comandos necesitan
public interface I{Nombre}Repository
{
    Task AddAsync({AR} entity, CancellationToken ct = default);
    Task<{AR}?> GetByIdAsync({Id} id, CancellationToken ct = default);
    // Solo agregar métodos que algún CommandHandler o QueryHandler necesita
    // NUNCA hacer CRUD genérico si el dominio no lo pide
}
```

Por cada servicio de application que cruce BCs:
```csharp
// Application/Interfaces — contrato que Infrastructure implementa
public interface I{Nombre}Service
{
    Task<ResultType> {Operacion}Async(params, CancellationToken ct = default);
}
```

### Paso 2: Commands y Queries (CQRS básico)
Para cada comando del dominio:
```csharp
// Command — datos de entrada (inmutable)
public record {Nombre}Command(tipo Param1, tipo Param2);

// Handler — orquesta: valida, carga AR, ejecuta método, persiste, despacha eventos
public class {Nombre}CommandHandler : ICommandHandler<{Nombre}Command>
{
    // Depende de: IRepository (del mismo BC), IEventDispatcher (Shared)
    // NUNCA depende de Infrastructure directamente
}
```

### Paso 3: Decisiones de EF Core
Para cada AR, definir:
- ¿Es Owned Entity (parte del AR, misma tabla) o Entity separada?
- ¿Qué VOs van como columnas vs tablas propias?
- ¿El BC usa su propio DbContext o el AppDbContext compartido?
- ¿Qué datos van en HasData() seed para el entorno de desarrollo?

Patrón para VOs en EF Core:
```csharp
// Configuration
builder.OwnsOne(x => x.Email, email =>
{
    email.Property(e => e.Value).HasColumnName("Email").HasMaxLength(256);
});
```

### Paso 4: Reglas de dependencia — verificar antes de generar código
Antes de definir cualquier referencia de proyecto:
- ¿Domain tiene ProjectReference hacia Application? → ERROR
- ¿Domain tiene ProjectReference hacia Infrastructure? → ERROR
- ¿Application tiene ProjectReference hacia Infrastructure? → ERROR
- ¿Presentation tiene ProjectReference hacia Domain directamente? → Revisar, generalmente ERROR
- ¿Un BC referencia las clases de Domain de otro BC? → ERROR (solo interfaces/DTOs)

### Paso 5: Scope — qué va en el PR actual
Separar claramente:
- Interfaces y contratos: siempre del alcance completo (no cambian al crecer)
- Implementaciones: solo las del scope actual
- Configuración EF Core: solo entidades del scope actual
- Migrations: una por feature, no por tabla

## Estándar de calidad

El output de este skill debe permitir que el Builder empiece a implementar
sin tomar decisiones de arquitectura — esas ya están tomadas aquí.

Señales de que el diseño está completo:
- Todas las interfaces definidas, ninguna implementación creada aún
- Las dependencias entre proyectos están explícitas (quién referencia a quién)
- El Builder solo tiene que rellenar implementaciones, no inventar estructuras
- El scope del PR está delimitado: qué archivos se crean en este ciclo