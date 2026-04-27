---
description: Consulta rápida de bases de datos con Dapper micro-ORM. Solo lecturas (SELECT), sin writes.
---

# Skill: dapper-reading

 Usa Dapper para todas las operaciones de lectura (SELECT queries). EF Core se mantiene para writes y migraciones.

## Cuándo usar

- Cualquier método de repositorio que **solo lea** datos de la base de datos
- Queries que devuelvan listas o elementos individuales
- Queries con joins complejos donde EF Core genera SQL ineficiente

## Cuándo NO usar

- Insert, Update, Delete → usar EF Core
- Transacciones distribuidas → usar EF Core
- Migraciones → usar EF Core

## Ejemplo de uso

```csharp
public class VacationRequestRepository : Repository<VacationRequest>, IVacationRequestRepository
{
    private readonly DbConnection _connection;

    public VacationRequestRepository(AppDbContext context) : base(context)
    {
        _connection = context.Database.GetDbConnection();
    }

    public async Task<IReadOnlyList<VacationRequest>> GetByEmployeeIdAsync(Guid employeeId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT Id, EmployeeId, ManagerId, StartDate, EndDate, Days, Status, Type, Comment, CreatedAt, UpdatedAt
            FROM vacations.VacationRequests
            WHERE EmployeeId = @EmployeeId";

        var result = await _connection.QueryAsync<VacationRequest>(sql, new { EmployeeId = employeeId });
        return result.ToList();
    }
}
```

## Configuración

1. Agregar paquete NuGet: `dotnet add package Dapper`
2. Inyectar `DbConnection` desde `AppDbContext.Database.GetDbConnection()`
3. Usar `connection.QueryAsync<T>()` para SELECT queries
4. Connection string: misma de appsettings.json

## Patrón híbrido

| Operación | Herramienta |
|----------|------------|
| SELECT (lectura) | Dapper |
| INSERT | EF Core |
| UPDATE | EF Core |
| DELETE | EF Core |
| Migraciones | EF Core |

## Validación

El reviewer verificará que las queries de lectura usen Dapper, no LINQ sobre DbSet.