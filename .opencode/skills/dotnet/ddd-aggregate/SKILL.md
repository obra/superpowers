---
name: ddd-aggregate
description: Diseñar Aggregates, Entities, Value Objects y Domain Events en C# siguiendo DDD táctico. Usar cuando se modela el dominio de negocio.
compatibility: opencode
metadata:
  stack: dotnet-9-10
  pattern: ddd-tactical
---

## Qué hago

Guío el diseño de los building blocks tácticos de DDD en C# moderno (.NET 9+).

## Patrones Base

### Aggregate Root
```csharp
public abstract class AggregateRoot<TId> : Entity<TId>
{
    private readonly List<IDomainEvent> _domainEvents = [];
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    protected void RaiseDomainEvent(IDomainEvent domainEvent) =>
        _domainEvents.Add(domainEvent);
    
    public void ClearDomainEvents() => _domainEvents.Clear();
}

public abstract class Entity<TId> where TId : IEntityId
{
    public TId Id { get; protected set; } = default!;
    public int Version { get; protected set; }
    
    private readonly List<IDomainEvent> _domainEvents = [];
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
}
```

### Entity con Multi-Tenant
```csharp
public abstract class TenantEntity<TId> : Entity<TId> where TId : IEntityId
{
    public Guid TenantId { get; private protected set; }
    
    protected TenantEntity(Guid tenantId) => TenantId = tenantId;
}
```

### Value Object Inmutable
```csharp
public readonly record struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }
    
    public Money(decimal amount, string currency = "USD")
    {
        if (amount < 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));
            
        Amount = amount;
        Currency = currency;
    }
    
    public static Money operator +(Money a, Money b) =>
        a.Currency == b.Currency 
            ? new Money(a.Amount + b.Amount, a.Currency)
            : throw new InvalidOperationException("Currency mismatch");
}
```

### Value Object con Validación
```csharp
public record Email
{
    public string Value { get; }
    
    private Email(string value) => Value = value;
    
    public static Result<Email> Create(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Result.Failure<Email>("Email is required");
        if (!value.Contains('@'))
            return Result.Failure<Email>("Invalid email format");
            
        return new Email(value.ToLowerInvariant());
    }
}
```

### Domain Event
```csharp
public record OrderCreatedEvent(
    Guid OrderId,
    Guid CustomerId,
    IReadOnlyList<OrderItemEvent> Items,
    DateTime OccurredOn = default
) : IDomainEvent
{
    public DateTime OccurredOn { get; } = OccurredOn == default ? DateTime.UtcNow : OccurredOn;
}
```

---

## CQRS Base

### Command (Create)
```csharp
public record CreateOrderCommand(
    Guid CustomerId,
    List<CreateOrderItemCommand> Items
) : ICommand<Result<Guid>>;

public record CreateOrderItemCommand(
    Guid ProductId,
    int Quantity,
    decimal UnitPrice
);
```

### Command Handler
```csharp
public class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IDomainEventDispatcher _eventDispatcher;
    
    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IDomainEventDispatcher eventDispatcher)
    {
        _orderRepository = orderRepository;
        _eventDispatcher = eventDispatcher;
    }
    
    public async Task<Result<Guid>> Handle(
        CreateOrderCommand command, 
        CancellationToken ct)
    {
        var order = Order.Create(command.CustomerId, command.Items);
        
        await _orderRepository.AddAsync(order, ct);
        await _eventDispatcher.DispatchAsync(order.DomainEvents, ct);
        
        return Result.Success(order.Id);
    }
}
```

### Query (Read)
```csharp
public record GetOrderQuery(Guid OrderId) : IQuery<Result<OrderDto>>;

public record OrderDto(
    Guid Id,
    Guid CustomerId,
    List<OrderItemDto> Items,
    decimal Total
);
```

---

## Patrones de Persistencia

### Owned Entity (Value Object en tabla)
```csharp
builder.Entity<Order>()
    .OwnsOne(o => o.ShippingAddress, addr =>
    {
        addr.Property(a => a.Street).HasColumnName("ShippingStreet");
        addr.Property(a => a.City).HasColumnName("ShippingCity");
    });
```

### OwnsMany (colección de Value Objects)
```csharp
builder.Entity<Order>()
    .OwnsMany(o => o.Items, item =>
    {
        item.Property(i => i.ProductId).HasColumnName("ProductId");
        item.Property(i => i.Quantity).HasColumnName("Quantity");
    });
```

### Global Query Filter (Multi-Tenant)
```csharp
builder.Entity<Order>()
    .HasQueryFilter(o => o.TenantId == _tenantContext.CurrentTenantId);
```

### Concurrency Token (ETag)
```csharp
builder.Entity<Order>()
    .Property(o => o.Version)
    .IsRowVersion();
```

---

## Domain Services

Para lógica que no pertenece a un Aggregate:

```csharp
public interface IPricingService
{
    decimal CalculateTotal(IReadOnlyList<CartItem> items);
}

public class PricingService : IPricingService
{
    public decimal CalculateTotal(IReadOnlyList<CartItem> items) =>
        items.Sum(i => i.Quantity * i.UnitPrice);
}
```

---

## Invariantes del Aggregate

Reglas que el AR protege siempre:

1. Un pedido no puede tener cantidad negativa
2. Un cliente no puede hacer más de N pedidos simultáneos
3. El precio total debe ser la suma de los items
4. Un producto no puede estar en más de X categorías

---

## Estándar de Código

- Usar `record` para DTOs, Commands, Queries, Events
- Usar `record struct` para Value Objects simples
- Usar `Result<T>` del paquete FluentResults para retornar éxito/fracaso
- Prefix `I` para interfaces (IRepository, IService)
- Sufijo `Event` para Domain Events
- Sufijo `Command`/`Query` para requests de MediatR

## Signals de Completitud

- Todos los VOs tienen validación en factory
- El AR protege sus invariantes
- Los Domain Events se disparan desde el AR
- Las queries retornan DTOs, no entidades