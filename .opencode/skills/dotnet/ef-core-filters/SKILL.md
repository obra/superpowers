---
name: ef-core-filters
description: EF Core global query filters para multi-tenant isolation con HasQueryFilter, indices, y mejores prácticas
compatibility: opencode
metadata:
  stack: dotnet-8-10
  category: data-access
  runtime: ef-core
---

## Qué son Global Query Filters

Global query filters append automatic tenant conditions a todas las queries LINQ:
- Seguro: aplica automáticamente
- DRY: una definición, todo aplica
- Testable: puede ignorarse en tests

## Configuración básica

### DbContext con constructor injection

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
        // Aplicar filtro a cada entity
        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => c.TenantId == _tenantProvider.TenantId);
        
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == _tenantProvider.TenantId);
        
        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == _tenantProvider.TenantId);
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

public class HttpContextTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _accessor;
    
    public HttpContextTenantProvider(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }
    
    public string TenantId => _accessor.HttpContext?.Items["TenantId"] as string 
        ?? throw new InvalidOperationException("No tenant in request");
    
    public bool IsValid => !string.IsNullOrEmpty(TenantId);
}
```

---

## Entities con TenantId

### Interfaz marker

```csharp
public interface ITenantEntity
{
    string TenantId { get; set; }
}
```

### Entity con interface

```csharp
public class Customer : ITenantEntity
{
    public Guid Id { get; set; }
    public string TenantId { get; set; }  // Required
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

## Índices para performance

### Composite indexes con TenantId

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Customer>(entity =>
    {
        // TenantId como leading column
        entity.HasIndex(c => new { c.TenantId, c.Name });
        entity.HasIndex(c => new { c.TenantId, c.CreatedAt });
        
        // Query filter
        entity.HasQueryFilter(c => c.TenantId == _tenantProvider.TenantId);
    });
    
    modelBuilder.Entity<Order>(entity =>
    {
        entity.HasIndex(o => new { o.TenantId, o.CreatedAt });
        entity.HasIndex(o => new { o.TenantId, o.CustomerId, o.Status });
        
        entity.HasQueryFilter(o => o.TenantId == _tenantProvider.TenantId);
    });
}
```

### Migration automática

```sql
CREATE INDEX IX_Customers_TenantId_Name 
ON Customers (TenantId, Name);

CREATE INDEX IX_Orders_TenantId_CreatedAt 
ON Orders (TenantId, CreatedAt);
```

---

## Aplicar filtro a TODAS las entities

### Extension method

```csharp
public static class ModelBuilderExtensions
{
    public static ModelBuilder ApplyTenantFilters<TenantProvider>(
        this ModelBuilder modelBuilder,
        TenantProvider tenantProvider)
        where TenantProvider : ITenantProvider
    {
        var tenantId = tenantProvider.TenantId;
        
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.ClrType.GetInterface(nameof(ITenantEntity)) != null)
            {
                var parameter = Expression.Parameter(entityType.ClrType, "e");
                var tenantProperty = Expression.Property(parameter, "TenantId");
                var tenantValue = Expression.Constant(tenantId, typeof(string));
                
                var lambda = Expression.Lambda(
                    Expression.Equal(tenantProperty, tenantValue),
                    parameter);
                
                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }
        
        return modelBuilder;
    }
}
```

---

## Raw SQL Queries

### SIEMPRE filtrar por TenantId

```csharp
// ✅ CORRECTO: filtrar explícitamente
var orders = await context.Orders
    .FromSqlRaw(@"
        SELECT * FROM Orders 
        WHERE TenantId = {0} AND Status = {1}",
        tenantProvider.TenantId,
        OrderStatus.Pending)
    .ToListAsync();

// ❌ INCORRECTO: sin filtrar (bypassea query filter)
// var orders = await context.Orders
//     .FromSqlRaw("SELECT * FROM Orders WHERE Status = {0}", OrderStatus.Pending)
//     .ToListAsync();

// ✅ CORRECTO: usar FromSqlInterpolated
var tenantId = tenantProvider.TenantId;
var orders = await context.Orders
    .FromSqlInterpolated($"SELECT * FROM Orders WHERE TenantId = {tenantId} AND Status = {status}")
    .ToListAsync();
```

### Ignorar query filters solo cuando es necesario

```csharp
// IGNORE FILTER - SOLO para migraciones o seed data
var allOrders = await context.Orders
    .IgnoreQueryFilters()
    .ToListAsync();

// ✅ Alternativamente, filtrar manualmente
var allOrders = await context.Orders
    .FromSqlRaw("SELECT * FROM Orders")
    .ToListAsync();  // WARNING: sin filtro!
```

---

## Navigation properties

### EF Core aplica filtros a navigations automáticamente

```csharp
// Filter aplica automáticamente a:
var customers = await context.Customers
    .Include(c => c.Orders)  // Orders filtrados por tenant
    .ToListAsync();

// Y también a:
var orders = await context.Orders
    .Include(o => o.Customer)  // Customer filtrado por tenant
    .ToListAsync();
```

### Caution con owned types

```csharp
// Owned types pueden no aplicar el filtro correctamente
// Verificar siempre con tests

modelBuilder.Owned<Address>();  // Puede bypass filter
```

---

## Multiple tenants (collection-based)

### Para entities con múltiples tenants

```csharp
public class Deal : ITenantEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public ICollection<DealTenant> Tenants { get; set; }  // Multi-tenant
}

public class DealTenant
{
    public Guid DealId { get; set; }
    public string TenantId { get; set; }
}

// Query filter con ANY
modelBuilder.Entity<Deal>(entity =>
{
    entity.HasMany(d => d.Tenants)
        .WithOne()
        .HasForeignKey(dt => dt.DealId);
    
    entity.HasQueryFilter(d => 
        d.Tenants.Any(t => t.TenantId == _tenantProvider.TenantId));
});
```

---

## Testing

### Con query filters

```csharp
[Fact]
public async Task GetCustomers_ReturnsOnlyTenantCustomers()
{
    // Arrange
    var tenantId = "tenant-1";
    var provider = new TestTenantProvider(tenantId);
    
    using var context = new TenantDbContext(_options, provider);
    
    // Act
    var customers = await context.Customers.ToListAsync();
    
    // Assert - solo customers del tenant
    Assert.All(customers, c => Assert.Equal(tenantId, c.TenantId));
}
```

### Sin query filters (seed)

```csharp
[Fact]
public async Task SeedData_IgnoresFilter()
{
    using var context = new TenantDbContext(_options, new NoOpTenantProvider());
    
    // Import all - ignore filter
    var allCustomers = await context.Customers
        .IgnoreQueryFilters()
        .ToListAsync();
}
```

---

## Defense in Depth

### Filters + SQL RLS

Query filters no son infalibles:
- `IgnoreQueryFilters()` los bypass
- Raw SQL es responsabilidad del developer

```csharp
// Defense in depth:
// 1. EF Core filters (conveniencia)
// 2. SQL Server RLS (seguridad)
// 3. Audit logs (detección)

// Query filters para developer convenience
modelBuilder.Entity<Customer>()
    .HasQueryFilter(c => c.TenantId == _tenantProvider.TenantId);

// RLS para seguridad
// (implementar con row-level-security skill)
```

---

## Signals de Completitud

- Query filter aplica a todas las queries LINQ
- TenantId siempre filtrado en EF Core
- Índices con TenantId como leading column
- Raw SQL filtra explícitamente
- Tests verifican isolation Por tenant
- Defense-in-depth con RLS