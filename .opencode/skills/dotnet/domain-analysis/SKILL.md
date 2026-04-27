---
name: domain-analysis
description: Conducir un análisis de dominio completo usando DDD estratégico y táctico. Produce bounded contexts, lenguaje ubicuo, context map, aggregates, events y el diseño táctico por BC. Usar al inicio de cualquier proyecto o feature significativo.
compatibility: opencode
metadata:
  output-quality: senior-analyst
  stack: dotnet-9-10
  architecture: microservices
---

**Importante:** Este análisis es para microservicios, NO para monolito.
Cada Bounded Context = un microservicio independiente con su propia base de datos.

## Por tipo de proyecto

| Tipo | Enfoque |
|------|---------|
| **Nuevo** | Diseñar BCs desde cero, arquitectura limpia |
| **POC** | 1 microservicio mínimo, scope reducido |
| **Migración legacy** | Extraer BCs estables como microservicios nuevos (NO migrar monolito) |

## Qué produce este skill

Un documento de análisis de dominio estructurado con estas secciones,
en este orden:

1. Actores del dominio
2. Lenguaje ubicuo (Ubiquitous Language)
3. Comandos y eventos clave
4. Bounded Contexts identificados
5. Context Map y relaciones entre BCs
6. Diseño táctico por BC (Aggregates, Entities, VOs, Invariantes)
7. Domain Events e interfaces de repositorio (puertos)
8. Scope POC vs producto completo
9. Contratos de integración entre microservicios (Dapr Pub/Sub)

---

## Proceso de Análisis

### Paso 1: Actores
Identifica todos los roles humanos o sistemas que interactúan con el
dominio. Para cada actor: qué puede hacer, qué no puede hacer, qué
información necesita.

No asumir roles sin preguntar o razonar desde el negocio.
Si el requerimiento no los menciona explícitamente, derivarlos
del flujo de negocio descrito.

### Paso 2: Lenguaje ubicuo
Define los términos del dominio que el equipo usará de forma consistente
en código, conversaciones y documentación.

Reglas del lenguaje ubicuo:
- Cada concepto tiene UN nombre, nunca sinónimos
- Los nombres vienen del experto de dominio, no del técnico
- Documentar qué NO se debe llamar (anti-términos)
- Los aggregates, commands y events usan estos términos exactos

### Paso 3: Comandos y eventos
Para cada acción significativa del sistema:
- Comando: intención del actor (verbo + sustantivo, ej. RegistrarPedido)
- Evento: hecho consumado inmutable (pasado, ej. PedidoRegistrado)
- Identificar scope del proyecto actual vs extensiones futuras
- Para microservicios: especificar si el evento es sync o async (via Dapr)

### Paso 4: Bounded Contexts
Agrupar responsabilidades cohesivas. Cada BC:
- Tiene una sola responsabilidad clara
- Tiene su propio lenguaje ubicuo (los mismos términos pueden
  significar cosas distintas en BCs distintos)
- Es independiente: puede desplegarse o modificarse sin tocar otros BCs
- Tiene su propia base de datos (database-per-service)
- Contiene: nombre, responsabilidad, aggregates/VOs principales,
  domain events, scope (qué incluye ahora vs qué después)

Señales de que algo debe ser un BC separado:
- El modelo de datos es fundamentalmente distinto
- Los actores que lo usan son distintos
- La frecuencia de cambio es distinta
- Tiene su propio ciclo de vida
- Requiere escalado independiente

### Paso 5: Context Map
Mapear cómo se comunican los BCs. Patrones:

**Monolito Modular:**
- Upstream/Downstream: uno depende del otro
- Open Host Service: BC expone interfaz pública estable
- Anti-Corruption Layer (ACL): transforma modelo ajeno
- Shared Kernel: comparten modelo común
- Published Language: comunicación via eventos

**Microservicios (Dapr):**
- Dapr Service Invocation: sync calls entre servicios
- Dapr Pub/Sub: async event-driven communication
- Shared Kernel: proyecto Shared con interfaces base

