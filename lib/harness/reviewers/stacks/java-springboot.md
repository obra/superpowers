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
