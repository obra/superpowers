# Node.js / Fastify Specific Evaluation Rules

## Schema Validation & Serialization

- **JSON Schema Validation**: All request bodies, params, query strings, and headers validated with JSON Schema via AJV. AJV configured with `removeAdditional: 'all'` to prevent mass-assignment attacks. Reject manual validation when schema is more appropriate.
- **Response Serialization**: Define response schemas for all routes to enable `fast-json-stringify` optimization. Reject untyped JSON responses when schema is straightforward.
- **Schema as Documentation**: JSON schemas serve as API documentation. Keep schemas in sync with implementation. Use `strict: true` and `additionalProperties: false`.

## Plugin Architecture & Encapsulation

- **Plugin Encapsulation**: Each feature as a separate Fastify plugin. Middleware, decorators, and hooks MUST NOT leak across plugin boundaries. Reject global middleware when plugin-scoped hooks suffice.
- **Decorators for DI**: Use `fastify.decorate()` for dependency injection. Attach services to Fastify instance, accessible across routes within plugin scope. Reject singleton modules with mutable state.
- **Plugin Registration Order**: Plugins registered before routes that depend on them. Use `fastify-plugin` wrapper only when intentionally sharing state across encapsulation boundaries.

## Hooks Lifecycle

- **preHandler**: Authentication, authorization, and input transformation. Keep fast (under 5ms). Reject database lookups in auth hooks — include permissions in JWT payload.
- **onSend**: Response transformation, compression, logging enrichment. Reject synchronous operations that block the event loop.
- **onError**: Centralized error handling. Operational errors return appropriate status codes with sanitized messages. Programmer errors (500) never expose stack traces in production.
- **Hook Execution Order**: `onRequest` → `preParsing` → `preValidation` → `preHandler` → `preSerialization` → `onSend` → `onResponse`. Verify hooks are placed at correct lifecycle points.

## Performance & Production

- **Schema-Based Performance**: Leverage `fast-json-stringify` for response serialization (2-3x faster than manual JSON). Define schemas for all list endpoints.
- **Pino Structured Logging**: Fastify uses Pino by default. Configure `level: 'info'` in production (no `debug`). JSON format required — never `console.log`. Use `pino-pretty` only in development.
- **NODE_ENV=production**: Required in production. Disables development-mode overhead (pretty errors, extra validation details). Reject deployment scripts that omit this.
- **Graceful Shutdown**: Handle `SIGTERM`/`SIGINT` — call `fastify.close()`, finish in-flight requests, close database connections, exit cleanly. No hardcoded `process.exit()` in request handlers.
- **Reverse Proxy**: Fastify MUST NOT be exposed directly to the internet. Nginx, HAProxy, or cloud load balancer required for TLS termination, static files, and DDoS protection.

## Security

- **Rate Limiting**: `@fastify/rate-limit` with Redis store for multi-instance deployments. Stricter limits on auth endpoints (login, password reset).
- **JWT Validation**: `@fastify/jwt` for token management. Short expiry on access tokens. Algorithm explicitly specified. Reject `none` algorithm.
- **CORS Configuration**: `@fastify/cors` with explicit origin allowlist. Reject `origin: '*'` combined with `credentials: true`.
- **Body Size Limits**: `bodyLimit` configured (default 1MB). Set appropriate limits per route for file uploads.
- **Zero Secrets**: Environment variables with startup validation. Reject hardcoded API keys, database passwords, or JWT secrets. Use dotenv in development, secret managers in production.
