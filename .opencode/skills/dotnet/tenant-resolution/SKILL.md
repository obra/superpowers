---
name: tenant-resolution
description: Tenant resolution middleware para ASP.NET Core con múltiples resolvers y pipeline order
compatibility: opencode
metadata:
  stack: dotnet-8-10
  category: infrastructure
  runtime: middleware
---

## Qué es Tenant Resolution

Tenant resolution es el proceso de identificar qué tenant hace la request actual:
- Extraer tenant ID del request
- Hacerlo disponible via ITenantContext
- Filtrar datos por tenant

## Resolvers disponibles

| Resolver | Priority | Source | Cuándo usarlo |
|---------|-----------|--------|---------------|
| Domain/Subdomain | 50 | `tenant.domain.com` | SaaS con branded URLs |
| Header | 100 | `X-Tenant-Id` header | BFF / Service-to-service |
| JWT Claim | 200 | `tenant_id` claim | End-user authenticated |
| QueryString | 300 | `?__tenant=guid` | Dev/Debug |

---

## ITenantContext

### Interfaz

```csharp
public interface ITenantContext
{
    string TenantId { get; }
    string TenantName { get; }
    bool IsValid { get; }
}
```

### Extension

```csharp
public static class TenantContextExtensions
{
    public static string GetTenantId(this HttpContext context)
        => context.RequestServices.GetRequiredService<ITenantContext>().TenantId;
    
    public static bool IsMultiTenant(this HttpContext context)
        => context.RequestServices.GetService<ITenantContext>()?.IsValid ?? false;
}
```

---

## Middleware Implementation

### Basic middleware

```csharp
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ITenantStore _tenantStore;
    
    public TenantResolutionMiddleware(
        RequestDelegate next,
        ITenantStore tenantStore)
    {
        _next = next;
        _tenantStore = tenantStore;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = await ResolveTenantAsync(context);
        
        if (string.IsNullOrEmpty(tenantId))
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsync("X-Tenant-Id header required");
            return;
        }
        
        var tenant = await _tenantStore.GetByIdAsync(tenantId);
        
        if (tenant == null || !tenant.IsEnabled)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsync("Tenant not found or disabled");
            return;
        }
        
        // Guardar en request-scoped context
        var tenantContext = new TenantContext(tenant);
        context.Items["TenantContext"] = tenantContext;
        
        await _next(context);
    }
    
    private Task<string?> ResolveTenantAsync(HttpContext context)
    {
        // Priority: Subdomain > Header > JWT > QueryString
        // (implementar cada resolver)
    }
}
```

### Program.cs registration

```csharp
// CRÍTICO: ANTES de UseAuthentication
app.UseMiddleware<TenantResolutionMiddleware>();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
```

---

## Resolvers individuales

### Header Resolver

```csharp
public class HeaderTenantResolver : ITenantResolver
{
    public int Order => 100;
    
    public Task<string?> ResolveAsync(HttpContext context)
    {
        var header = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        return Task.FromResult<string?>(header);
    }
}
```

### Subdomain Resolver

```csharp
public class SubdomainTenantResolver : ITenantStore
{
    public int Order => 50;
    
    public Task<string?> ResolveAsync(HttpContext context)
    {
        var host = context.Request.Host.Host;
        var parts = host.Split('.');
        
        if (parts.Length > 2)
        {
            // tenant.example.com -> tenant
            return Task.FromResult<string?>(parts[0]);
        }
        
        return Task.FromResult<string?>(null);
    }
}
```

### JWT Claim Resolver

```csharp
public class JwtClaimTenantResolver : ITenantResolver
{
    public int Order => 200;
    
    public Task<string?> ResolveAsync(HttpContext context)
    {
        var tenantId = context.User.FindFirstValue("tenant_id");
        
        if (string.IsNullOrEmpty(tenantId))
        {
            var claim = context.User.FindFirst("tenant_id");
            tenantId = claim?.Value;
        }
        
        return Task.FromResult<string?>(tenantId);
    }
}
```

### QueryString Resolver

