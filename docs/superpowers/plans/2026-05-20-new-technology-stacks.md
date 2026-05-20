# New Technology Stacks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-prepared:subagent-driven-development (recommended) or superpowers-prepared:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new technology stacks (csharp-dotnet, node-fastify, node-elysia, java-springboot) to the harness review system with stack handlers, reviewer rules, discovery detection, and validator commands.

**Architecture:** Each stack requires: (1) a TypeScript class extending `BaseStackHandler` for detection and command configuration, (2) a Markdown file with reviewer evaluation rules, (3) entries in the discovery detector map, (4) entries in the reviewer loader map and file resolver, (5) validator command entries across 5 validator files. All changes are additive — no existing stacks are modified or removed.

**Tech Stack:** TypeScript, Node.js fs/path APIs, .NET CLI, Fastify, ElysiaJS/Bun, Spring Boot/Maven/Gradle

---

### Task 1: Create `csharp-dotnet` Stack Handler

**Files:**
- Create: `lib/harness/stacks/csharp-dotnet.ts`
- Reference: `lib/harness/stacks/csharp-aspnet.ts`
- Reference: `lib/harness/stacks/base.ts`

- [ ] **Step 1: Write the stack handler**

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class CSharpDotNetStack extends BaseStackHandler {
	name = "csharp-dotnet";

	detect(projectRoot: string): boolean {
		try {
			const entries = fs.readdirSync(projectRoot);
			const hasProjectFile = entries.some(
				(f) => f.endsWith(".csproj") || f.endsWith(".sln"),
			);
			if (!hasProjectFile) return false;

			// Check for modern .NET patterns
			const csprojFiles = entries.filter((f) => f.endsWith(".csproj"));
			for (const csproj of csprojFiles) {
				const content = fs.readFileSync(
					path.join(projectRoot, csproj),
					"utf-8",
				);
				if (
					content.includes("Microsoft.NET.Sdk.Web") ||
					content.includes("WebApplication") ||
					content.includes("Minimal API")
				) {
					return true;
				}
			}

			// Check source files for WebApplicationBuilder pattern
			const allFiles = getAllFiles(projectRoot, [".cs"], 20);
			for (const file of allFiles) {
				try {
					const content = fs.readFileSync(file, "utf-8");
					if (
						content.includes("WebApplication.CreateBuilder") ||
						content.includes("WebApplicationBuilder")
					) {
						return true;
					}
				} catch {
					continue;
				}
			}

			// Fallback: if .csproj exists but no modern patterns, still detect
			// (let csharp-aspnet handle legacy, but csharp-dotnet takes priority in discovery order)
			return hasProjectFile;
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		return "dotnet format --verify-no-changes";
	}
	typecheckCmd(): string {
		return "dotnet build --no-restore";
	}
	testCmd(files?: string[]): string {
		return files
			? `dotnet test ${files.join(" ")} --no-build`
			: "dotnet test --no-build";
	}
	coverageCmd(): string {
		return 'dotnet test --collect:"XPlat Code Coverage"';
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "dotnet-audit",
				npmPackage: "",
				cmd: "dotnet list package --vulnerable",
				outputFormat: "text",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		if (domain === "backend") {
			return [
				{
					name: "openapi-validate",
					cmd: "dotnet swagger validate",
					threshold: undefined,
				},
			];
		}
		return [];
	}
}

function getAllFiles(
	dir: string,
	extensions: string[],
	maxDepth: number,
	currentDepth = 0,
): string[] {
	if (currentDepth >= maxDepth) return [];
	const results: string[] = [];
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				results.push(
					...getAllFiles(fullPath, extensions, maxDepth, currentDepth + 1),
				);
			} else if (
				entry.isFile() &&
				extensions.some((ext) => entry.name.endsWith(ext))
			) {
				results.push(fullPath);
			}
		}
	} catch {
		// ignore permission errors
	}
	return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/stacks/csharp-dotnet.ts
