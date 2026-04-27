---
name: blazor-component
description: Crear y estructurar componentes Blazor siguiendo las convenciones del equipo. Incluye patrones de separación de lógica y uso de servicios de Application layer.
compatibility: opencode
metadata:
  stack: blazor
  dotnet: 8,9,10
---

## Estructura de componente que produzco

```
Pages/
    {Feature}/
        {Feature}Page.razor         ← solo markup + event handlers mínimos
        {Feature}Page.razor.cs      ← code-behind con la lógica
    Components/
        {Nombre}Component.razor
        {Nombre}Component.razor.cs
```
## Convenciones que aplico
```csharp
// Code-behind — nunca lógica de negocio directa
public partial class {Feature}Page : ComponentBase
{
    [Inject] private I{Feature}Service Service { get; set; } = default!;
    [Inject] private NavigationManager Nav { get; set; } = default!;
    
    // Estado del componente
    private {Feature}ViewModel? _viewModel;
    private bool _isLoading;
    
    protected override async Task OnInitializedAsync()
    {
        _isLoading = true;
        _viewModel = await Service.Get{Feature}Async();
        _isLoading = false;
    }
}
```
## Entorno de desarrollo WSL
El equipo usa WSL2 con browser en Windows. 
- NO usar `dotnet watch` para Blazor WASM — usar `dotnet run` con `--urls "http://0.0.0.0:5000"`
- Acceder desde Windows en `http://localhost:5000` o `http://<wsl-ip>:5000`
- Para validar cambios del Builder: el QA Tester ejecuta `dotnet build` y verifica compilation — 
  no depende de Hot Reload para el ciclo agente
- `dotnet watch` sí funciona para proyectos ASP.NET Core puro (API) — solo evitarlo en WASM

## Reglas críticas
- Los componentes Blazor llaman a servicios de Application — nunca a repositorios directamente
- Nada de `HttpClient` directamente en componentes — siempre a través de un servicio tipado
- Formularios usan `EditForm` con `DataAnnotationsValidator` o FluentValidation
- Para el mix React: encapsular el componente React en un `JSInterop` wrapper

## Blazor WASM — HTTP Services (OBLIGATORIO)

El Client (Blazor WASM) debe comunicarse con el Backend **EXCLUSIVAMENTE por HTTP**.
No se permite ProjectReference directo al backend.

### Estructura obligatoria

```
.Services/
    ApiContracts.cs          ← Interfaces + DTOs
    {Feature}Service.cs    ← Implementación HTTP
    AuthService.cs        ← Autenticación Azure AD
Program.cs
    builder.Services.AddScoped<I{Feature}Service, {Feature}Service>();
    builder.Services.AddScoped<IAuthService, AuthService>();
```

### ApiContracts.cs — siempre con interfaces

```csharp
namespace VacationManagement.Client.Services;

public interface IVacationApiService
{
    Task<List<VacationRequestDto>> GetMyRequestsAsync();
    Task<VacationRequestDto> CreateRequestAsync(CreateVacationRequestDto dto);
    Task ApproveRequestAsync(Guid id);
    Task RejectRequestAsync(Guid id, string reason);
    Task<BalanceSummaryDto> GetMyBalanceAsync();
}

public interface IAuthService
{
    Task LoginAsync();
    Task LogoutAsync();
    Task<UserInfo?> GetCurrentUserAsync();
    bool IsAuthenticated { get; }
    string? UserRole { get; }
}

// DTOs como records inmutables
public record VacationRequestDto
{
    public Guid Id { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public int RequestedDays { get; init; }
    public string Status { get; init; } = "";
    // ... más propiedades
}
```

### Service Implementation — siempre con HttpClient tipado

```csharp
public class VacationApiService : IVacationApiService
{
    private readonly HttpClient _http;

    public VacationApiService(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<VacationRequestDto>> GetMyRequestsAsync()
    {
        var response = await _http.GetFromJsonAsync<List<VacationRequestDto>>(
            "api/vacation-requests/my");
        return response ?? new();
    }

    public async Task<VacationRequestDto> CreateRequestAsync(CreateVacationRequestDto dto)
    {
        var response = await _http.PostAsJsonAsync("api/vacation-requests", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<VacationRequestDto>()
            ?? throw new InvalidOperationException("Failed to create request");
    }
}
```

### NO Permitido — Errores comunes

```csharp
// ✗ PROHIBIDO: HttpClient directo en componente
@code {
    var http = new HttpClient(); // NUNCA HACER ESTO
}

// ✗ PROHIBIDO: ProjectReference al backend
// en .csproj del Client
<ItemGroup>
    <ProjectReference Include="..\VacationManagement\VacationManagement.csproj" />
</ItemGroup>

// ✓ CORRECTO: Solo interfaces definidas en el Client
// ✓ CORRECTO: HttpClient inyectado via DI
builder.Services.AddScoped(sp => new HttpClient { 
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) 
});
```

### Program.cs del Client (estructura correcta)

```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");

// Http Client base — configuración única
builder.Services.AddScoped(sp => new HttpClient { 
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) 
});

// Servicios API — implementaciones concretas
builder.Services.AddScoped<IVacationApiService, VacationApiService>();
builder.Services.AddScoped<IAuthService, AuthService>();

await builder.Build().RunAsync();
```

### Registro en Backend (Minimal APIs)

```csharp
// Backend — mismo path que el client espera
app.MapGet("/api/vacation-requests/my", async (IMediator m) =>
{
    var userId = GetCurrentUserId();
    var requests = await m.Send(new GetMyRequestsQuery(userId));
    return Results.Ok(requests);
});
```