# Node.js / Express / Bun.js Backend Review Rules

## Runtime & Event Loop Hygiene

- **No Event Loop Blocking**: Reject synchronous file reads (`fs.readFileSync`), CPU-intensive JSON.parse on unbounded payloads, or exponentially backtracking regex in the request path. These stall all concurrent requests.
- **Async-First I/O**: All database, network, and filesystem operations MUST use async APIs. Sequential `await` chains for independent tasks must be replaced with `Promise.all()` or `Promise.allSettled()`.
- **Memory Leak Detection**: Reject event listeners that accumulate without cleanup, closures capturing large objects beyond request lifecycle, module-level caches without eviction bounds, and sockets not destroyed on disconnect.
- **Bun Native APIs**: When running on Bun, prefer native APIs (`Bun.file()`, `Bun.serve()`, `Bun.sql`) over Node polyfills. Reject `require()` in favor of ESM named imports for tree-shaking.
- **Graceful Shutdown**: Process must handle `SIGTERM`/`SIGINT` — finish in-flight requests, close database connections, and exit cleanly. No hardcoded `process.exit()` in request handlers.

## Express.js Architecture

- **Security Headers**: `helmet()` MUST be installed and applied before all other middleware. Express ships with zero security defaults.
- **Input Validation at Boundary**: Every request body, query parameter, and URL segment validated against an explicit schema (Zod, Joi, or express-validator) BEFORE reaching business logic. Use `stripUnknown: true` to prevent mass-assignment attacks.
- **Rate Limiting**: `express-rate-limit` applied to all endpoints. Stricter limits on auth endpoints (login, password reset). Redis-backed store required for multi-instance deployments.
- **CORS Configuration**: Explicit origin allowlist. Reject `origin: '*'` combined with `credentials: true`. Set `maxAge` for preflight caching.
- **Middleware Execution Order**: Authentication before authorization, validation after parsing, error handling as the LAST middleware. One misplaced hook creates a security gap.
- **Error Handling**: Global error handler MUST be the final middleware. Operational errors return appropriate status codes with sanitized messages. Programmer errors (500) never expose stack traces in production. Structured JSON logging with correlation IDs on every error.
- **Body Size Limits**: `express.json({ limit: '10kb' })` or equivalent. Reject unbounded request bodies.
- **No Mixed Router Paradigms**: Do not mix `app.METHOD()` and `Router()` patterns inconsistently. Choose one approach per module.

## API Design & Scalability

- **Idempotency**: Mutation endpoints (POST/PUT/PATCH) handling financial, transactional, or side-effect operations MUST require idempotency keys.
- **HTTP Status Codes**: Correct status codes — `201 Created` for resource creation, `204 No Content` for successful deletion, `400 Bad Request` for validation failures, `401`/`403` for auth issues. Reject blanket `200 OK`.
- **Observability**: Structured JSON logging on every request. Correlation IDs propagated across service boundaries. Request duration metrics. Health check endpoint (`/healthz`) for load balancers.
- **Pagination**: All list endpoints MUST implement pagination (cursor-based preferred, offset/limit acceptable). Never return unbounded result sets.

## Security

- **Zero Secrets in Code**: No hardcoded API keys, database passwords, JWT secrets, or connection strings. Use environment variables with startup validation (fail fast if required env vars are missing). Production: use AWS Secrets Manager, Vault, or equivalent.
- **JWT Best Practices**: Short expiry on access tokens. Tokens stored in `HttpOnly`, `Secure`, `SameSite` cookies — NEVER in `localStorage`. Algorithm explicitly specified (`algorithm: 'HS256'`). Refresh token rotation implemented.
- **SQL Injection Prevention**: Parameterized queries ONLY when using raw SQL. Never concatenate user input into query strings.
- **Dependency Security**: `npm audit` passes with no critical/high vulnerabilities. Lock file committed and used (`npm ci` in CI). Remove unused packages. Pin versions — no `*` or `latest`.
- **HTTPS Enforcement**: Production MUST enforce HTTPS. HSTS header configured. TLS termination at load balancer with `trust proxy` set in Express.

## Bun.js Specific (when detected)

- **Version Pinning**: Exact Bun version pinned in CI/CD (`"bun": "1.1.34"`, not `"^1.1.0"`). Bun evolves fast — patch releases can introduce breaking changes.
- **Native Module Compatibility**: Reject `bcrypt` (native) — use `bcryptjs`. Reject `sharp` without WASM fallback. Test all `node-gyp` compiled packages under Bun before approval.
- **Lock File**: `bun.lockb` committed to git. CI must use `bun install --frozen-lockfile`.
- **Production Build**: Use `bun build --minify --target=bun` for deployment. Never run development code in production.
- **Node Compatibility Gap**: Code reaching into `process.binding()`, `Module._nodeModulePaths`, or V8-specific APIs will fail under Bun (JavaScriptCore engine). Flag and require alternatives.