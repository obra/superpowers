---
name: dapr-microservices
description: Guía completa de Dapr para microservicios .NET. Service Invocation, Pub/Sub, State Management, Secrets, y configuración de componentes. Usar cuando se implementa comunicación entre microservicios.
compatibility: opencode
metadata:
  stack: dotnet-9-10
  architecture: microservices
  runtime: dapr
---

## Qué es Dapr

Dapr (Distributed Application Runtime) proporciona building blocks para microservicios:
- Service Invocation (invocación entre servicios)
- Pub/Sub (messaging asíncrono)
- State Management (estado key-value)
- Secrets (secretos externos)
- Bindings (integración con externos)
- Actors (stateful singletons)

## Instalación

```bash
# CLI de Dapr
curl -fsSL https://get.dapr.io | bash

# Inicializar en local (crea Redis, etc.)
dapr init

# Verificar
dapr --version
```

## Paquetes NuGet

```bash
# Core SDK
dotnet add package Dapr.Client

# Pub/Sub (v1.15+)
dotnet add package Dapr.Client.Messaging

# OpenTelemetry
dotnet add package Dapr.OpenTelemetry
```

## Service Invocation (Sync)

### Configuración básica

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Dapr client para service invocation
builder.Services.AddDaprClient();

// También disponible via HttpClient factory
builder.Services.AddHttpClient("dapr", client =>
{
    client.BaseAddress = new Uri("http://localhost:3500");
});
```

### Invocar otro servicio

```csharp
public class OrderService
{
    private readonly DaprClient _daprClient;

    public async Task<Guid> CreateOrderAsync(CreateOrderRequest request)
    {
        // Via Dapr SDK
        var response = await _daprClient.InvokeMethodAsync<CreateOrderRequest, CreateOrderResponse>(
            "order-service",
            "/api/orders",
            request);

        return response.OrderId;
    }

    public async Task<Guid> CreateOrderViaHttpAsync(CreateOrderRequest request)
    {
        // Via HttpClient (más control sobre headers)
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

        var response = await _httpClient.PostAsJsonAsync(
            "http://order-service/api/orders",  // dapr-app-id header automático
            request,
            cts.Token);

        return (await response.Content.ReadFromJsonAsync<CreateOrderResponse>()).OrderId;
    }
}
```

### dapr.yaml (componentes)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  - name: dapr-api-host
    name: order-api
spec:
  type: meta
  version: v1
scopes:
  - order-api
```

---

## Pub/Sub (Async)

### Publicar evento

```csharp
public class OrderEventPublisher
{
    private readonly DaprClient _daprClient;
    private const string PubSubName = "pubsub";

    public async Task PublishOrderCreatedAsync(OrderCreatedEvent @event)
    {
        await _daprClient.PublishEventAsync(
            PubSubName,
            "orders/created",  // topic name
            @event);
    }

    public async Task PublishOrderCancelledAsync(OrderCancelledEvent @event)
    {
        await _daprClient.PublishEventAsync(
            PubSubName,
            "orders/cancelled",
            @event,
            cancellationToken: CancellationToken.None);
    }
}
```

### Suscribir a evento

```csharp
// Program.cs
app.MapSubscribeHandler();  // Registra todos los [DaprTopic]

// Handler con attribute
public class NotificationHandler : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var (envelope, ct) in _subscriber.SubscribeAsync<OrderCreatedEvent>(
            new SubscribeOptions
            {
                Topic = "orders/created",
                PubsubName = "pubsub"
            }, stoppingToken))
        {
            try
            {
                await _notificationService.NotifyCustomerAsync(envelope.Data);
                await envelope.Success();
            }
            catch (Exception ex)
            {
                await envelope.Fail(ex.Message);
            }
        }
    }
}
```

### Componente Pub/Sub (Redis)

```yaml
# components/pubsub.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  - name: pubsub
spec:
  type: pubsub.redis
  version: v1
  metadata:
    - name: redisHost
      value: "localhost:6379"
    - name: redisPassword
      value: ""
scopes:
  - order-api
  - notification-api
```

### Dead Letter Queue

```yaml
# Pub/Sub con DLQ
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  - name: pubsub
spec:
  type: pubsub.redis
  version: v1
  metadata:
    - name: redisHost
      value: "localhost:6379"
    - name: enableDeadLetter
      value: "true"
```