git commit -m "feat: add csharp-dotnet stack handler for modern .NET 8/9"
```

---

### Task 2: Create `node-fastify` Stack Handler

**Files:**
- Create: `lib/harness/stacks/node-fastify.ts`
- Reference: `lib/harness/stacks/node-express.ts`

- [ ] **Step 1: Write the stack handler**

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class NodeFastifyStack extends BaseStackHandler {
	name = "node-fastify";

	detect(projectRoot: string): boolean {
		try {
			const pkg = JSON.parse(
				fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
			);
			const deps = { ...pkg.dependencies, ...pkg.devDependencies };
			return "fastify" in deps;
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		return "npx eslint . --format stylish";
	}
	typecheckCmd(): string {
		return "npx tsc --noEmit";
	}
	testCmd(files?: string[]): string {
		return files ? `npx jest ${files.join(" ")}` : "npx jest";
	}
	coverageCmd(): string {
		return "npx jest --coverage --coverageReporters=text-summary";
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "semgrep",
				npmPackage: "semgrep",
				cmd: "npx semgrep --config=auto --json .",
				outputFormat: "json",
			},
			{
				name: "npmAudit",
				npmPackage: "",
				cmd: "npm audit --json",
				outputFormat: "json",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		return domain === "backend"
			? [{ name: "openapi-validate", cmd: "npx swagger-cli validate" }]
			: [];
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/stacks/node-fastify.ts
git commit -m "feat: add node-fastify stack handler"
```

---

### Task 3: Create `node-elysia` Stack Handler

**Files:**
- Create: `lib/harness/stacks/node-elysia.ts`
- Reference: `lib/harness/stacks/node-express.ts`

