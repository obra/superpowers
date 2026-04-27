---
name: row-level-security
description: Row-Level Security para SQL Server con security predicates, app roles, y auditoría para compliance
compatibility: opencode
metadata:
  stack: sql-server
  category: security
  runtime: database
---

## Qué es Row-Level Security

RLS es security de base de datos que filtra filas automáticamente:
- En el nivel de base de datos, no aplicación
- No puede bypass
- Cumple requisitos de compliance (SOC2, HIPAA)
- Aplica a TODOS los accesos (users, app roles, service accounts)

## Cuándo usar RLS

| Patrón | EF Core Filters | RLS |
|--------|---------------|-----|
| Multi-tenant shared DB | ✅ | ✅ |
| Compliance requirement | ❌ | ✅ |
| Service account access | ❌ | ✅ |
| Direct SQL | ❌ | ✅ |

**Defensa en profundidad:** Usar ambos.

---

## Arquitectura RLS

```
┌─────────────────────────────────────────────┐
│           SQL Server                      │
│  ┌─────────────────────────────────┐    │
│  │  Policy: TenantIsolationPolicy    │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │ Security Predicate Fn      │  │    │
│  │  │ (returns filtered rows)    │  │    │
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## Implementación

### 1. Crear función de security predicate

```sql
CREATE FUNCTION dbo.fn_TenantSecurityPredicate(@TenantId AS NVARCHAR(50))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS FnResult
WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS NVARCHAR(50));
```

### 2. Crear security policy

```sql
CREATE SECURITY POLICY dbo.TenantIsolationPolicy
ADD FILTER PREDICATE dbo.fn_TenantSecurityPredicate(TenantId)
ON dbo.Customers,
ADD FILTER PREDICATE dbo.fn_TenantSecurityPredicate(TenantId)
ON dbo.Orders
WITH (STATE = ON);
```

### 3. Habilitar en la aplicación

```csharp
// Set tenant context antes de cada query
public async Task SetTenantContextAsync(SqlConnection connection, string tenantId)
{
    await connection.OpenAsync();
    
    using var cmd = new SqlCommand(
        "EXEC sp_set_session_context @key, @value", connection);
    cmd.Parameters.AddWithValue("@key", "TenantId");
    cmd.Parameters.AddWithValue("@value", tenantId);
    await cmd.ExecuteNonQueryAsync();
}
```

---

## Session Context

### sp_set_session_context

```sql
-- Set tenant ID (por app)
EXEC sp_set_session_context @key = N'TenantId', @value = N'acme-tenant-id';

-- Verificar valor
SELECT SESSION_CONTEXT(N'TenantId');
```

### En .NET

```csharp
public async Task OpenAndSetTenantAsync(SqlConnection connection, string tenantId)
{
    await connection.OpenAsync();
    
    using var cmd = new SqlCommand(
        "EXEC sp_set_session_context @key = N'@key', @value = @value", 
        connection);
    
    var param = cmd.CreateParameter();
    param.ParameterName = "@key";
    param.Value = "TenantId";
    cmd.Parameters.Add(param);
    
    param = cmd.CreateParameter();
    param.ParameterName = "@value";
    param.Value = tenantId ?? (object)DBNull.Value;
    cmd.Parameters.Add(param);
    
    await cmd.ExecuteNonQueryAsync();
}
```

---

## App Roles

### Crear app role

```sql
-- Crear app role
CREATE APPLICATION ROLE AppTenantUser 
    WITH PASSWORD = 'StrongPassword!123';

-- Grant permissions
GRANT SELECT ON SCHEMA::dbo TO AppTenantUser;
GRANT INSERT ON SCHEMA::dbo TO AppTenantUser;
GRANT UPDATE ON SCHEMA::dbo TO AppTenantUser;
GRANT DELETE ON SCHEMA::dbo TO AppTenantUser;
```

### Activar app role desde .NET

```csharp
public async Task ActivateAppRoleAsync(SqlConnection connection)
{
    using var cmd = new SqlCommand("SET ROLE AppTenantUser", connection);
    await cmd.ExecuteNonQueryAsync();
}
```

### App role + RLS

```sql
-- Cuando se activa app role, SESSION_CONTEXT ya está configurado
-- RLS filtra automáticamente
```

---

## Multiple schemas per tenant

### Schema-per-tenant

```sql
-- Crear schema por tenant
CREATE SCHEMA AUTHORIZATION dbo AUTHORIZE [acme];
CREATE SCHEMA AUTHORIZATION dbo AUTHORIZE [globex];