---

## State Management

### Guardar estado

```csharp
public class CartService
{
    private readonly DaprClient _daprClient;
    private const string StoreName = "statestore";

    public async Task SaveCartAsync(string userId, ShoppingCart cart)
    {
        // Save con ETag para optimistic concurrency
        await _daprClient.SaveStateAsync(StoreName, userId, cart);
    }

    public async Task<ShoppingCart?> GetCartAsync(string userId)
    {
        return await _daprClient.GetStateAsync<ShoppingCart>(StoreName, userId);
    }

    public async Task<bool> UpdateCartWithEtagAsync(string userId, ShoppingCart cart)
    {
        var (existingCart, etag) = await _daprClient.GetStateAsync<ShoppingCart>(
            StoreName, userId, metadata: new Dictionary<string, string>
            {
                ["metadatakey"] = "etag"
            });

        if (etag == null) return false;

        try
        {
            await _daprClient.SaveStateAsync(StoreName, userId, cart,
                metadata: new Dictionary<string, string> { ["etag"] = etag });
            return true;
        }
        catch (ConditionWriteFailureException)
        {
            return false;
        }
    }
}
```

### State Configuration

```yaml
# components/statestore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  - name: statestore
spec:
  type: state.redis
  version: v1
  metadata:
    - name: redisHost
      value: "localhost:6379"
scopes:
  - catalog-api
```

---

## Secrets

```csharp
// Configuración
builder.Services.AddDaprClient();

// Leer secreto
public class SecretsService
{
    private readonly DaprClient _daprClient;

    public async Task<string> GetConnectionStringAsync()
    {
        var secret = await _daprClient.GetSecretAsync(
            "kvstore",
            "connection-string");

        return secret["connection-string"];
    }
}
```

### Secret Component

```yaml
# components/secrets.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  - name: kvstore
spec:
  type: secretstores.local.file
  version: v1
  metadata:
    - name: secretFile
      value: "./components/secrets.json"
scopes:
  - catalog-api
```

---

## OpenTelemetry

```csharp
// Integration
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing.AddDapr());

// O con Aspire
builder.AddDaprTracing();
```

---

## Running en Local

```bash
# Run microservicio con Dapr sidecar
dapr run --app-id catalog-api \
  --app-port 5000 \
  --dapr-http-port 3500 \
  --dapr-grpc-port 50001 \
  -- dotnet run

# Run API Gateway
dapr run --app-id gateway \
  --app-port 8080 \
  -- dotnet run
```

### docker-compose local

```yaml
# docker-compose.yml
version: '3'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  zipkin:
    image: openzipkin/zipkin
    ports:
      - "9411:9411"

  catalog-api:
    build: ./src/Services.Catalog
    depends_on:
      - redis
    ports:
      - "5000:5000"
    command: ["dapr", "run", "--app-id", "catalog-api", "--app-port", "5000", "dotnet", "run"]
```

---

## Patrones de Diseño

### 1. Sync: Service Invocation
Para operaciones que requieren respuesta inmediata.
```
Client → Gateway → Order Service → (respuesta)
```

### 2. Async: Pub/Sub
Para operaciones que no requieren respuesta inmediata.
```
Order Service → (Pub/Sub) → Notification Service
                    → Inventory Service
```

### 3. Request-Reply via Pub/Sub
Para async con respuesta posterios.
```
Order Service → Publish: orders/create
                    ← Subscribe: orders.created.reply
```

### 4. Saga Pattern
Para transacciones distribuidas con compensations.
```
[CreateOrder] → [ReserveInventory] → [ProcessPayment]
     ↓ fail              ↓ fail              ↓ fail
  [Cancel]         [ReleaseInventory]   [RefundPayment]
```

---

## Cuándo usar Dapr

| Patrón | Cuándo |
|--------|--------|
| Service Invocation | Llamadas sync entre servicios |
| Pub/Sub | Eventos, notificaciones, fan-out |
| State Management | Sesiones, caché distribuido |
| Actors | Stateful singletons, counters |
| Secrets | Configuración sensible |

---

## Signals de Completitud

- Service invocation funciona entre servicios
- Pub/Sub publica y suscribe correctamente
- State management persiste y recupera datos
- Secrets se leen sin hardcoding
- Telemetry muestra trazas distribuidas