```
┌─────────────┐     Dapr Pub/Sub      ┌─────────────┐
│  Catalog   │ ──────────────────► │   Order    │
│  Service   │                   │   Service  │
└─────────────┘                   └─────────────┘
       │                              ▲
       │    Dapr Service Invocation     │
       └──────────────────────────────┘
              (sync, si necesario)
```

### Paso 6: Diseño táctico por BC

**Aggregate Root (AR):**
- Único punto de entrada para modificar estado
- Protege invariantes del aggregate
- Contiene lista privada de domain events
- Factory method: `NombreAR.Create(...)`

**Entities:**
- Tienen identidad propia (ID)
- Su estado puede cambiar, pero su identidad no
- Solo se modifican a través del AR que las contiene

**Value Objects (VOs):**
- Sin identidad — comparación por valor
- Inmutables después de creación
- Validación en factory method
- Usar `record` en .NET 9+

**Invariantes:**
- Reglas que el AR garantiza siempre
- Se documentan explícitamente para guiar tests
- Si una invariante no puede cumplirse, el AR lanza excepción

**Métodos del AR:**
- Solo los necesarios para los comandos identificados
- Nombrados igual que los comandos del dominio

### Paso 7: Domain Events e interfaces de repositorio

**Eventos de dominio:**
- Publicador, subscribers, datos que lleva
- Topic de Dapr Pub/Sub: `pubsub/{event-name}`
- Schema del evento (Data Transfer Object)

```csharp
// Ejemplo de evento para Dapr Pub/Sub
public record ProductCreatedEvent(
    Guid ProductId,
    string Name,
    decimal Price,
    DateTime OccurredOn
) : IDomainEvent;
```

**Repositorios:** Solo operaciones que los comandos realmente necesitan — sin CRUD genérico.

### Paso 8: Scope
Separar:
- **Scope actual (POC/MVP):** qué se implementa ahora
- **Alcance completo (producto):** qué se agrega después

La estructura de carpetas y contratos del POC deben ser idénticos
al diseño completo. El crecimiento es aditivo, no destructivo.

---

## Esquema de Documento de Análisis

```markdown
# {Nombre del Proyecto} - Análisis de Dominio

## 1. Actores
| Actor | Rol | Responsabilidades |
|-------|-----|-----------------|

## 2. Lenguaje Ubicuo
| Término | Definición | Sinónimo |

## 3. Comandos y Eventos
| Comando | Evento Resultante | Tipo | BC |
|---------|---------------|------|----|

## 4. Bounded Contexts
### 4.1 {BC1}
- Responsabilidad: ...
- Aggregates: ...
- Domain Events: ...
- Scope: ...

### 4.2 {BC2}
- ...

## 5. Context Map
```
{BC1} ──► {BC2}
```
Patrón: Published Language (Dapr Pub/Sub)

## 6. Diseño Táctico

### 6.1 {BC1}
#### Aggregate: {NombreAR}
- Invariantes: ...
- Métodos: ...
```

---

## Dapr Pub/Sub en el Análisis

Para cada evento que cruza BCs, documentar:

| Campo | Valor |
|-------|-------|
| Topic | `pubsub/orders.created` |
| Publisher | Order Service |
| Subscribers | Notification Service, Inventory Service |
| Payload | `{ orderId, customerId, total }` |
| Тип | Async (fire-and-forget) |

### Decisión: Sync vs Async

| Requisito | Patrón |
|-----------|-------|
| Resultado inmediato necesario | Dapr Service Invocation (sync) |
| Background processing | Dapr Pub/Sub (async) |
| Multi-step con compensación | Dapr Workflow |
| Replay de eventos | Dapr Pub/Sub con dead letter queue |

---

## Estándar de Calidad

El documento debe permitir que un desarrollador senior
empiece a codificar sin hacer más preguntas sobre el dominio.

Señales de que el análisis está completo:
- Cada comando tiene su evento resultante
- Cada AR tiene sus invariantes documentadas
- El Context Map muestra el patrón de relación entre cada par de BCs
- El scope POC vs completo está claramente delimitado
- Los eventos cross-BC tienen topic de Dapr definido
- El lenguaje ubicuo documenta qué NO se debe llamar