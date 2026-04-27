---
name: scaffolding
description: Crear estructura de carpetas y archivos base para módulos .NET con Clean Architecture y DDD. Usar cuando se inicia un microservicio nuevo o se migra un bounded context del monolito.
license: MIT
compatibility: opencode
metadata:
  stack: dotnet-9-10
  layers: domain,application,infrastructure,api
  architecture: microservices
---

## Arquitectura Objetivo

Este skill soporta dos patrones arquitecturales:

### 1. Monolito Modular
Todos los módulos en un solo proceso ASP.NET Core con comunicación in-process.

### 2. Microservicios (recomendado)
Cada microservicio es un proceso independiente con:
- API Gateway (YARP) como punto único de entrada
- Dapr sidecar para service invocation y pub/sub
- Propia base de datos por microservicio (database-per-service)
- Comunicación async via Dapr Pub/Sub

---

## Estructura Monolito Modular

```
[NOMBRE].sln
    [NOMBRE]/
        Modules/
            {BC}/
                Domain/
                Application/
                Infrastructure/
        Presentation/
            Endpoints/
        Shared/
        Program.cs
    [NOMBRE].Client/
    tests/
```

### Detalle por Módulo

```
{BC}/
    Domain/
        Aggregates/
        ValueObjects/
        Events/
        DomainServices/
        Specifications/
        Interfaces/

    Application/
        Commands/
        Queries/
        DTOs/
        Validators/
        EventHandlers/
        Interfaces/

    Infrastructure/
        Persistence/
            Configurations/
            Repositories/
        Services/

    Presentation/
        Endpoints/
```

---

## Estructura Microservicios

```
[NOMBRE].sln
├── src/
│   ├── [NOMBRE].Services.Identity/     (Identity Service)
│   │   ├── [Service].Domain/
│   │   ├── [Service].Application/
│   │   ├── [Service].Infrastructure/
│   │   └── Program.cs
│   │
│   ├── [NOMBRE].Services.Catalog/
│   │   └── (misma estructura)
│   │
│   ├── [NOMBRE].Services.Order/
│   │   └── (misma estructura)
│   │
│   ├── [NOMBRE].API.Gateway/
│   │   ├── Program.cs            (YARP + Dapr)
│   │   └── Routes/
│   │
│   ├── [NOMBRE].Client.Blazor/
│   ├── [NOMBRE].Client.Angular/
│   ├── [NOMBRE].Client.React/
│   │
│   └── [NOMBRE].Shared/
│       ├── Domain/               (AggregateRoot<T>, IDomainEvent)
│       ├── Application/         (Result<T>, CQRS base)
│       └── Infrastructure/        (Extensions)
│
└── tests/
    ├── [NOMBRE].IntegrationTests/
    └── [NOMBRE].UnitTests/
```

### Estructura por Microservicio

```
[Service].Api/
├── [Service].Domain/
│   ├── Aggregates/
│   │   └── {AggregateRoot}.cs
│   ├── ValueObjects/
│   │   └── {ValueObject}.cs
│   ├── Events/
│   │   └── {DomainEvent}.cs
│   ├── Interfaces/
│   │   ├── I{Entity}Repository.cs
│   │   └── I{Service}.cs
│   └── Specifications/
│
├── [Service].Application/
│   ├── Commands/
│   │   ├── {Command}.cs
│   │   └── {Command}Handler.cs
│   ├── Queries/
│   │   ├── {Query}.cs
│   │   └── {Query}Handler.cs
│   ├── DTOs/
│   ├── Validators/
│   ├── EventHandlers/
│   │   └── {Event}Handler.cs
│   └── Interfaces/
│       └── I{OutboundService}.cs
│
├── [Service].Infrastructure/
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/
│   │   │   └── {Entity}Configuration.cs
│   │   └── Repositories/
│   │       └── {Repository}Repository.cs
│   └── Services/
│       └── {Service}.cs
│
├── [Service].Api.csproj
└── Program.cs                   (Minimal API + Dapr)
```

