# NestJS Specific Evaluation Rules

## Architecture & Module Boundaries

- **Module Boundaries as Bounded Contexts**: Each module has a single responsibility and clear ownership. No circular dependencies between feature modules. If Module A imports Module B, Module B MUST NOT import Module A (use `forwardRef` only as last resort, flag for refactoring).
- **Domain-Driven Structure**: Organize by feature/domain, not by technical layer. Each feature module contains its own controllers, services, DTOs, and entities. Shared cross-cutting concerns live in `shared/`.
- **Explicit Dependency Graph**: Every provider's dependencies are declared in the module's `providers` array. Reject implicit or "teleported" providers that appear in modules without being declared.
- **`@Global()` Discipline**: Only use `@Global()` for truly cross-cutting concerns (ConfigService, logging, email). Reject `@Global()` on feature modules.
- **Dynamic Modules**: External SDKs and third-party integrations MUST be wrapped in dynamic modules with async factory providers. Never inject raw SDK instances directly into services.

## Dependency Injection (DI) Anti-Patterns

- **No Service Locator**: Reject `@Inject()` with string tokens for business logic. Use class-based providers with proper typing.
- **Stateless Services**: Services MUST NOT hold per-request state in class properties. A service instance is a singleton by default — mutating `this.cache` or `this.currentUser` between requests causes data leakage. Shared state belongs in Redis or the database.
- **Controller Thinness**: Controllers handle ONLY HTTP routing, request validation, and response formatting. All business logic lives in services. Reject controllers with complex logic, database queries, or multi-step workflows.
- **No Long Dependency Chains**: If a service injects more than 5 dependencies, flag for decomposition. Use the Facade pattern to group related services.
- **HttpService Wrapper**: Never inject `HttpModule`'s `HttpService` directly into multiple providers. Create a dedicated wrapper service for external API calls.

## Request Pipeline (Execution Order)

- **Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Exception Filters**. Verify this order is respected.
- **ValidationPipe Global**: `ValidationPipe` with `whitelist: true` MUST be applied globally. This strips unknown properties and prevents mass-assignment attacks. Combined with `class-validator` DTOs.
- **Guards for Auth**: JWT verification in global guards. Keep guards fast (1-5ms). Reject database lookups in guards — load permissions during token creation and include them in the JWT payload.
- **`@Public()` Pattern**: Use `@Public()` decorator for endpoints that bypass global guards (health checks, webhook receivers, auth callbacks). Reject disabling guards per-route via module overrides.
- **Interceptors for Cross-Cutting**: Logging, caching, response transformation, and metrics belong in interceptors — not duplicated across controllers. Reject poorly designed interceptors that become bottlenecks (they execute on EVERY request).

## Configuration & Environment

- **Centralized Config**: Use `ConfigModule` with validation schema. Reject `process.env` reads scattered throughout the codebase. All configuration loaded once at bootstrap, validated, and fail-fast if required keys are missing.
- **No Config at Import Time**: Reject reading config at module top-level before Nest finishes bootstrapping. Use `ConfigService` injection or factory providers.
- **Environment-Specific Settings**: Security settings (cookie `secure` flag, HTTPS redirect, CORS origins) MUST NOT be disabled in production for convenience. Use `process.env.NODE_ENV` conditionals.

## Error Handling & Exceptions

- **Global Exception Filter**: Consistent error responses across all endpoints. Never expose stack traces in production. Operational errors return appropriate HTTP status codes.
- **Custom Exceptions**: Domain-specific exceptions extend `HttpException` with proper status codes. Reject throwing raw `Error` objects from controllers.
- **Transaction Safety**: Database operations that must succeed together are wrapped in transactions. Reject sequential `.save()` calls without transaction boundaries when data consistency is required.

## API Design & Scalability

- **OpenAPI Auto-Generation**: `@nestjs/swagger` decorators on all controllers and DTOs. API documentation stays in sync with implementation.
- **Rate Limiting**: `@nestjs/throttler` integrated with the guard system. Stricter limits on auth endpoints.
- **Health Checks**: `@nestjs/terminus` health endpoints for Kubernetes and load balancers. Database, cache, and external dependency health verified.
- **CQRS for Complex Domains**: When read/write asymmetry exists, use `@nestjs/cqrs`. Commands for writes, queries for reads. Event sourcing for audit trails.
- **Graceful Shutdown**: `enableShutdownHooks()` called at bootstrap. In-flight requests complete, connections close cleanly.

## Testing

- **Unit Tests with Mocks**: Services tested in isolation with mocked dependencies. Every service has corresponding test file.
- **Integration Tests**: Critical workflows tested end-to-end with real database (Testcontainers). At minimum: run a migration, hit a health endpoint, verify one critical workflow.
- **E2E Tests**: `supertest` for API contract verification. Test the full request pipeline: middleware → guards → pipes → handler → response.