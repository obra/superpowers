---
name: nuget-manager
description: 'Manage NuGet packages in .NET microservices projects/solutions. Use this skill when adding, removing, or updating NuGet package versions. Includes packages for Dapr, YARP, Clean Architecture, and CQRS.'
metadata:
  stack: dotnet-9-10
  architecture: microservices
---

# NuGet Manager - Microservicios

## Overview

Gestión de paquetes NuGet para proyectos .NET con arquitectura de microservicios.

## Reglas Core

1. **NUNCA** editar directamente `.csproj` para añadir/remover paquetes
2. **SÍ** usar `dotnet add package` y `dotnet remove package`
3. **EDICIÓN DIRECTA** solo para cambiar versiones existentes

---

## Paquetes para Microservicios

### API Gateway (YARP)

```bash
# Core de YARP
dotnet add package Yarp.ReverseProxy

# Autenticación JWT
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# Rate Limiting (built-in .NET 10)
dotnet add package System.Threading.RateLimiting
```

### Dapr

```bash
# Dapr SDK
dotnet add package Dapr.Client

# Pub/Sub (v1.15+)
dotnet add package Dapr.Client.Messaging

# OpenTelemetry
dotnet add package Dapr.OpenTelemetry
```

### Persistencia

```bash
# EF Core + SQL Server
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design

# Dapper para reads
dotnet add package Dapper

# Migrations
dotnet add package Microsoft.EntityFrameworkCore.Tools
```

### CQRS + MediatR

```bash
# MediatR
dotnet add package MediatR

# FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions

# Result type
dotnet add package FluentResults
```

### Logging + Observability

```bash
# Serilog
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File

# OpenTelemetry
dotnet add package OpenTelemetry.Exporter.Console
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
```

### Blazor WASM Standalone

```bash
# HTTP Client factory
dotnet add package Microsoft.Extensions.Http

# JWT auth
dotnet add package Microsoft.AspNetCore.Components.WebAssembly.Authentication

# Fluent UI
dotnet add package Microsoft.FluentUI.AspNetCore.Components
dotnet add package Microsoft.FluentUI.AspNetCore.Components.Icons
```

---

## Comandos Frecuentes

### Añadir paquete a proyecto
```bash
dotnet add src/Catalog.API/Catalog.API.csproj package Yarp.ReverseProxy
```

### Añadir con versión específica
```bash
dotnet add package Dapr.Client --version 1.14.0
```

### Remover paquete
```bash
dotnet remove src/Catalog.API/Catalog.API.csproj package Dapr.Client
```

### Listar paquetes instalados
```bash
dotnet list src/Catalog.API/Catalog.API.csproj package
```

### Restaurar paquetes
```bash
dotnet restore src/[NOMBRE].sln
```

---

## Central Package Management

Si usas `Directory.Packages.props`:

```xml
<ItemGroup>
  <PackageVersion Include="Yarp.ReverseProxy" Version="2.1.0" />
  <PackageVersion Include="Dapr.Client" Version="1.14.0" />
  <PackageVersion Include="MediatR" Version="12.4.1" />
  <PackageVersion Include="FluentValidation" Version="11.9.2" />
  <PackageVersion Include="FluentResults" Version="3.15.2" />
  <PackageVersion Include="Serilog.AspNetCore" Version="8.0.2" />
</ItemGroup>
```

### Consumir en .csproj
```xml
<ItemGroup>
  <PackageReference Include="Yarp.ReverseProxy" />
  <PackageReference Include="Dapr.Client" />
  <PackageReference Include="MediatR" />
</ItemGroup>
```

---

## Verificar Versiones

```bash
dotnet package search Dapr.Client --exact-match --format json
```

---

## Signals de Completitud

- Todos los paquetes tienen versiones compatibles
- Restore completa sin errores
- No hay conflictos de dependencias