---
name: blazor-hosting
description: Opciones de hosting para Blazor WASM en arquitectura de Microservicios: hosted vs separado (standalone recomendado)
metadata:
  stack: dotnet-9-10
  architecture: microservices
---

## Contexto: Microservicios

En arquitectura de microservicios con YARP API Gateway:
- Blazor WASM es **siempre standalone** (proyecto separado)
- Se comunica exclusivamente via HTTP al API Gateway
- **NUNCA** usa ProjectReference hacia ningún microservicio
- Recibe el JWT token del Identity Service

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Blazor    │────►│  YARP Gateway   │────►│  Catalog    │
│  WASM      │     │  (Auth + Route)  │     │  Service    │
│  Client    │◄───��│                 │◄────│  ...       │
└─────────────┘     └─────────────────┘     └──────────────┘
     │                                              │
     │              ┌─────────────────┐            │
     └─────────────►│  Identity       │◄───────────┘
                    │  Service        │
                    └─────────────────┘
```

## Opción 1: Standalone (RECOMENDADO para Microservicios)

Blazor WASM como proyecto independiente que se serve desde:
- Azure Blob Storage / Static Web Apps
- IIS como static files
- CDN

### Program.cs
```csharp
var builder = BlazorWebAssemblyHost.CreateDefault(args);

builder.Services.AddHttpClient("Gateway", client =>
{
    client.BaseAddress = new Uri(builder.HostEnvironment.BaseAddress);
})
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddScoped(sp =>
    sp.GetRequiredService<IHttpClientFactory>().CreateClient("Gateway"));

builder.Services.AddOidcAuthentication(options =>
{
    options.ProviderOptions.Authority = "https://identity.example.com";
    options.ProviderOptions.ClientId = "blazor-wasm";
});

// HttpClient tipado por dominio
builder.Services.AddScoped<IProductClient, ProductClient>();
builder.Services.AddScoped<IOrderClient, OrderClient>();

await builder.Build().RunAsync();
```

### Acceso a API via Gateway
```csharp
public interface IProductClient
{
    Task<Result<IReadOnlyList<ProductDto>>> GetProductsAsync(CancellationToken ct);
    Task<Result<ProductDto>> GetProductAsync(Guid id, CancellationToken ct);
}

public class ProductClient : IProductClient
{
    private readonly HttpClient _http;
    
    public ProductClient(HttpClient http) => _http = http;
    
    public async Task<Result<IReadOnlyList<ProductDto>>> GetProductsAsync(CancellationToken ct)
    {
        var response = await _http.GetAsync("api/catalog/products", ct);
        return response.IsSuccessStatusCode
            ? Result.Success(await response.Content.ReadFromJsonAsync<List<ProductDto>>(ct))
            : Result.Failure<IReadOnlyList<ProductDto>>(await response.Content.ReadAsStringAsync(ct));
    }
}
```

## Opción 2: Hosted (desarrollo local)

Blazor WASM dentro de la solución ASP.NET Core para dev local.
- ⚠️ Solo para desarrollo, no para producción
- ⚠️ Acopla frontend con backend

```csharp
// Program.cs del host
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddBlazorWebAssemblyServices();
builder.Services.AddScoped(sp => 
    sp.GetRequiredService<IHttpMessageHandlerFactory>().CreateHandler());

var app = builder.Build();
app.UseStaticFiles();
app.UseDefaultFiles();
app.MapFallbackToFile("index.html");
```

## Reglas para Microservicios

1. **HttpClient tipado**: Crear una interfaz por bounded context
2. **Nunca ProjectReference**: Comunicación solo via HTTP
3. **JwtToken en header**: Authorization: Bearer {token}
4. **BaseAddress dinámico**: Apuntar al API Gateway
5. **Retry con Polly**: Implementar retry en HttpClient factory

### HttpClient Factory con Resilience
```csharp
builder.Services.AddHttpClient<IProductClient, ProductClient>()
    .AddPolicyHandler(GetRetryPolicy())
    .AddPolicyHandler(GetCircuitBreakerPolicy());

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy() =>
    Policy<HttpResponseMessage>
        .HandleResult(r => r.StatusCode == HttpStatusCode.ServiceUnavailable)
        .WaitAndRetryAsync(3, retryAttempt => 
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
```

---

## Cuándo usar cada opción

| Escenario | Opción | Razón |
|-----------|--------|-------|
| Microservicios producción | Standalone | Escalabilidad, independencia |
| Azure Static Web Apps | Standalone | Optimizado para static hosting |
| Desarrollo rápido | Hosted | Simplicidad en dev local |
| Equipo pequeño | Standalone | Deployment simplificado |

---

## Deployment

### Azure Static Web Apps
```bash
# GitHub Actions automatico
az staticwebapp create \
  --name myapp \
  --resource-group rg \
  --source app/Client.Blazor
```

### IIS
```
wwwroot/
  index.html
  _framework/
  js/
  css/
```

---

## Signals de Completitud

- Blazor WASM compila sin errores
- HttpClients tipados por BC
- OIDC configurado con Identity Service
- Routing funciona desde API Gateway