-- Establecer schema default por user
ALTER USER TenantUser WITH DEFAULT_SCHEMA = acme;
```

### Connection string per tenant

```csharp
// Factory que cambia schema
public class TenantConnectionFactory : IDbConnectionFactory
{
    public async Task<IDbConnection> CreateConnectionAsync(string tenantId)
    {
        var connectionString = await _catalog.GetConnectionStringAsync(tenantId);
        return new SqlConnection(connectionString);
    }
}
```

---

## Users y RLS

### Users mapeados a tenant

```sql
-- User por tenant
CREATE LOGIN [acme_user] WITH PASSWORD = '...';
CREATE USER [acme_user] FOR LOGIN [acme_user];

-- En la función, usar USER_NAME()
CREATE FUNCTION dbo.fn_CurrentUserSecurityPredicate()
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS FnResult
WHERE USER_NAME() = SESSION_USER;
```

### Mapeo tenant <-> user

```sql
-- Tabla de mapeo
CREATE TABLE dbo.TenantUserMapping
(
    TenantId NVARCHAR(50) NOT NULL,
    DatabaseUserName NVARCHAR(50) NOT NULL,
    
    CONSTRAINT PK_TenantUserMapping PRIMARY KEY (TenantId)
);

-- En login trigger
CREATE TRIGGER SetTenantContextOnLogin
ON DATABASE
AFTER LOGIN
AS
BEGIN
    DECLARE @UserName NVARCHAR(50) = ORIGINAL_LOGIN_NAME();
    DECLARE @TenantId NVARCHAR(50);
    
    SELECT @TenantId = TenantId 
    FROM dbo.TenantUserMapping 
    WHERE DatabaseUserName = @UserName;
    
    IF @TenantId IS NOT NULL
    BEGIN
        EXEC sp_set_session_context N'TenantId', @TenantId;
    END
END;
```

---

## Auditoría

### Tabla de auditoría

```sql
CREATE TABLE dbo.AuditLog
(
    AuditId BIGINT IDENTITY(1,1) PRIMARY KEY,
    EventTime DATETIME2 DEFAULT GETUTCDATE(),
    EventType NVARCHAR(50),
    TableName NVARCHAR(100),
    RecordKey NVARCHAR(100),
    TenantId NVARCHAR(50),
    UserName NVARCHAR(50),
    OldValues NVARCHAR(MAX),
    NewValues NVARCHAR(MAX),
    IpAddress NVARCHAR(50)
);
```

### Trigger de auditoría

```sql
CREATE TRIGGER AuditOrders ON dbo.Orders
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    INSERT INTO dbo.AuditLog (EventType, TableName, RecordKey, TenantId, UserName, OldValues, NewValues)
    SELECT 
        CASE 
            WHEN EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) THEN 'UPDATE'
            WHEN EXISTS(SELECT 1 FROM inserted) THEN 'INSERT'
            ELSE 'DELETE'
        END,
        'Orders',
        ISNULL(i.Id.ToString(), d.Id.ToString()),
        ISNULL(i.TenantId, d.TenantId),
        SYSTEM_USER,
        (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
    FROM inserted i
    FULL JOIN deleted d ON i.Id = d.Id;
END;
```

---

## Deshabilitar RLS temporalmente

```sql
-- Deshabilitar para operaciones de admin
ALTER SECURITY POLICY dbo.TenantIsolationPolicy
WITH (STATE = OFF);

-- Run operation
DELETE FROM dbo.Orders WHERE TenantId = 'old-tenant';

-- Habilitar de nuevo
ALTER SECURITY POLICY dbo.TenantIsolationPolicy
WITH (STATE = ON);
```

---

## Performance

### Indexes y RLS

```sql
-- Crear índice después de habilitar RLS
-- El optimizador considera el predicate
CREATE NONCLUSTERED INDEX IX_Customers_TenantId
ON dbo.Customers (TenantId)
INCLUDE (Name, Email);
```

### Explicar plan

```sql
SET SHOWPLAN_TEXT ON;
GO

SELECT * FROM dbo.Customers WHERE Name = 'Test';
GO
```

---

## Migración a RLS

### Step-by-step

1. **Identify tables** que necesitan RLS
2. **Add TenantId column** a cada table
3. **Create security predicate function**
4. **Create security policy**
5. **Test** que RLS filtra correctamente
6. **Update app** para set session context
7. **Monitor** performance

---

## Signals de Completitud

- RLS filtra rows automáticamente
- Session context configurado correctamente
- App roles funcionan
- Auditoría captura accesos
- Performance aceptable con índices
- Tests de security pasan