```csharp
public class QueryStringTenantResolver : ITenantResolver
{
    public int Order => 300;
    
    public Task<string?> ResolveAsync(HttpContext context)
    {
        var tenantId = context.Request.Query["__tenant"].FirstOrDefault();
        return Task.FromResult<string?>(tenantId);
    }
}
```

---

## Composite Resolver (Pipeline)

```csharp
public class CompositeTenantResolver : ITenantResolver
{
    private readonly IEnumerable<ITenantResolver> _resolvers;
    
    public CompositeTenantResolver(IEnumerable<ITenantResolver> resolvers)
    {
        _resolvers = resolvers.OrderBy(r => r.Order);
    }
    
    public async Task<string?> ResolveAsync(HttpContext context)
    {
        foreach (var resolver in _resolvers)
        {
            var tenantId = await resolver.ResolveAsync(context);
            if (!string.IsNullOrEmpty(tenantId))
            {
                return tenantId;
            }
        }
        
        return null;
    }
}
```

---

## Tenant Store

### Interfaz

```csharp
public interface ITenantStore
{
    Task<TenantInfo?> GetByIdAsync(string tenantId);
    Task<TenantInfo?> GetBySubdomainAsync(string subdomain);
    Task<IEnumerable<TenantInfo>> GetAllAsync();
}
```

### In-memory implementation (dev)

```csharp
public class InMemoryTenantStore : ITenantStore
{
    private readonly Dictionary<string, TenantInfo> _tenants = new()
    {
        ["acme"] = new("acme", "ACME Corp", isEnabled: true),
        ["globex"] = new("globex", "Globex Corp", isEnabled: true)
    };
    
    public Task<TenantInfo?> GetByIdAsync(string tenantId)
    {
        _tenants.TryGetValue(tenantId, out var tenant);
        return Task.FromResult<TenantInfo?>(tenant);
    }
}
```

### Configuration-based (appsettings.json)

```json
{
  "Tenants": {
    "acme": { "id": "acme", "name": "ACME Corp", "isEnabled": true },
    "globex": { "id": "globex", "name": "Globex Corp", "isEnabled": true }
  }
}
```

---

## Cross-Validation (Header vs JWT)

Cuando validar header contra JWT claim:

```csharp
public class TenantResolutionMiddleware
{
    private readonly ITenantStore _tenantStore;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var headerTenant = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var jwtTenant = context.User.FindFirstValue("tenant_id");
            
            // Cross-validate: header debe match JWT
            if (!string.IsNullOrEmpty(headerTenant) && headerTenant != jwtTenant)
            {
                _logger.LogWarning("Tenant mismatch: header={HeaderTenant}, JWT={JwtTenant}",
                    headerTenant, jwtTenant);
                
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("Tenant mismatch");
                return;
            }
        }
    }
}
```

---

## Tenant-scoped DbContext

### Constructor injection

```csharp
public class TenantDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;
    
    public TenantDbContext(
        DbContextOptions<TenantDbContext> options,
        ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // EF Core query filter
        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => c.TenantId == _tenantProvider.TenantId);
    }
}
```

### ITenantProvider

```csharp
public interface ITenantProvider
{
    string TenantId { get; }
    bool IsValid { get; }
}

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    public string TenantId => _httpContextAccessor.HttpContext
        .GetTenantContext().TenantId;
}
```

---

## Registro en DI

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<ITenantContext, TenantContext>();

// Resolvers
builder.Services.AddTransient<HeaderTenantResolver>();
builder.Services.AddTransient<SubdomainTenantResolver>();
builder.Services.AddTransient<JwtClaimTenantResolver>();
builder.Services.AddTransient<CompositeTenantResolver>();

// Store
builder.Services.AddSingleton<ITenantStore, InMemoryTenantStore>();

// Middleware
app.UseMiddleware<TenantResolutionMiddleware>();
```

---

## Error responses

```http
400 Bad Request: X-Tenant-Id header missing
403 Forbidden: Tenant not found or disabled  
403 Forbidden: Tenant mismatch (header vs JWT)
```

---

## Signals de Completitud

- Middleware extrae tenant ID correctamente
- ITenantContext disponible en request
- Cross-validation funciona (header vs JWT)
- Query filters aplican TenantId automáticamente
- Error 400/403 cuando tenant inválido