### Program.cs de Microservicio

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Dapr
builder.Services.AddDaprClient();

// Domain
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

// Persistence
builder.Services.AddDbContext<AppDbContext>();
builder.Services.AddScopedRepository();

// CQRS
builder.Services.AddMediatR(cfg => cfg.RegisterFromAssembly(typeof(CreateProductCommand).Assembly));

var app = builder.Build();

app.MapSubscribeHandler();  // Dapr Pub/Sub

app.MapGet("/", () => $"[{ServiceName}] running...");

app.Run();
```

---

## API Gateway (YARP) - Estructura

```
[NOMBRE].API.Gateway/
├── Program.cs
├── appsettings.json
├── RouteProvider.cs          (configuración dinámica)
└── Transforms/
    └── TenantTransform.cs    (X-Tenant-Id header)
```

### Program.cs del Gateway

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Dapr client para service invocation
builder.Services.AddDaprClient();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.Authority = builder.Configuration["Identity:Authority"];
        options.Audience = "api";
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.MapSubscribeHandler();  // Dapr Pub/Sub

app.UseAuthentication();
app.UseAuthorization();
app.MapReverseProxy();

app.Run();
```

### appsettings.json del Gateway

```json
{
  "ReverseProxy": {
    "Routes": {
      "catalog-route": {
        "ClusterId": "catalog-cluster",
        "Match": { "Path": "/api/catalog/{**catch-all}" }
      },
      "order-route": {
        "ClusterId": "order-cluster",
        "Match": { "Path": "/api/orders/{**catch-all}" }
      }
    },
    "Clusters": {
      "catalog-cluster": {
        "Destinations": {
          "catalog-1": { "Address": "http://catalog-api" }
        }
      },
      "order-cluster": {
        "Destinations": {
          "order-1": { "Address": "http://order-api" }
        }
      }
    }
  }
}
```

---

## Dapr - Patrones de Comunicación

### Service Invocation (Sync)
```csharp
// Dentro de un CommandHandler
await _daprClient.InvokeMethodAsync("order-service", "/api/orders", orderData);
```

### Pub/Sub (Async) - Publicar
```csharp
public class OrderService
{
    private readonly DaprClient _daprClient;

    public async Task PublishOrderCreatedAsync(OrderCreatedEvent @event)
    {
        await _daprClient.PublishEventAsync("pubsub", "orders/created", @event);
    }
}
```

### Pub/Sub - Suscribir
```csharp
app.MapSubscribeHandler();  // Registra automáticamente desde [Topic] attributes

// En un handler
[DaprTopic("pubsub", "orders/created")]
[DaprRoute("/orders/subscribe")]
app.MapPost("/orders/subscribe", HandleOrderCreated);
```

---

## Reglas de Dependencia

- Domain NO referencia ninguna otra capa
- Application NO referencia Infrastructure directamente
- Infrastructure NO referencia Presentation/API
- Shared es el único proyecto que Domain puede referenciar (interfaces base)
- Ningún microservicio referencia clases de dominio de otro microservicio

### Diagrama de Dependencias

```
API → Application → Domain
            ↓
      Infrastructure
            ↑
     (implementa interfaces de Domain/Application)

Gateway → (YARP, solo routing)
```

---

## Reglas de Código

- Usar `record` para DTOs y Value Objects (.NET 9+)
- Sufijos: `Command`, `Query`, `Handler`, `Repository`, `Service`, `Validator`
- Agregar `_validator` en constructors, no en campos
- Domain Events se limpian en `EntityBase` después de procesar

## Cuándo usarme

- `/microservices`: Nuevo proyecto desde cero
- `@builder`: Nuevo bounded context o microservicio
- `@architect`: Diseño de estructura antes de implementar

## Signals de Completitud

- Estructura de carpetas completa por BC/microservicio
- Program.cs compilable para cada proyecto
-appsettings.json con configuración base
- Registry de DI explícito