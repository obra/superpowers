---
name: sqlserver-migration
description: Estrategia de migraciones EF Core para SQL Server en proyectos .NET Microservicios. Incluye migraciones por microservicio (database-per-service) y estrategia de migración de monolitos.
compatibility: opencode
metadata:
  db: sqlserver
  orm: efcore
  stack: dotnet-9-10
  architecture: microservices
---

## Arquitectura: Database-per-Service

En microservicios, cada servicio tiene su propia base de datos:
- Cada microservicio crea sus propias migraciones
- No hay migraciones compartidas entre servicios
- El API Gateway NO tiene base de datos

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Catalog API    │     │   Order API      │     │  Inventory API  │
│  ┌───────────┐  │     │  ┌───────────┐  │     │  ┌───────────┐  │
│  │  DbContext │  │     │  │  DbContext │  │     │  │  DbContext │  │
│  └───────────┘  │     │  └───────────┘  │     │  └───────────┘  │
│       │         │     │       │         │     │       │         │
│       ▼         │     │       ▼         │     │       ▼         │
│  CatalogDB     │     │   OrderDB       │     │  InventoryDB   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Comandos por Microservicio

```bash
# Crear migración en el microservicio correcto
dotnet ef migrations add {NombreMigracion} \
  --project src/[NOMBRE].Services.Catalog/Infrastructure \
  --startup-project src/[NOMBRE].Services.Catalog \
  --context CatalogDbContext

# Aplicar en desarrollo
dotnet ef database update \
  --project src/[NOMBRE].Services.Catalog/Infrastructure \
  --startup-project src/[NOMBRE].Services.Catalog

# Script SQL idempotente para staging/prod
dotnet ef migrations script \
  --project src/[NOMBRE].Services.Catalog/Infrastructure \
  --startup-project src/[NOMBRE].Services.Catalog \
  --output migrations.sql \
  --idempotent \
  --no-build
```

## Estructura de Migraciones por Servicio

```
[Service].Infrastructure/
├── Persistence/
│   ├── AppDbContext.cs
│   ├── Configurations/
│   │   ├── {Entity}Configuration.cs
│   │   └── ...
│   └── Migrations/
│       ├── 20240101_InitialCreate.cs
│       ├── 20240115_AddProductCategory.cs
│       └── MigrationsModelSnapshot.cs
```

## Patrones de Migrations en EF Core 9+

### owned Entity
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(nameof(Order),
        c => new
        {
            Id = c<Guid>( nullable: false ),
            CustomerId = c<Guid>(),
            CreatedAt = c<DateTime>(),
            ShippingAddress_Street = c<string>(),
            ShippingAddress_City = c<string>(),
            TenantId = c<Guid>()
        });
}
```

### Global Query Filter en Migration
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        CREATE INDEX IX_Orders_TenantId 
        ON Orders(TenantId) 
        WHERE TenantId IS NOT NULL;
    ");
}
```

### Concurrency Token (Row Version)
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<byte[]>(
        nameof(Order.Version),
        table: "Orders",
        type: "rowversion",
        rowVersion: true);
}
```

## Estrategia: Monolito → Microservicios

### Fase 1: Identificar tablas del BC
```
1. Inventariar todas las tablas del bounded context a extraer
2. Identificar foreign keys a otras tablas (mantener o eliminar)
3. Documentar datos que migran vs datos que se sintetizan
```

### Fase 2: Crear DbContext paralelo
```csharp
// NUEVO DbContext - mapea solo las tablas del BC
public class CatalogDbContext : DbContext
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Misma estructura que el monolito (ToTable para no renombrar)
        modelBuilder.Entity<Product>()
            .ToTable("Products");  // Mismo nombre que en monolito
    }
}
```

### Fase 3: Dual write (ambos contextos)
- Monolito sigue escribiendo en tablas originales
- Nuevo microservicio escribe en mismas tablas
- Validar consistencia durante período de transición

### Fase 4: Cutover
```
1. Detener tráfico en monolito
2. Asegurar que nuevo servicio tiene todos los datos
3. Actualizar API Gateway para apuntar al nuevo servicio
4. Eliminar código del monolito
```

## Reglas de Seguridad

1. **NUNCA** `dotnet ef database update` directo en staging o producción
2. **SIEMPRE** generar el script SQL y revisarlo antes de aplicar
3. **Backups obligatorios** antes de cualquier migración de esquema
4. **Idempotente**: usar `--idempotent` en scripts de producción
5. **Version lock**: no aplicar migraciones en paralelo

## Multi-Tenant con EF Core

### Shared Schema (TenantId en tabla)
```csharp
// En EntityTypeConfiguration
builder.HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);

// En Migration
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<Guid>(
        name: "TenantId",
        table: "Products",
        nullable: false,
        defaultValue: Guid.Empty);

    migrationBuilder.CreateIndex(
        name: "IX_Products_TenantId",
        table: "Products",
        columns: "TenantId");
}
```

### Schema-per-Tenant
```csharp
// En DbContext
public class CatalogDbContext : DbContext
{
    private readonly string _schema;

    public CatalogDbContext(DbContextOptions options, ITenantContext tenantContext)
        : base(options)
    {
        _schema = tenantContext.SchemaName;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(_schema);
    }
}
```

## Signals de Completitud

- Migration crea las tablas correctas
- Indexes creados para queries frecuentes
- Global Query Filters configurados
- Concurrency tokens donde hay update concurrente
- Script SQL revisado y aprobado