---
name: blazor-authentication
description: Configuración de autenticación en Blazor WebAssembly - AuthService, AuthenticationStateProvider, IAccessTokenProvider
---

Guía completa para configurar autenticación en Blazor WebAssembly .NET 9.

## Errores Comunes y Soluciones

### Error 1: IAccessTokenProvider not registered
**Mensaje:** `Unable to resolve service for type 'Microsoft.AspNetCore.Components.WebAssembly.Authentication.IAccessTokenProvider'`

**Causa:** El paquete MSAL no está configurado correctamente.

**Solución:** Hacer que IAccessTokenProvider sea opcional:
```csharp
public class AuthService : IAuthService
{
    private readonly IAccessTokenProvider? _tokenProvider; // Nullable

    public AuthService(/* ... */, IAccessTokenProvider? tokenProvider = null)
    {
        _tokenProvider = tokenProvider;
    }
}
```

### Error 2: AuthenticationStateProvider not registered
**Mensaje:** `Cannot provide a value for property 'AuthenticationStateProvider'`

**Causa:** No hay un AuthenticationStateProvider registrado en DI.

**Solución:** Crear un provider simple:
```csharp
public class RemoteAuthenticationStateProvider : AuthenticationStateProvider
{
    private readonly HttpClient _http;

    public RemoteAuthenticationStateProvider(HttpClient http)
    {
        _http = http;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        // Fetch user from API
    }
}
```

### Error 3: DI Order - AuthService no resuelto
**Mensaje:** `Unable to resolve service for type 'AuthService'`

**Causa:** El orden de registro en DI es incorrecto.

**Solución:** Registrar en orden correcto:
```csharp
// 1. HttpClient primero
builder.Services.AddScoped(sp => new HttpClient { ... });

// 2. AuthService ANTES de RemoteAuthenticationStateProvider
builder.Services.AddScoped<IAuthService, AuthService>();

// 3. Luego RemoteAuthenticationStateProvider
builder.Services.AddScoped<RemoteAuthenticationStateProvider>();
```

## Registro Completo en Program.cs

```csharp
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
// ...

var builder = WebAssemblyHostBuilder.CreateDefault(args);

// HttpClient
builder.Services.AddScoped(sp => new HttpClient {
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// Auth Service - primero
builder.Services.AddScoped<IAuthService, AuthService>();

// API Services
builder.Services.AddScoped<IVacationApiService, VacationApiService>();

// Authentication State Provider - después de AuthService
builder.Services.AddScoped<RemoteAuthenticationStateProvider>();
builder.Services.AddScoped<AuthenticationStateProvider>(
    sp => sp.GetRequiredService<RemoteAuthenticationStateProvider>());

// Fluent UI
builder.Services.AddFluentUIComponents();

await builder.Build().RunAsync();
```

## Desarrollo vs Producción

| Entorno | Auth Provider | IAccessTokenProvider |
|--------|---------------|-------------------|
| Desarrollo | Simple (HttpClient) | null |
| Producción | MSAL/Azure AD | Registrado |