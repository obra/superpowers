---
name: rate-limiting
description: Rate limiting middleware en ASP.NET Core con políticas por endpoint, algoritmos, y YARP integration
compatibility: opencode
metadata:
  stack: dotnet-9-10
  category: performance
  runtime: middleware
---

## Qué es Rate Limiting

El rate limiting protege APIs de abuso:
- Limita requests por usuario/IP/endpoint
- Previene DDoS y ataque de fuerza bruta
- Asegura uso justo de recursos

## Paquetes NuGet

```bash
# Rate limiting (incluido en .NET 8+)
# No necesita paquete adicional

# Para IP-based rate limiting
dotnet add package AspNetCoreRateLimit
```

---

## Configuración básica (.NET 9+)

### Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configurar rate limiter
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    
    // Global limiter (se aplica a todo)
    options.AddFixedWindowLimiter("global", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });
});

var app = builder.Build();

// Importante: UseRateLimiter después de UseRouting
app.UseRouting();
app.UseRateLimiter();

app.Run();
```

---

## Algoritmos disponibles

### Fixed Window Limiter

```csharp
options.AddFixedWindowLimiter("fixed", opt =>
{
    opt.PermitLimit = 10;
    opt.Window = TimeSpan.FromSeconds(10);
    opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    opt.QueueLimit = 2;  // Cola de espera
});
```
- Divide tiempo en ventanas fijas
- Más simple, pero permite burst al inicio de ventana

### Sliding Window Limiter

```csharp
options.AddSlidingWindowLimiter("sliding", opt =>
{
    opt.PermitLimit = 10;
    opt.Window = TimeSpan.FromSeconds(10);
    opt.SegmentsPerWindow = 5;
});
```
- Ventanas deslizantes
- Mejor distribución, más smooth

### Token Bucket Limiter

```csharp
options.AddTokenBucketLimiter("token", opt =>
{
    opt.TokenLimit = 10;
    opt.TokensPerPeriod = 5;
    opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
});
```
- Regeneración gradual de tokens
- Mejor para APIs que permiten burst controlado

### Concurrency Limiter

```csharp
options.AddConcurrencyLimiter(opt =>
{
    opt.PermitLimit = 5;
    opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    opt.QueueLimit = 2;
});
```
- Limita conexiones simultáneas
- Para long-running requests

---

## Políticas por endpoint

### Named policies

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Policy para /api/stats (alta frecuencia)
    options.AddFixedWindowLimiter("stats", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    
    // Policy para /api/orders (media frecuencia)
    options.AddFixedWindowLimiter("orders", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    
    // Policy default
    options.AddFixedWindowLimiter("default", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});
```

### Aplicar a endpoints (Minimal APIs)

```csharp
app.MapGet("/api/stats", () => ...)
    .RequireRateLimiting("stats");

app.MapGet("/api/orders", () => ...)
    .RequireRateLimiting("orders");
```

### Aplicar a controllers

```csharp
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("orders")]  // Policy específica
public class OrdersController : ControllerBase { }
```

---

## [DisableRateLimiting]

Para endpoints que necesitan rate limiting específico:

```csharp
[DisableRateLimiting]  // Excluir de rate limiting
public class HealthController : ControllerBase
{
    public IActionResult Get() => Ok();
}
```

---

## Rate Limiting con YARP

### Por route en config

```json
{
  "ReverseProxy": {
    "Routes": {
      "api-route": {
        "ClusterId": "api",
        "RateLimiterPolicy": "fixedWindow",
        "Match": { "Path": "api/{**segments}" }
      }
    }
  }
}
```

### Por route code-first

```csharp
new RouteConfig
{
    RouteId = "api-route",
    ClusterId = "api-cluster",
    Match = new RouteMatch { Path = "api/{**segments}" },
    RateLimiterPolicy = "fixedWindow"
};
```

### Response con Retry-After

Configurar el handler:

```csharp
services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = 
            context.Lease.TryGetMetadata<string>("retry_after") 
            ?? "60";
        
        await Results.Json(new { error = "Rate limit exceeded" })
            .ExecuteAsync(context.HttpContext, token);
    };
});
```

---

## IP-based Rate Limiting (AspNetCoreRateLimit)

### Configuración

```csharp
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.EnableEndpointRateLimiting = true;
    options.StackBlockedRequests = false;
    options.HttpStatusCode = 429;
    options.IpRegexPrefix = "^192\\.168\\.";
    
    options.GeneralRules = new List<RateLimitRule>
    {
        new RateLimitRule
        {
            Endpoint = "*",
            Period = "10s",
            Limit = 5
        },
        new RateLimitRule
        {
            Endpoint = "api:/api/orders/*",
            Period = "1m",
            Limit = 20
        }
    };
});

builder.Services.AddInMemoryRateLimiting();
```

### appsettings.json

```json
{
  "IpRateLimiting": {
    "EnableEndpointRateLimiting": true,
    "StackBlockedRequests": false,
    "GeneralRules": [
      { "Endpoint": "*", "Period": "10s", "Limit": 5 },
      { "Endpoint": "api:/api/orders", "Period": "1m", "Limit": 20 }
    ]
  }
}
```

### En Program.cs

```csharp
app.UseIpRateLimiting();
```

---

## User-based Rate Limiting

### Con JWT claims

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Limiter por user ID del token
    options.AddTokenBucketLimiter("user", opt =>
    {
        opt.TokenLimit = 50;
        opt.TokensPerPeriod = 10;
        opt.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
    });
});
```

### Custom partitioner

```csharp
.AddTokenBucketLimiter("custom", opt =>
{
    opt.TokenLimit = 100;
    opt.TokensPerPeriod = 20;
    opt.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
    opt.Partitioner = httpContext =>
    {
        // Por user ID o IP
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return userId ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
    };
});
```

---

## Response headers

Standard headers que deben incluirse:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1716200000
```

Middleware para headers:

```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-RateLimit-Limit", "100");
    context.Response.Headers.Append("X-RateLimit-Remaining", 
        context.GetRateLimiter()?.GetRemainingRequests().ToString() ?? "0");
    await next();
});
```

---

## Errores comunes

| Error | Causa | Solución |
|-------|------|----------|
| Rate limit no aplica | UseRateLimiter antes de UseRouting | Llamar después de UseRouting |
| 404 en todos los requests | Policy no existe | Verificar nombres |
| No headers en response | Headers no configurados | Agregar middleware custom |

---

## Signals de Completitud

- Rate limiting retorna 429 cuando excede
- Retry-After header presente
- Políticas por endpoint funcionan
- YARP integration funciona
- IP-based limiting funciona