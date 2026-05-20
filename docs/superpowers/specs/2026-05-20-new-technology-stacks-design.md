# Design: New Technology Stacks for Harness

**Date:** 2026-05-20
**Author:** opencode
**Status:** Approved

## Context

The harness review system currently only has `csharp-aspnet` for C# stacks, which targets older ASP.NET patterns. Modern .NET (8/9) projects use Minimal APIs, native AOT, OpenTelemetry, and other patterns not covered. Additionally, no stacks exist for Fastify, ElysiaJS, or modern Spring Boot (Java 21+).

## Stacks to Add

### 1. `csharp-dotnet` — Modern .NET 8/9

**Detection:** `*.csproj` or `*.sln` files. Checks for `Microsoft.NET.Sdk.Web` in `.csproj` or `WebApplication`/`WebApplicationBuilder` usage in source files. Falls back to `csharp-aspnet` if legacy patterns detected.

**Commands:**
- Lint: `dotnet format --verify-no-changes`
- Typecheck: `dotnet build --no-restore`
- Test: `dotnet test --no-build`
- Coverage: `dotnet test --collect:"XPlat Code Coverage"`
- Integration: `dotnet test --filter "Category=Integration"`
- Security: `dotnet list package --vulnerable`

**Reviewer Rules:**
- Minimal APIs with endpoint filters and route grouping (.NET 8+)
- Typed Results (`Results<T>`) for API contracts
- Records for DTOs, primary constructors, pattern matching
- FluentValidation or DataAnnotations for input validation
- JWT/OIDC authentication with policy-based authorization
- OpenTelemetry native instrumentation (built-in .NET 8+)
- Rate limiting middleware (built-in .NET 7+)
- Structured JSON logging with Correlation IDs
- DTOs strictly separated from EF entities (no entity exposure)
- Graceful shutdown (`IHostApplicationLifetime`)
- No `.Result`, `.Wait()`, or sync-over-async (thread pool starvation)
- Idempotency headers on mutation endpoints
- CORS with specific origins (never `*` in production)
- Zero hardcoded secrets (IConfiguration + User Secrets / Key Vault)

### 2. `node-fastify` — Fastify (Node.js)

**Detection:** `package.json` with `fastify` in dependencies or devDependencies.

**Commands:**
- Lint: `npx eslint . --format stylish`
- Typecheck: `npx tsc --noEmit`
- Test: `npx jest`
- Coverage: `npx jest --coverage --coverageReporters=text-summary`
- Integration: `npx jest --testPathPattern=integration --passWithNoTests`
- Security: `npx semgrep --config=auto --json .` + `npm audit --json`

**Reviewer Rules:**
- JSON Schema validation with AJV (`removeAdditional: 'all'`)
- Plugin encapsulation (no middleware leak across scopes)
- Hooks lifecycle: preHandler (auth/validation), onSend (response transform), onError (centralized errors)
- Decorators for dependency injection (not global middleware)
- Pino structured logging (JSON in production, not console.log)
- Schema-based response serialization (`fast-json-stringify`)
- Graceful shutdown (SIGTERM handling, drain in-flight requests)
- Rate limiting with Redis store for production (`@fastify/rate-limit`)
- JWT validation via `@fastify/jwt`
- `NODE_ENV=production` required (disables dev-mode overhead)
- Reverse proxy required in production (never expose directly)
- CORS configured with specific origins
- Zero hardcoded secrets (env vars, dotenv, or secret managers)

### 3. `node-elysia` — ElysiaJS (Bun)

**Detection:** `package.json` with `elysia` in dependencies or devDependencies.

**Commands:**
- Lint: `npx biome check .` (or `npx eslint . --format stylish` as fallback)
- Typecheck: `npx tsc --noEmit`
- Test: `bun test`
- Coverage: `bun test --coverage`
- Integration: `bun test --coverage` (with integration test filter)
- Security: `npx semgrep --config=auto --json .` + `npm audit --json`

**Reviewer Rules:**
- TypeBox schemas as single source of truth (types + runtime validation)
- No Zod/Joi — use TypeBox for zero-runtime-overhead validation
- Plugin deduplication with named instances
- Guards as typed middleware (populate context with auth data)
- Services decoupled from Elysia Context (testable, framework-agnostic)
- Feature-based folder structure (MVC adapted for Elysia)
- AOT compilation enabled for production performance
- `NODE_ENV=production` required (disables unsafe validation details)
- Error handling: no internal error messages exposed in production
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Eden Treaty for type-safe client generation (end-to-end types)
- Bun native features preferred (SQLite/Postgres driver, native static responses)
- Environment validation at startup (fail-fast with `.env()` or plugin)
- Graceful shutdown via `app.stop()`
- Rate limiting for production APIs
- CORS with specific origins