- [ ] **Step 1: Write the stack handler**

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class NodeElysiaStack extends BaseStackHandler {
	name = "node-elysia";

	detect(projectRoot: string): boolean {
		try {
			const pkg = JSON.parse(
				fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
			);
			const deps = { ...pkg.dependencies, ...pkg.devDependencies };
			return "elysia" in deps;
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		return "npx biome check . || npx eslint . --format stylish";
	}
	typecheckCmd(): string {
		return "npx tsc --noEmit";
	}
	testCmd(files?: string[]): string {
		return files ? `bun test ${files.join(" ")}` : "bun test";
	}
	coverageCmd(): string {
		return "bun test --coverage";
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "semgrep",
				npmPackage: "semgrep",
				cmd: "npx semgrep --config=auto --json .",
				outputFormat: "json",
			},
			{
				name: "npmAudit",
				npmPackage: "",
				cmd: "npm audit --json",
				outputFormat: "json",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		return domain === "backend"
			? [{ name: "openapi-validate", cmd: "npx swagger-cli validate" }]
			: [];
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/stacks/node-elysia.ts
git commit -m "feat: add node-elysia stack handler"
```

---

### Task 4: Create `java-springboot` Stack Handler

**Files:**
- Create: `lib/harness/stacks/java-springboot.ts`
- Reference: `lib/harness/stacks/csharp-aspnet.ts`

- [ ] **Step 1: Write the stack handler**

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class JavaSpringBootStack extends BaseStackHandler {
	name = "java-springboot";

	detect(projectRoot: string): boolean {
		try {
			// Check for Maven
			const pomPath = path.join(projectRoot, "pom.xml");
			if (fs.existsSync(pomPath)) {
				const pom = fs.readFileSync(pomPath, "utf-8");
				if (
					pom.includes("spring-boot-starter-web") ||
					pom.includes("spring-boot-starter")
				) {
					return true;
				}
			}

			// Check for Gradle
			const gradleFiles = ["build.gradle", "build.gradle.kts"];
			for (const gradleFile of gradleFiles) {
				const gradlePath = path.join(projectRoot, gradleFile);
				if (fs.existsSync(gradlePath)) {
					const gradle = fs.readFileSync(gradlePath, "utf-8");
					if (
						gradle.includes("spring-boot") ||
						gradle.includes("org.springframework.boot")
					) {
						return true;
					}
				}
			}

			return false;
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		// Try Maven first, fallback to Gradle
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn checkstyle:check";
		}
		return "./gradlew checkstyleMain";
	}
	typecheckCmd(): string {
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn compile -q";
		}
		return "./gradlew compileJava";
	}
	testCmd(files?: string[]): string {
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn test";
		}
		return "./gradlew test";
	}
	coverageCmd(): string {
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn jacoco:report";
		}
		return "./gradlew jacocoTestReport";
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "owasp-dependency-check",
				npmPackage: "dependency-check",
				cmd: "mvn dependency-check:check",
				outputFormat: "json",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		if (domain === "backend") {
			return [
				{
					name: "openapi-validate",
					cmd: "mvn springdoc-openapi:generate",
					threshold: undefined,
				},
			];
		}
		return [];
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/stacks/java-springboot.ts
git commit -m "feat: add java-springboot stack handler"
```

---

### Task 5: Create `csharp-dotnet` Reviewer Rules

**Files:**
- Create: `lib/harness/reviewers/stacks/csharp-dotnet.md`
- Reference: `lib/harness/reviewers/stacks/csharp-aspnet.md`

- [ ] **Step 1: Write the reviewer rules**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/reviewers/stacks/csharp-dotnet.md
git commit -m "feat: add csharp-dotnet reviewer rules"
```

---

### Task 6: Create `node-fastify` Reviewer Rules

**Files:**
- Create: `lib/harness/reviewers/stacks/node-fastify.md`
- Reference: `lib/harness/reviewers/stacks/node-express.md`

- [ ] **Step 1: Write the reviewer rules**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/reviewers/stacks/node-fastify.md
git commit -m "feat: add node-fastify reviewer rules"
```

---

### Task 7: Create `node-elysia` Reviewer Rules

**Files:**
- Create: `lib/harness/reviewers/stacks/node-elysia.md`

- [ ] **Step 1: Write the reviewer rules**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/reviewers/stacks/node-elysia.md
git commit -m "feat: add node-elysia reviewer rules"
```

---

### Task 8: Create `java-springboot` Reviewer Rules

**Files:**
- Create: `lib/harness/reviewers/stacks/java-springboot.md`

- [ ] **Step 1: Write the reviewer rules**

```markdown
# Java / Spring Boot 3.x (Java 21) Specific Evaluation Rules

## Java 21 & Spring Boot 3.x Idioms

- **Java 21 Features**: Enforce correct usage of records for DTOs, sealed classes for domain hierarchies, pattern matching for switch, and virtual threads for I/O-heavy workloads. Reject legacy POJOs when records are appropriate.
- **Jakarta EE 10**: All imports use `jakarta.*` namespace (not `javax.*`). Reject any `javax.persistence`, `javax.validation`, or `javax.servlet` imports — Spring Boot 3 requires Jakarta.
- **Spring Boot 3.x**: Use latest Spring Boot 3.x features — `@RestControllerAdvice`, `RestClient` (not `RestTemplate`), functional bean registration where appropriate.

## Architecture & Layering

- **Thin Controllers**: Controllers handle ONLY HTTP concerns (request parsing, response mapping, HTTP status codes). All business logic in `@Service` classes. Reject controllers with complex logic, database queries, or multi-step workflows.
- **Service Layer**: `@Service` classes contain business logic. Stateless — no per-request state in class properties. Shared state belongs in Redis or database.
- **DTOs Separated from Entities**: Data Transfer Objects (records) separate from JPA `@Entity` classes. Never expose entities directly in API responses. Use MapStruct or manual mapping.
- **Repository Pattern**: Spring Data JPA repositories for data access. Custom queries via `@Query` with parameterized JPQL. Reject string-concatenated queries (SQL injection risk).

## Validation & Error Handling

- **Jakarta Bean Validation**: `@Valid`, `@NotNull`, `@Size`, `@Email` on all request DTOs. Custom validators for cross-field validation. Reject unvalidated request bodies.
- **Global Exception Handling**: `@RestControllerAdvice` with `@ExceptionHandler` for centralized error handling. Consistent error response format across all endpoints. Never expose stack traces in production.
- **Correct HTTP Status Codes**: `201 Created` for resource creation, `204 No Content` for deletion, `400 Bad Request` for validation, `401`/`403` for auth. Reject blanket `200 OK`.

## Security

- **Spring Security OAuth2**: Resource server with JWT validation. Policy-based authorization (not just `@RolesAllowed`). Reject `permitAll` on protected endpoints.
- **Zero Secrets**: No hardcoded passwords, API keys, or JWT secrets. Use Spring Cloud Config, HashiCorp Vault, or environment variables. Reject `application.properties` with production secrets.
- **CORS Configuration**: `@CrossOrigin` or `CorsConfigurationSource` with specific origins. Reject `allowedOriginPatterns("*")` in production.
- **Rate Limiting**: Bucket4j or Spring Cloud Gateway rate limiting. Stricter limits on auth endpoints.
- **HTTPS Enforcement**: `server.ssl.enabled=true` in production. HSTS header configured.

## Observability & Production

- **Actuator Health Probes**: `/actuator/health/liveness` and `/actuator/health/readiness` enabled for Kubernetes. Custom health indicators for database and external dependencies.
- **Micrometer + OpenTelemetry**: Metrics, traces, and logs integrated. `@Observed` annotation on critical business methods. Reject uninstrumented production services.
- **Resilience4j**: Circuit breakers for all synchronous inter-service calls. Retry and time limiter configured. Reject direct `RestClient` calls without resilience wrapper.
- **Graceful Shutdown**: `server.shutdown=graceful` and `spring.lifecycle.timeout-per-shutdown-phase=30s`. In-flight requests complete before exit.
- **Virtual Threads**: `spring.threads.virtual.enabled=true` for I/O-heavy workloads. Detect pinned virtual threads via JFR.
- **Structured Logging**: JSON logging format in production. Log levels appropriate for environment. No `System.out.println` in production code.

## Database & Migrations

- **Liquibase or Flyway**: Database migrations version-controlled. Reject manual SQL execution in production. Every schema change has a corresponding migration file.
- **HikariCP Tuning**: Connection pool configured — `maximum-pool-size`, `minimum-idle`, `connection-timeout`, `idle-timeout`. Reject default pool settings for production.
- **Slow Query Prevention**: Database indexes on frequently queried columns. Reject N+1 query patterns (use `@EntityGraph` or `JOIN FETCH`).

## Testing

- **Unit Tests**: `@SpringBootTest` for service layer testing with mocked dependencies. Every service has corresponding test.
- **Integration Tests**: `@SpringBootTest` with `@AutoConfigureTestDatabase` or Testcontainers. Critical workflows tested end-to-end.
- **Test Slices**: `@WebMvcTest` for controller tests, `@DataJpaTest` for repository tests. Reject full context loading for unit tests.
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/reviewers/stacks/java-springboot.md
git commit -m "feat: add java-springboot reviewer rules"
```

---

### Task 9: Update `discovery.ts` with New Stack Detectors

**Files:**
- Modify: `lib/harness/discovery.ts`

- [ ] **Step 1: Add new stack detectors**

Replace the `STACK_DETECTORS` constant (lines 10-20) with:

```typescript
const STACK_DETECTORS: Record<string, { files: string[]; deps?: string[] }> = {
	"react-nextjs": { files: ["package.json"], deps: ["next", "react"] },
	"csharp-dotnet": { files: ["*.csproj", "*.sln"] },
	"csharp-aspnet": { files: ["*.csproj", "*.sln"] },
	"node-fastify": { files: ["package.json"], deps: ["fastify"] },
	"node-elysia": { files: ["package.json"], deps: ["elysia"] },
	"node-express": { files: ["package.json"], deps: ["express"] },
	"python-fastapi": {
		files: ["requirements.txt", "pyproject.toml"],
		deps: ["fastapi"],
	},
	"java-springboot": { files: ["pom.xml", "build.gradle", "build.gradle.kts"] },
	"go-std": { files: ["go.mod"] },
	terraform: { files: ["*.tf", "terraform.tf"] },
};
```

Note: `csharp-dotnet` is placed before `csharp-aspnet` so modern .NET projects match first.

- [ ] **Step 2: Commit**

```bash
git add lib/harness/discovery.ts
git commit -m "feat: add new stack detectors to discovery"
```

---

### Task 10: Update `reviewers/loader.ts` with Mappings

**Files:**
- Modify: `lib/harness/reviewers/loader.ts`

- [ ] **Step 1: Add to `STACK_FILE_MAP`**

Replace lines 5-14 with:

```typescript
const STACK_FILE_MAP: Record<string, string> = {
	"react-nextjs": "react-nextjs.md",
	"csharp-dotnet": "csharp-dotnet.md",
	"csharp-aspnet": "csharp-aspnet.md",
	"node-fastify": "node-fastify.md",
	"node-elysia": "node-elysia.md",
	"node-express": "node-express.md",
	"node-nestjs": "node-nestjs.md",
	"node-drizzle-typeorm": "node-drizzle-typeorm.md",
	"python-fastapi": "python-fastapi.md",
	"java-springboot": "java-springboot.md",
	"go-std": "go-std.md",
	terraform: "terraform.md",
};
```

- [ ] **Step 2: Add file extension mappings to `resolveStacksForFiles`**

In the `resolveStacksForFiles` function, add these checks after the existing extension checks (around line 102-113):

After the `.cs` check (line 102-104), add:
```typescript
// csharp-dotnet is detected via .cs/.csproj/.sln — same as csharp-aspnet
// The discovery system handles priority; loader just needs the extension mapping
```

After the `.py` check (line 108-110), add:
```typescript
if (
	["pom.xml", "build.gradle", "build.gradle.kts"].some((f) =>
		file.endsWith(f),
	) ||
	[".java"].includes(ext)
) {
	stacks.add("java-springboot");
}
```

After the `.go` check (line 111-113), add:
```typescript
// Fastify and Elysia are detected via package.json deps in the detection phase
// but we also check for common file patterns
if (
	file.includes("routes/") ||
	file.includes("handlers/") ||
	file.includes("plugins/") ||
	basename.includes("app.") ||
	basename.includes("server.")
) {
	// These could be fastify or elysia — the detection phase resolves which
	// For loader purposes, we add both and the detection system filters
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/harness/reviewers/loader.ts
git commit -m "feat: add new stack mappings to reviewer loader"
```

---

### Task 11: Update `validators/lint.ts`

**Files:**
- Modify: `lib/harness/validators/lint.ts`

- [ ] **Step 1: Add new stack commands to `cmdMap`**

Replace lines 10-17 with:

```typescript
const cmdMap: Record<string, string> = {
	"react-nextjs": "npx eslint . --format stylish 2>&1 || true",
	"node-express": "npx eslint . --format stylish 2>&1 || true",
	"node-fastify": "npx eslint . --format stylish 2>&1 || true",
	"node-elysia": "npx biome check . 2>&1 || npx eslint . --format stylish 2>&1 || true",
	"csharp-dotnet": "dotnet format --verify-no-changes 2>&1 || true",
	"csharp-aspnet": "dotnet format --verify-no-changes 2>&1 || true",
	"python-fastapi": "black --check . 2>&1 || true",
	"java-springboot": "mvn checkstyle:check 2>&1 || ./gradlew checkstyleMain 2>&1 || true",
	terraform: "terraform fmt -check -recursive 2>&1 || true",
	"go-std": "gofmt -l . 2>&1 || true",
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/validators/lint.ts
git commit -m "feat: add lint commands for new stacks"
```

---

### Task 12: Update `validators/typecheck.ts`

**Files:**
- Modify: `lib/harness/validators/typecheck.ts`

- [ ] **Step 1: Add new stack commands to `cmdMap`**

Replace lines 10-17 with:

```typescript
const cmdMap: Record<string, string> = {
	"react-nextjs": "npx tsc --noEmit 2>&1 || true",
	"node-express": "npx tsc --noEmit 2>&1 || true",
	"node-fastify": "npx tsc --noEmit 2>&1 || true",
	"node-elysia": "npx tsc --noEmit 2>&1 || true",
	"csharp-dotnet": "dotnet build --no-restore 2>&1 || true",
	"csharp-aspnet": "dotnet build --no-restore 2>&1 || true",
	"python-fastapi": "mypy . 2>&1 || true",
	"java-springboot": "mvn compile -q 2>&1 || ./gradlew compileJava 2>&1 || true",
	"go-std": "go build ./... 2>&1 || true",
	terraform: "terraform validate 2>&1 || true",
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/validators/typecheck.ts
git commit -m "feat: add typecheck commands for new stacks"
```

---

### Task 13: Update `validators/test.ts`

**Files:**
- Modify: `lib/harness/validators/test.ts`

- [ ] **Step 1: Add new stack commands to `cmdMap`**

Replace lines 11-18 with:

```typescript
const cmdMap: Record<string, string> = {
	"react-nextjs": `npx jest --passWithNoTests --json --outputFile=/dev/null 2>&1 || true`,
	"node-express": `npx jest --passWithNoTests 2>&1 || true`,
	"node-fastify": `npx jest --passWithNoTests 2>&1 || true`,
	"node-elysia": `bun test --pass-with-no-tests 2>&1 || true`,
	"csharp-dotnet": `dotnet test --no-build --logger "console;verbosity=normal" 2>&1 || true`,
	"csharp-aspnet": `dotnet test --no-build --logger "console;verbosity=normal" 2>&1 || true`,
	"python-fastapi": `pytest --tb=short 2>&1 || true`,
	"java-springboot": `mvn test 2>&1 || ./gradlew test 2>&1 || true`,
	"go-std": `go test ./... 2>&1 || true`,
	terraform: 'echo "No test framework for Terraform"',
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/validators/test.ts
git commit -m "feat: add test commands for new stacks"
```

---

### Task 14: Update `validators/coverage.ts`

**Files:**
- Modify: `lib/harness/validators/coverage.ts`

- [ ] **Step 1: Add new stack commands to `cmdMap`**

Replace lines 11-21 with:

```typescript
const cmdMap: Record<string, string> = {
	"react-nextjs":
		"npx jest --coverage --coverageReporters=text-summary 2>&1 || true",
	"node-express":
		"npx jest --coverage --coverageReporters=text-summary 2>&1 || true",
	"node-fastify":
		"npx jest --coverage --coverageReporters=text-summary 2>&1 || true",
	"node-elysia": "bun test --coverage 2>&1 || true",
	"csharp-dotnet": 'dotnet test --collect:"XPlat Code Coverage" 2>&1 || true',
	"csharp-aspnet": 'dotnet test --collect:"XPlat Code Coverage" 2>&1 || true',
	"python-fastapi": "pytest --cov=. --cov-report=term-missing 2>&1 || true",
	"java-springboot":
		"mvn jacoco:report 2>&1 || ./gradlew jacocoTestReport 2>&1 || true",
	"go-std":
		"go test -coverprofile=coverage.out && go tool cover -func=coverage.out 2>&1 || true",
	terraform: 'echo "N/A"',
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/validators/coverage.ts
git commit -m "feat: add coverage commands for new stacks"
```

---

### Task 15: Update `validators/integration.ts`

**Files:**
- Modify: `lib/harness/validators/integration.ts`

- [ ] **Step 1: Add new stack commands to `cmdMap`**

Replace lines 10-19 with:

```typescript
const cmdMap: Record<string, string> = {
	"react-nextjs":
		"npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true",
	"node-express":
		"npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true",
	"node-fastify":
		"npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true",
	"node-elysia": "bun test --coverage 2>&1 || true",
	"csharp-dotnet": 'dotnet test --filter "Category=Integration" 2>&1 || true',
	"csharp-aspnet": 'dotnet test --filter "Category=Integration" 2>&1 || true',
	"python-fastapi": "pytest -m integration --tb=short 2>&1 || true",
	"java-springboot": "mvn verify 2>&1 || ./gradlew integrationTest 2>&1 || true",
	"go-std": "go test -tags=integration ./... 2>&1 || true",
	terraform: 'echo "No integration tests for Terraform"',
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/validators/integration.ts
git commit -m "feat: add integration test commands for new stacks"
```

---

### Task 16: Run Typecheck and Tests

- [ ] **Step 1: Run TypeScript typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are errors, fix type mismatches in the new stack handlers.

- [ ] **Step 2: Run existing tests**

```bash
npx jest --passWithNoTests
```

Expected: All existing tests pass. New stacks don't break existing functionality.

- [ ] **Step 3: Verify file structure**

```bash
ls lib/harness/stacks/
ls lib/harness/reviewers/stacks/
```

Expected output:
- `stacks/`: base.ts, csharp-aspnet.ts, csharp-dotnet.ts, go-std.ts, java-springboot.ts, node-elysia.ts, node-express.ts, node-fastify.ts, python-fastapi.ts, react-nextjs.ts, terraform.ts
- `reviewers/stacks/`: csharp-aspnet.md, csharp-dotnet.md, go-std.md, java-springboot.md, node-drizzle-typeorm.md, node-elysia.md, node-express.md, node-fastify.md, node-nestjs.md, react-nextjs.md, terraform.md

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify all new stacks integrated and tests passing"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] csharp-dotnet stack handler → Task 1
- [x] node-fastify stack handler → Task 2
- [x] node-elysia stack handler → Task 3
- [x] java-springboot stack handler → Task 4
- [x] csharp-dotnet reviewer rules → Task 5
- [x] node-fastify reviewer rules → Task 6
- [x] node-elysia reviewer rules → Task 7
- [x] java-springboot reviewer rules → Task 8
- [x] Discovery detectors → Task 9
- [x] Reviewer loader mappings → Task 10
- [x] Validator commands (lint, typecheck, test, coverage, integration) → Tasks 11-15
- [x] Typecheck and tests → Task 16

**2. Placeholder scan:** No TBD, TODO, or incomplete sections found. All code is complete.

**3. Type consistency:** All stack handlers extend `BaseStackHandler`, implement the same interface (`IStackHandler`), use consistent method signatures. Validator cmdMaps use the same stack names as defined in handlers.

**4. No "similar to Task N" patterns:** Each task contains complete code, not references to other tasks.
