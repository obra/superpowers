# C#/ASP.NET Specific Evaluation Rules

## Architecture & Framework Idioms

- **Modern DI**: Verify proper use of Dependency Injection via Native IoC Container. Strictly reject Service Locator anti-patterns (`IServiceProvider.GetService` outside of infrastructural setup).
- **Asynchronous Integrity**: Enforce strict `async/await` patterns. Block `.Result`, `.Wait()`, or `Task.Run().Result` (Sync-over-Async causes thread pool starvation).
- **C# Modern Features**: Ensure correct usage of primary constructors, records for DTOs, and pattern matching where appropriate to keep codebase modern and clean.
- **Contract Consistency**: Ensure Minimal APIs or Controller patterns are used consistently. Do not mix paradigms in the same domain module.
- **Repository/CQRS**: Repository pattern or CQRS used consistently within the same bounded context.

## API Design & Scalability

- **Idempotency Enforcement**: Mutation endpoints (POST/PUT/PATCH) handling financial, transactional, or side-effect operations MUST require idempotency headers/keys.
- **Defensive API**: Ensure active Rate Limiting middleware is attached to public-facing endpoints. Reject generic `200 OK` returns for creation (`201 Created`) or empty responses (`204 No Content`).
- **Observability Integration**: Every new controller/endpoint must instrument structured JSON logging with Correlation IDs and append custom OpenTelemetry activities/spans.
- **OpenAPI/Swagger**: Annotations complete and backward compatibility maintained.

## Security & Validation

- **Input Guardrails**: All incoming request payloads must pass through robust validation (FluentValidation or DataAnnotations) before reaching application services.
- **Zero Secrets**: Strictly fail the build if any hardcoded connection string, API Key, or JWT secret is detected. Force the usage of `IConfiguration`, User Secrets (local), or Key Vault providers.
- **Auth Enforcement**: Authentication/Authorization on all protected endpoints. CORS configured with specific origins (not `*`).
