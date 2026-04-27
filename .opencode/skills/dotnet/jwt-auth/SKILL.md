---
name: jwt-auth
description: Configuración de JWT Bearer Authentication en ASP.NET Core con validación, refresh tokens, y OIDC integration
compatibility: opencode
metadata:
  stack: dotnet-8-10
  category: security
  runtime: authentication
---

## Qué es JWT Authentication

JWT (JSON Web Token) es un estándar para autenticación stateless:
- Token auto-contenido con claims
- Validación del lado del servidor (no hay estado)
- Short-lived access tokens + refresh tokens

## Paquetes NuGet

```bash
# JWT Bearer
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# Para OIDC (Azure AD, Auth0, etc.)
dotnet add package Microsoft.IdentityModel.Protocols.OpenIdConnect
```

---

## Configuración básica

### Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("Jwt");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["SecretKey"])),
        
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,  // IMPORTANTE: remover tolerancia
        ValidAlgorithm = SecurityAlgorithms.HmacSha512
    };
    
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception is SecurityTokenExpiredException)
            {
                context.Response.Headers.Append("X-Token-Expired", "true");
            }
            return Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            // Token desde query string (fallback)
            var token = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.Run();
```

### appsettings.json

```json
{
  "Jwt": {
    "SecretKey": "super-secret-key-minimo-32-caracteres!!!",
    "Issuer": "https://api.example.com",
    "Audience": "https://api.example.com",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}
```

---

## Validación de Token (Security Best Practices)

### Parámetros obligatorios

```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    // VALIDAR EMISOR
    ValidateIssuer = true,
    ValidIssuer = "https://your-issuer.com",
    
    // VALIDAR AUDIENCE  
    ValidateAudience = true,
    ValidAudience = "your-api",
    
    // VALIDAR FIRMA
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(secretKey)),
    
    // VALIDAR EXPIRY
    ValidateLifetime = true,
    ClockSkew = TimeSpan.Zero,  // NO tolerate
    
    // VALIDAR ALGORITMO
    // (nunca accept alg: none)
    ValidAlgorithms = new[] { "HS512", "RS512" }
};
```

### Validación robusta

```csharp
ValidateIssuerSigningKey = true,
// Para RS512: usar RSA public key
IssuerSigningKey = new RsaSecurityKey(rsaParameters),

// Fallback para key rotation
ValidateIssuerSigningKey = true,
IssuerSigningKeyResolver = (issuer, securityToken, tokenValidationParameters) =>
{
    // Load key from cache or Key Vault
    return GetCurrentKey();
}
```

---

## Claims del Token

### Claims estándar (IETF)

| Claim | Descripción | Requerido |
|------|-------------|----------|
| `iss` | Issuer | ✅ |
| `sub` | Subject (user id) | ✅ |
| `aud` | Audience | ✅ |
| `exp` | Expiration time | ✅ |
| `iat` | Issued at | ✅ |
| `jti` | JWT ID (unique) | Recomendado |

### Custom claims

```csharp
// En el token generation
var claims = new[]
{
    new Claim(JwtRegisteredClaimNames.Sub, userId),
    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    new Claim("tenant_id", tenantId),
    new Claim(ClaimTypes.Role, "Admin")
};
```

### Extraer claims en el API

```csharp
[Authorize]
public class OrdersController : ControllerBase
{
    public IActionResult Get()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var tenantId = User.FindFirstValue("tenant_id");
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);
        
        // Usar para filtrar datos por tenant
    }
}
```

---

## Refresh Tokens

### Flujo básico

```csharp
public class TokenService
{
    public async Task<TokenResponse> RefreshTokenAsync(string refreshToken)
    {
        // 1. Validar refresh token ( lookup en DB)
        var storedToken = await _tokenStore.GetAsync(refreshToken);
        
        if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }
        
        // 2. Rotación: revocar old, generar new
        await _tokenStore.RevokeAsync(refreshToken);
        
        var userId = storedToken.UserId;
        var newAccessToken = GenerateAccessToken(userId);
        var newRefreshToken = GenerateRefreshToken();
        
        await _tokenStore.StoreAsync(newRefreshToken, userId);
        
        return new TokenResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken
        };
    }
}
```

### Endpoint de refresh

```csharp
app.MapPost("/api/refresh", async (TokenRequest request, ITokenService service) =>
{
    try
    {
        var tokens = await service.RefreshTokenAsync(request.RefreshToken);
        return Results.Ok(tokens);
    }
    catch (UnauthorizedAccessException)
    {
        return Results.Unauthorized();
    }
});
```

### Refresh token storage (DbContext)

```csharp
public class RefreshToken
{
    public string Token { get; set; }
    public string UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

## OIDC Integration (Recomendado para producción)

En lugar de crear tokens, usar OIDC provider:

```csharp
// Azure AD, Auth0, Okta, Keycloak, etc.
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = "https://your-oidc-provider.com";
    options.Audience = "your-api";
    
    // OIDC maneja validación automáticamente
    // Pero masih configurar para production
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true
    };
});
```

### Configuración de Azure AD

```csharp
.AddJwtBearer(options =>
{
    options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
    options.Audience = clientId;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true
    };
});
```

---

## Authorization Policies

### Basic role check

```csharp
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase { }
```

### Custom policy con claims

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanManageOrders", policy =>
        policy.RequireAssertion(context =>
        {
            var tenantId = context.User.FindFirstValue("tenant_id");
            var role = context.User.FindFirstValue(ClaimTypes.Role);
            return role == "Admin" || role == "OrderManager";
        }));
});

// Usage
[Authorize(Policy = "CanManageOrders")]
```

### Policy con tenant validation

```csharp
options.AddPolicy("SameTenant", policy =>
    policy.RequireAssertion(context =>
    {
        var requestTenant = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        var tokenTenant = context.User.FindFirstValue("tenant_id");
        return requestTenant == tokenTenant;
    }));
```

---

## Errores comunes y soluciones

### Token validation failed

| Error | Causa | Solución |
|-------|------|---------|
| `IDX10000` | Secret key inválida | Verificar SecretKey |
| `IDX10205` | Algoritmo no soportado | Verificar ValidAlgorithms |
| `IDX10400` | Token expirado | Usar refresh token |
| `IDX10500` | Issuer inválido | Verificar ValidIssuer |
| `IDX10600` | Audience inválida | Verificar ValidAudience |

### Security checklist

- [ ] Secret key >= 32 characters
- [ ] No usar `alg: none`
- [ ] ClockSkew = TimeSpan.Zero
- [ ] Short-lived access tokens (15-30 min)
- [ ] Refresh token rotation
- [ ] HTTPS solo en producción
- [ ] No almacenar tokens en localStorage

---

## Signals de Completitud

- JWT validation funciona para tokens válidos
- Tokens expirados son rechazados con 401
- Refresh tokens rotan correctamente
- Claims se extraen correctamente (tenant_id, roles)
- Authorization policies funcionan
- No hay security vulnerabilities conocidas