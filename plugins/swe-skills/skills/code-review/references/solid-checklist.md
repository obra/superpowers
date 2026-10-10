# SOLID Principles

## Overview

SOLID helps structure software to be flexible, maintainable, and testable. These principles reduce coupling and increase cohesion.

## S - Single Responsibility Principle (SRP)

> "A class should have one, and only one, reason to change."

### Problem It Solves
God objects that do everything - hard to test, hard to change, hard to understand.

### How to Apply
Each class handles ONE responsibility. If you find yourself saying "and" when describing what a class does, split it.

```typescript
// BAD: Multiple responsibilities
class Order {
  calculateTotal(): number { ... }
  saveToDatabase(): void { ... }    // Persistence
  generateInvoice(): string { ... } // Presentation
}

// GOOD: Single responsibility each
class Order {
  private items: OrderItem[] = [];

  addItem(item: OrderItem): void { ... }
  calculateTotal(): number { ... }
}

class OrderRepository {
  save(order: Order): Promise<void> { ... }
}

class InvoiceGenerator {
  generate(order: Order): Invoice { ... }
}
```

### Detection Questions
- Does this class have multiple reasons to change?
- Can I describe it without using "and"?
- Would different stakeholders request changes to different parts?

---

## O - Open/Closed Principle (OCP)

> "Software entities should be open for extension but closed for modification."

### Problem It Solves
Having to modify existing, tested code every time requirements change. Risk of breaking working features.

### How to Apply
Design abstractions that allow new behavior through new classes, not edits to existing ones.

```typescript
// BAD: Must modify to add new shipping
class ShippingCalculator {
  calculate(type: string, value: number): number {
    if (type === 'standard') return value < 50 ? 5 : 0;
    if (type === 'express') return 15;
    // Must add more ifs for new types!
  }
}

// GOOD: Open for extension
interface ShippingMethod {
  calculateCost(orderValue: number): number;
}

class StandardShipping implements ShippingMethod {
  calculateCost(orderValue: number): number {
    return orderValue < 50 ? 5 : 0;
  }
}

class ExpressShipping implements ShippingMethod {
  calculateCost(orderValue: number): number {
    return 15;
  }
}

// Add new shipping by creating new class, not modifying existing
class SameDayShipping implements ShippingMethod {
  calculateCost(orderValue: number): number {
    return 25;
  }
}
```

### Architectural Insight
OCP at architecture level means: **design your codebase so new features are added by adding code, not changing existing code.**

---

## L - Liskov Substitution Principle (LSP)

> "Subtypes must be substitutable for their base types without altering program correctness."

### Problem It Solves
Subclasses that break expectations, requiring type-checking and special cases.

### How to Apply
Subclasses must honor the contract of the parent. If the parent returns positive numbers, subclasses cannot return negatives.

```typescript
// BAD: Violates parent's contract
class DiscountPolicy {
  getDiscount(value: number): number {
    return 0; // Non-negative expected
  }
}

class WeirdDiscount extends DiscountPolicy {
  getDiscount(value: number): number {
    return -5; // Increases cost! Breaks expectations
  }
}

// GOOD: Enforces contract
class DiscountPolicy {
  constructor(private discount: number) {
    if (discount < 0) throw new Error("Discount must be non-negative");
  }

  getDiscount(): number {
    return this.discount;
  }
}
```

### Key Insight
This is why you can swap `InMemoryUserRepo` for `PostgresUserRepo` - they both honor the `UserRepo` interface contract.

---

## I - Interface Segregation Principle (ISP)

> "Clients should not be forced to depend on methods they do not use."

### Problem It Solves
Fat interfaces that force partial implementations, empty methods, or throws.

### How to Apply
Split large interfaces into smaller, cohesive ones. Clients depend only on what they need.

