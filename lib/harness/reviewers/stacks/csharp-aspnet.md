# C#/ASP.NET Review Rules

## Architecture
- Dependency Injection used correctly (no service locator anti-pattern)
- Async/await used properly (no .Result or .Wait(), no sync-over-async)
- Repository pattern or CQRS used consistently
- Minimal API or Controller pattern used consistently (not mixed)

## API Design
- Idempotency keys on POST/PUT/PATCH mutations
- Rate limiting on public endpoints
- Proper HTTP status codes (not always 200)
- OpenAPI/Swagger annotations complete
- Backward compatibility maintained

## Observability
- Structured logging (JSON format, correlation IDs)
- OpenTelemetry traces on all endpoints
- Health check endpoints implemented
- Metrics for request duration, error rates

## Security
- Authentication/Authorization on all protected endpoints
- Input validation (FluentValidation or DataAnnotations)
- No secrets in code or config (use User Secrets / Key Vault)
- CORS configured with specific origins (not *)
