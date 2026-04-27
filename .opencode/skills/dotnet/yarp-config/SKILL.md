---
name: yarp-config
description: Configuración de YARP (Yet Another Reverse Proxy) para routing, load balancing, y transforms en .NET microservices
compatibility: opencode
metadata:
  stack: dotnet-8-10
  architecture: microservices
  category: api-gateway
---

## Qué es YARP

YARP es un reverse proxy de alto rendimiento construido sobre ASP.NET Core:
- Code-first: configuración en C# (no solo JSON)
- Integración nativa con middleware de .NET
- Routing, load balancing, y request/response transforms

## Paquetes NuGet

```bash
# YARP core
dotnet add package Yarp.ReverseProxy

# Para configuración desde appsettings.json
# (incluido en el core package)
```

## Instalación básica

### Code-first (Program.cs)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configurar YARP
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

// Middleware de routing
app.UseRouting();
app.MapReverseProxy();

app.Run();
```

### appsettings.json

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "{**catch-all}"
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "destination1": {
            "Address": "https://example.com/"
          }
        }
      }
    }
  }
}
```

---

## Route Configuration

### Path Matching

```csharp
.LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
```

O code-first:

```csharp
var routes = new[]
{
    new RouteConfig()
    {
        RouteId = "api-route",
        ClusterId = "api-cluster",
        Match = new RouteMatch
        {
            Path = "api/{**segments}",
            Headers = new[] { new RouteHeaderMatcher("Accept", new[] { "application/json" }) }
        }
    }
};

var clusters = new[]
{
    new ClusterConfig()
    {
        ClusterId = "api-cluster",
        Destinations = new Dictionary<string, DestinationConfig>
        {
            ["api1"] = new DestinationConfig { Address = "https://api1.example.com/" },
            ["api2"] = new DestinationConfig { Address = "https://api2.example.com/" }
        }
    }
};

services.AddReverseProxy()
    .LoadFromMemory(routes, clusters);
```

### Host Matching

```csharp
new RouteMatch
{
    Host = "api.example.com"
}
```

Múltiples hosts:

```csharp
Host = "example.com|example.org"
```

### Header Matching

```csharp
new RouteMatch
{
    Headers = new[]
    {
        new RouteHeaderMatcher("X-Api-Version", new[] { "v1", "v2" }),
        new RouteHeaderMatcher("Authorization", new[] { "Bearer .*" })
    }
}
```

---

## Load Balancing

### Algoritmos disponibles

| Policy | Descripción | Mejor para |
|--------|-------------|----------|
| `RoundRobin` | Ciclo simple | Default |
| `PowerOfTwo` | Random con bias a menos requests | Load balance uniforme |
| `LeastRequests` | Menos conexiones activas | Alta carga |
| `Random` | Selección aleatoria | Distribución básica |

### Configuración

```csharp
new ClusterConfig
{
    ClusterId = "api-cluster",
    LoadBalancingPolicy = "PowerOfTwo",  // Cambiar algoritmo
    Destinations = new Dictionary<string, DestinationConfig>
    {
        ["api1"] = new DestinationConfig { Address = "https://api1.example.com/" },
        ["api2"] = new DestinationConfig { Address = "https://api2.example.com/" }
    }
}
```

---

## Health Checks

### Configuración de Health Check

```csharp
new ClusterConfig
{
    ClusterId = "api-cluster",
    HealthCheck = new HealthCheckConfig
    {
        Enabled = true,
        Interval = TimeSpan.FromSeconds(30),
        Timeout = TimeSpan.FromSeconds(5),
        Path = "/health"
    },
    Destinations = new Dictionary<string, DestinationConfig>
    {
        ["api1"] = new DestinationConfig { Address = "https://api1.example.com/" },
        ["api2"] = new DestinationConfig { Address = "https://api2.example.com/" }
    }
}
```

### Endpoint de Health (en destino)

```csharp
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
```

---

## Request Transforms

### Agregar transforms personalizado

```csharp
services.AddReverseProxy()
    .LoadFromConfig(config)
    .AddRequestTransform(transform =>
    {
        return context =>
        {
            context.Headers["X-Forwarded-For"] = context.Request.Headers["X-Real-IP"].ToString();
            return Task.CompletedTask;
        };
    });
```

### Transform de path

```csharp
.AddRequestTransform(transform =>
{
    return context =>
    {
        var path = context.Path;
        if (path.StartsWithSegments("/api/v1"))
        {
            context.Path = path.ToString().Replace("/api/v1", "/api");
        }
        return Task.CompletedTask;
    };
});
```

### Response Transform

```csharp
.AddResponseTransform(async (context, response) =>
{
    response.Headers["X-Proxy-Version"] = "1.0";
});
```

---

## JWT Authorization en Routes

```csharp
new RouteConfig
{
    RouteId = "secure-route",
    ClusterId = "secure-cluster",
    Match = new RouteMatch
    {
        Path = "api/{**segments}"
    },
    AuthorizationPolicy = "JWT"  // Policy definida en AddAuthentication
};
```

---

## Rate Limiting por Route

```csharp
new RouteConfig
{
    RouteId = "rate-limited-route",
    ClusterId = "api-cluster",
    Match = new RouteMatch { Path = "api/{**segments}" },
    RateLimiterPolicy = "fixedWindow"  // Policy definida en AddRateLimiter
};
```

---

## Error Handling

### Custom error handling

```csharp
services.AddReverseProxy()
    .LoadFromConfig(config)
    .ConfigureHttpMessageInvoker(options =>
    {
        options.HandleErrorRequest = async (context, error) =>
        {
            context.Response.StatusCode = 502;
            await context.Response.WriteAsync("Backend unavailable");
        };
    });
```

---

## OpenTelemetry Integration

```csharp
services.AddOpenTelemetry()
    .WithTracing(tracing =>
    {
        tracing.AddSource("Yarp.ReverseProxy");
    });
```

---

## Ejemplo completo: Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* config */ });
builder.Services.AddAuthorization();

// Rate Limiter
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("default", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});

// YARP
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddRequestTransform(transform =>
    {
        return context =>
        {
            transform.Headers["X-Forwarded-For"] = context.Request.Headers["X-Real-IP"].ToString();
            return Task.CompletedTask;
        };
    });

var app = builder.Build();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapReverseProxy();

app.Run();
```

---

## Cuándo usar YARP

| Escenario | Cuándo |
|----------|--------|
| API Gateway | Punto único de entrada |
| BFF | Backend for Frontend |
| Microservices routing | Routing entre servicios |
| Load balancing | Distribuir tráfico |
| Protocol translation | HTTP → gRPC |

---

## Signals de Completitud

- YARP routing funciona para todas las rutas configuradas
- Load balancing distribuye correctamente
- Health checks detectan nodos caídos
- Transform requests/responses funcionan
- JWT authorization bloquea rutas no autorizadas
- Rate limiting retorna 429 cuando se excede
- OpenTelemetry propaga trace_id