### 4. `java-springboot` — Spring Boot 3.x + Java 21

**Detection:** `pom.xml` with `spring-boot-starter-web` dependency OR `build.gradle`/`build.gradle.kts` with `spring-boot` plugin.

**Commands:**
- Lint: `mvn checkstyle:check` (Maven) or `./gradlew checkstyleMain` (Gradle)
- Typecheck: `mvn compile -q` (Maven) or `./gradlew compileJava` (Gradle)
- Test: `mvn test` (Maven) or `./gradlew test` (Gradle)
- Coverage: `mvn jacoco:report` (Maven) or `./gradlew jacocoTestReport` (Gradle)
- Integration: `mvn verify` (Maven, runs failsafe) or `./gradlew integrationTest` (Gradle)
- Security: `mvn dependency-check:check` (OWASP) or `./gradlew dependencyCheckAnalyze`

**Reviewer Rules:**
- Java 21 features: records for DTOs, sealed classes, pattern matching for switch, virtual threads
- Spring Boot 3.x with Jakarta EE 10 (`jakarta.*` namespace, not `javax.*`)
- Thin controllers: HTTP concerns only, all business logic in service layer
- `@RestControllerAdvice` for centralized error handling
- Jakarta Bean Validation (`@Valid`, `@NotNull`, custom validators)
- Spring Security OAuth2 resource server with JWT validation
- Policy-based authorization (not just role-based)
- Actuator health probes: liveness + readiness (Kubernetes-ready)
- Micrometer + OpenTelemetry for observability (metrics, traces, logs)
- Resilience4j circuit breakers for inter-service calls
- Graceful shutdown (`server.shutdown=graceful`)
- Liquibase or Flyway for database migrations
- DTOs strictly separated from JPA entities
- HikariCP connection pool tuning (max-pool-size, idle-timeout)
- Virtual threads enabled (`spring.threads.virtual.enabled=true`) for I/O-heavy workloads
- Zero hardcoded secrets (Spring Cloud Config, Vault, or env vars)
- Rate limiting (Bucket4j or Spring Cloud Gateway)
- CORS with specific origins
- No blocking calls in request threads (use async/virtual threads)
- Idempotency on mutation endpoints

## File Changes

### New Files (8)

| File | Purpose |
|------|---------|
| `lib/harness/stacks/csharp-dotnet.ts` | Stack handler for modern .NET |
| `lib/harness/stacks/node-fastify.ts` | Stack handler for Fastify |
| `lib/harness/stacks/node-elysia.ts` | Stack handler for ElysiaJS |
| `lib/harness/stacks/java-springboot.ts` | Stack handler for Spring Boot |
| `lib/harness/reviewers/stacks/csharp-dotnet.md` | Reviewer rules for .NET |
| `lib/harness/reviewers/stacks/node-fastify.md` | Reviewer rules for Fastify |
| `lib/harness/reviewers/stacks/node-elysia.md` | Reviewer rules for ElysiaJS |
| `lib/harness/reviewers/stacks/java-springboot.md` | Reviewer rules for Spring Boot |

### Modified Files (6)

| File | Changes |
|------|---------|
| `lib/harness/discovery.ts` | Add 4 new stack detectors to `STACK_DETECTORS` |
| `lib/harness/reviewers/loader.ts` | Add 4 entries to `STACK_FILE_MAP`, add file extension mappings to `resolveStacksForFiles` |
| `lib/harness/validators/lint.ts` | Add 4 new stack commands to `cmdMap` |
| `lib/harness/validators/typecheck.ts` | Add 4 new stack commands to `cmdMap` |
| `lib/harness/validators/test.ts` | Add 4 new stack commands to `cmdMap` |
| `lib/harness/validators/coverage.ts` | Add 4 new stack commands to `cmdMap` |
| `lib/harness/validators/integration.ts` | Add 4 new stack commands to `cmdMap` |

## Detection Priority

Stacks are detected in order. New stacks should be placed before `csharp-aspnet` in `STACK_DETECTORS` so modern .NET projects match `csharp-dotnet` first. The `csharp-aspnet` stack remains as fallback for legacy projects.

## Backwards Compatibility

- `csharp-aspnet` is NOT removed — it remains for legacy ASP.NET projects
- No existing stack behavior is modified
- All changes are additive