```typescript
// BAD: Fat interface
interface WarehouseDevice {
  printLabel(orderId: string): void;
  scanBarcode(): string;
  packageItem(orderId: string): void;
}

class BasicPrinter implements WarehouseDevice {
  printLabel(orderId: string): void { /* works */ }
  scanBarcode(): string { throw new Error("Not supported"); } // Forced!
  packageItem(orderId: string): void { throw new Error("Not supported"); }
}

// GOOD: Segregated interfaces
interface LabelPrinter {
  printLabel(orderId: string): void;
}

interface BarcodeScanner {
  scanBarcode(): string;
}

interface ItemPackager {
  packageItem(orderId: string): void;
}

class BasicPrinter implements LabelPrinter {
  printLabel(orderId: string): void { /* only what it does */ }
}
```

### Detection
If you see `throw new Error("Not implemented")` or empty method bodies, the interface is too fat.

---

## D - Dependency Inversion Principle (DIP)

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

### Problem It Solves
Tight coupling to specific implementations (databases, APIs, frameworks). Hard to test, hard to swap.

### How to Apply
Depend on interfaces, inject implementations.

```typescript
// BAD: Direct dependency on concrete class
class OrderService {
  private emailService = new SendGridEmailService(); // Locked in!

  confirmOrder(email: string): void {
    this.emailService.send(email, "Order confirmed");
  }
}

// GOOD: Depend on abstraction
interface EmailService {
  send(to: string, message: string): void;
}

class OrderService {
  constructor(private emailService: EmailService) {}

  confirmOrder(email: string): void {
    this.emailService.send(email, "Order confirmed");
  }
}

// Now can inject any implementation
new OrderService(new SendGridEmailService());
new OrderService(new SESEmailService());
new OrderService(new MockEmailService()); // For tests!
```

### The Dependency Rule
Source code dependencies should point **inward** toward high-level policies (domain logic), never toward low-level details (infrastructure).

```
Infrastructure → Application → Domain
      ↑              ↑            ↑
    (outer)       (middle)     (inner)

Dependencies flow: outer → inner
Never: inner → outer
```

---

## Applying SOLID at Architecture Level

These principles scale beyond classes:

| Principle | Architecture Application |
|-----------|--------------------------|
| SRP | Each bounded context has one responsibility |
| OCP | New features = new modules, not edits to existing |
| LSP | Microservices with same contract are substitutable |
| ISP | Thin interfaces between services |
| DIP | High-level business logic doesn't know about databases/frameworks |

---

## Quick Reference

| Principle | One-Liner | Red Flag |
|-----------|-----------|----------|
| SRP | One reason to change | "This class handles X and Y and Z" |
| OCP | Add, don't modify | `if/else` chains for types |
| LSP | Subtypes are substitutable | Type-checking in calling code |
| ISP | Small, focused interfaces | Empty method implementations |
| DIP | Depend on abstractions | `new ConcreteClass()` in business logic |---

# Common Code Smells (Beyond SOLID)

| Smell | Signs |
|-------|-------|
| **Long method** | Function > 30 lines, multiple levels of nesting |
| **Feature envy** | Method uses more data from another class than its own |
| **Data clumps** | Same group of parameters passed together repeatedly |
| **Primitive obsession** | Using strings/numbers instead of domain types |
| **Shotgun surgery** | One change requires edits across many files |
| **Divergent change** | One file changes for many unrelated reasons |
| **Dead code** | Unreachable or never-called code |
| **Speculative generality** | Abstractions for hypothetical future needs |
| **Magic numbers/strings** | Hardcoded values without named constants |

---

# Refactor Heuristics

1. **Split by responsibility, not by size** - A small file can still violate SRP
2. **Introduce abstraction only when needed** - Wait for the second use case
3. **Keep refactors incremental** - Isolate behavior before moving
4. **Preserve behavior first** - Add tests before restructuring
5. **Name things by intent** - If naming is hard, the abstraction might be wrong
6. **Prefer composition over inheritance** - Inheritance creates tight coupling
7. **Make illegal states unrepresentable** - Use types to enforce invariants
