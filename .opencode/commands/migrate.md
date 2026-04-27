---
name: migrate
description: Migra aplicaciones monoliticas a arquitectura de microservicios con DDD
---

# Migrate Command

Ayuda en la migracion de aplicaciones monoliticas a arquitectura de microservicios.

## Uso

```
/migrate [modulo]
```

## Descripcion

Proceso de migracion:

1. **Analisis del monolito** - Identificar bounded contexts usando `domain-analysis` skill
2. **Diseno de microservicios** - Definir servicios y sus responsabilidades
3. **Estrategia de migracion** - Strangler pattern o big bang
4. **Implementacion** - Extraer contextos paso a paso
5. **Verificacion** - Tests y validacion de cada servicio

## Proceso Detallado

### Fase 1: Analisis
- Identificar modulo a migrar
- Mapear dependencias hacia otros modulos
- Definir bounded context propuesto
- Identificar riesgos

### Fase 2: Diseno
- Estructura de microservicio (Clean Architecture)
- Contratos de API
- Estrategia de datos (database-per-service)
- Comunicacion (sync via Dapr vs async via Pub/Sub)

### Fase 3: Migracion
- Crear estructura del nuevo servicio
- Migrar codigo del modulo
- Adaptar dependencias
- Generar migrations SQL

### Fase 4: Validacion
- Tests del nuevo servicio
- Integracion con API Gateway
- Health checks
- Observabilidad

## Patrones de Migracion

### Strangler Pattern (Recomendado)
- Mantener monolito funcionando
- Extraer funcionalidades una a una
- Gradual transition
- menos riesgo

### Big Bang
- Replace completo simultaneo
- Mas riesgo
- Solo para casos controlados

## Skills Utilizados

- `domain-analysis` - Para identificar bounded contexts
- `ddd-aggregate` - Para definir aggregates correctos
- `scaffolding` - Para crear estructura Clean Architecture
- `sqlserver-migration` - Para generar scripts de DB
- `dapr-microservices` - Para comunicacion entre servicios

## Requisitos

- SQL Server connection para analisis de DB
- Acceso al codigo fuente del monolito
- Clear bounded contexts identificados

## Output

- Arquitectura target documentada
- Plan de migracion paso a paso
- Scaffolding para cada microservicio
- Scripts de migracion de datos
