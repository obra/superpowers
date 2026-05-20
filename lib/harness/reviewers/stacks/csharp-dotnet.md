# C# / Modern .NET (8/9) Specific Evaluation Rules

## Architecture & Framework Idioms

- **Minimal APIs**: Prefer Minimal APIs with endpoint filters and route grouping for new services. Controllers acceptable for complex applications. Do not mix paradigms in the same domain module.
- **Typed Results**: API endpoints MUST use `Results<T>` or `IResult` for explicit response typing. Reject untyped `IActionResult` without documented reason.
- **Modern C# Features**: Enforce correct usage of records for DTOs, primary constructors, pattern matching for switch, and file-scoped namespaces. Reject legacy class-based DTOs when records are appropriate.
- **DTOs Separated from Entities**: Data Transfer Objects MUST be separate from Entity Framework entities. Never expose EF entities directly in API responses. Use AutoMapper or manual mapping.
- **Dependency Injection**: Proper DI via built-in IoC container. Strictly reject Service Locator anti-patterns (`IServiceProvider.GetService` outside of infrastructural setup).
- **Asynchronous Integrity**: Enforce strict `async/await` patterns. Block `.Result`, `.Wait()`, or `Task.Run().Result` (Sync-over-Async causes thread pool starvation).
- **Repository/CQRS**: Repository pattern or CQRS used consistently within the same bounded context. MediatR acceptable for CQRS implementations.

## API Design & Scalability

- **Idempotency Enforcement**: Mutation endpoints (POST/PUT/PATCH) handling financial, transactional, or side-effect operations MUST require idempotency headers/keys.
- **Rate Limiting**: Built-in .NET rate limiting middleware (`AddRateLimiter`) attached to public-facing endpoints. Reject unauthenticated endpoints without rate limits.
- **Defensive API**: Correct HTTP status codes — `201 Created` for creation, `204 No Content` for deletion, `400 Bad Request` for validation. Reject blanket `200 OK`.
- **Observability Integration**: OpenTelemetry native instrumentation (built-in .NET 8+). Every new endpoint must instrument structured JSON logging with Correlation IDs and custom Activity spans.
- **OpenAPI/Swagger**: Annotations complete and backward compatibility maintained. Use `Asp.Versioning.Http` for API versioning.
- **Response Compression**: Brotli or Gzip compression enabled for API responses.

## Security & Validation

- **Input Guardrails**: All incoming request payloads validated through FluentValidation or DataAnnotations before reaching application services. Endpoint filters for validation preferred in Minimal APIs.
- **Zero Secrets**: Strictly fail if any hardcoded connection string, API Key, or JWT secret is detected. Force usage of `IConfiguration`, User Secrets (local), or Key Vault/Azure App Configuration providers.
- **Auth Enforcement**: JWT/OIDC authentication with policy-based authorization on all protected endpoints. CORS configured with specific origins (never `*` in production).
- **HTTPS Enforcement**: `UseHttpsRedirection()` middleware in production. HSTS header configured for web applications.
- **Structured Logging**: Serilog or built-in structured JSON logging. Log levels appropriate for environment. No `Console.WriteLine` in production code.

## Production Readiness

- **Graceful Shutdown**: `IHostApplicationLifetime` used for graceful shutdown. In-flight requests complete before process exit.
- **Health Checks**: `/health`, `/health/ready`, `/health/live` endpoints configured for Kubernetes/load balancer probes.
- **Environment Configuration**: Separate `appsettings.Development.json` and `appsettings.Production.json`. Environment variables override file config in production.
