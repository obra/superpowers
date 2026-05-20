# ElysiaJS (Bun) Specific Evaluation Rules

## TypeBox & Validation

- **TypeBox as Single Source of Truth**: All validation uses TypeBox (`t.Object`, `t.String`, etc.). Reject Zod or Joi — TypeBox provides compile-time types + runtime validation with zero overhead.
- **Schema Reuse**: Use reference schema (`t.Ref()`) for shared DTOs. Reject duplicated schema definitions across routes.
- **Response Validation**: Define response schemas for all routes. Elysia validates outgoing data — catch bugs where handlers return unexpected fields (e.g., password in user response).
- **Normalization**: `normalize: true` for input coercion. Unknown properties stripped automatically. Reject handlers that manually filter request bodies.

## Architecture & Structure

- **Feature-Based Structure**: Organize by feature (each feature has controller, service, model). Reject flat file structure for projects with 5+ routes.
- **Elysia Instance as Controller**: Use Elysia instance directly as controller (not class-based controllers tied to Context). Enables automatic type inference.
- **Services Decoupled from Context**: Business logic in plain functions or static classes, NOT tied to Elysia `Context`. Services testable without HTTP layer.
- **Plugin Deduplication**: Named plugins for deduplication (`new Elysia({ name: 'auth' })`). Reject unnamed plugins that may register multiple times.
- **Guards as Typed Middleware**: Authentication via guards that populate context with typed auth data. Reject manual token parsing in route handlers.

## Bun-Specific Patterns

- **Bun Native Drivers**: Prefer Bun's native PostgreSQL (`@oven/bun-postgres`) and SQLite drivers over Node.js compatibility layers. Reject `pg` or `mysql2` when Bun native is available.
- **Native Static Responses**: Enable `nativeStaticResponse` for static route responses. Use Bun's inline value optimization.
- **AOT Compilation**: Ahead-of-time compilation enabled for production. `bun build --compile` for standalone executables in containerless deployments.
- **Bun Test Runner**: Use `bun test` — reject Jest/Vitest configuration. Bun's test runner is native-speed with zero config.
- **Bun.serve Configuration**: TLS configured via `serve.tls` (BoringSSL). Reject external TLS proxy when Bun native TLS is sufficient.

## Production Readiness

- **NODE_ENV=production**: Required. Disables `allowUnsafeValidationDetails` — never expose schema field names or expected types in production error responses.
- **Error Handling**: `onError` hook returns generic messages in production. Internal errors logged but never exposed to clients. Reject handlers that return `error.message` in production.
- **Security Headers**: `onRequest` hook sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.
- **Graceful Shutdown**: `app.stop()` called on `SIGTERM`/`SIGINT`. In-flight requests complete before exit.
- **Environment Validation**: Fail-fast env var validation at startup (`.env()` method or `@yolk-oss/elysia-env`). Reject `process.env` reads without validation.
- **Rate Limiting**: Rate limiting plugin for production APIs. Stricter limits on auth endpoints.
- **CORS**: Configured with specific origins. Reject `origin: '*'` for authenticated APIs.

## End-to-End Type Safety

- **Eden Treaty**: Type-safe client generation from server types. Reject manual client type definitions when Eden Treaty can infer them.
- **OpenAPI Generation**: Swagger/OpenAPI auto-generated from TypeBox schemas. Keep documentation in sync with implementation.
