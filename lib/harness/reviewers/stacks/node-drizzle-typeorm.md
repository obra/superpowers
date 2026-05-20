# Drizzle ORM / TypeORM Database Review Rules

## Drizzle ORM Specific

### Schema Design

- **Index on EVERY Foreign Key**: Drizzle does NOT auto-index FK columns. Reject tables with FK references that lack explicit `index()` definitions. Without indexes, joins and lookups on FK columns perform full table scans.
- **Explicit `onDelete` Actions**: Every `.references()` must specify `{ onDelete: 'cascade' }` (or `'restrict'`, `'set null'`). Reject bare `.references()` — default behavior varies by database and causes orphaned rows.
- **Timestamps on ALL Tables**: `createdAt` and `updatedAt` on every table, including join/pivot tables. Use SQL expressions for defaults (`sql\`(now())\`` for PostgreSQL, `sql\`(datetime('now'))\`` for SQLite), not JavaScript `Date.now()`.
- **Naming Conventions**: Table names in plural `snake_case` (`users`, `blog_posts`). Column names in `snake_case` in database, `camelCase` in TypeScript. Variable names in `camelCase` for table references.
- **Specific Column Types**: Reject generic `text()` or `varchar()` for typed data. Use `integer` for money (cents), `boolean` for flags, `timestamp` for dates, `text('col', { enum: [...] })` for enums.
- **Money as Integer**: NEVER use `real`/`float`/`decimal` for monetary values. Store as `integer` (cents) to avoid floating-point precision issues.

### Query Patterns

- **No N+1 Queries**: Reject loops that execute a query per iteration. Use explicit joins (`db.select().from().leftJoin()`) or batch queries. Drizzle does NOT provide "magic" eager loading — developers must write efficient queries.
- **Select Only Needed Columns**: Reject `db.select().from(users)` when only specific fields are needed. Use `db.select({ id: users.id, name: users.name }).from(users)`.
- **Prepared Statements**: Repeated queries MUST use prepared statements (`db.select().from().prepare()`) for performance.
- **Operator Helpers**: Use `eq()`, `gt()`, `lt()`, `inArray()`, `like()` from `drizzle-orm` for all WHERE conditions. Reject raw SQL string concatenation.
- **Upserts via `onConflictDoUpdate`**: Reject check-then-insert patterns (race condition risk). Use `.onConflictDoUpdate()` for atomic upserts.
- **Batch Operations**: Use batch inserts (`.insert().values([...])`) for multiple records. Reject sequential `.insert()` calls in loops.

### Type Safety

- **Infer Types from Schema**: Reject manual TypeScript interfaces that duplicate schema definitions. Use `typeof users.$inferSelect` and `typeof users.$inferInsert` or `InferSelectModel`/`InferInsertModel`.
- **No `as` Casts to Bypass Types**: If Drizzle's type inference indicates a problem (potentially undefined field, type mismatch in WHERE clause), there is usually a real issue. Type assertions must be rare and well-commented.
- **DTO Separation**: Reject returning database row types directly to API consumers. Define separate DTO/response types. Exposing DB types couples API contract to schema — any column change breaks API consumers.

### Migrations (drizzle-kit)

- **`dialect` Not `driver`**: Config must use `dialect: 'postgresql' | 'mysql' | 'sqlite'`. The `driver` field is deprecated.
- **`defineConfig()`**: Import from `drizzle-kit` for type-safe config.
- **`generate` Then `migrate`**: Reject `push` in production. `push` is for local prototyping only — it doesn't create migration files. Production MUST use `npx drizzle-kit generate` then `npx drizzle-kit migrate`.
- **Migration Files Committed**: All generated SQL migration files MUST be committed to git. They are the source of truth for schema changes.
- **Strict Mode**: `drizzle-kit` MUST run in strict mode. Without it, column renames are interpreted as "drop + add" — silently destroying data.
- **Additive Migrations**: Production migrations must be additive. Add columns as nullable first, backfill data, then add NOT NULL constraint. Never drop columns in the same migration that removes them from code.

### SQL Injection Prevention

- **Parameterized by Default**: Drizzle prevents SQL injection by default through its query builder. Flag any use of `sql.raw()` or `sql\`...${userInput}\`` with unsanitized input.
- **Safe Raw SQL**: When raw SQL is necessary (window functions, CTEs, DB-specific features), use `sql\`...${param}\`` with parameterized values, NOT string interpolation.
- **Raw SQL Justification**: Raw SQL should be reserved for genuinely complex operations. Reject `sql` templates for simple queries that the query builder can express.

### Connection Management

- **Lazy Connection Pattern**: Reject eager database connections at module load time. Use lazy initialization (connection created on first query). Eager connections cause issues in serverless/edge environments.
- **Singleton DB Instance**: Reject creating multiple database instances. Use a single shared `db` instance via module export or dependency injection.
- **Pool Configuration**: Connection pool size configured appropriately for the environment. Default pool sizes are rarely optimal for production.

### SQLite Specific

- **`foreign_keys = ON` Pragma**: SQLite has FK constraints OFF by default. Reject SQLite setups without `PRAGMA foreign_keys = ON`.
- **`journal_mode = WAL`**: Required for concurrent access in SQLite.

---

## TypeORM Specific

### Architecture & Patterns

- **Repository Pattern**: Use Repository or custom Repository pattern. Reject direct `EntityManager` usage in controllers. Business logic in services, data access in repositories.
- **Data Mapper over Active Record**: Prefer Data Mapper pattern (separate repository) over Active Record (entity methods) for testability. Flag Active Record usage for review.
- **Custom Repositories**: Complex queries belong in custom repositories that extend the base repository. Reject complex QueryBuilder logic in controllers or services.

### Query Performance

- **N+1 Query Prevention**: Reject loops that call `.find()` or `.findOne()` per iteration. Use `relations: { child: true }` in find options or `leftJoinAndSelect()` in QueryBuilder.
- **Select Specific Fields**: Use `select: ['id', 'name']` in find options or `.select(['user.id', 'user.name'])` in QueryBuilder. Reject loading entire entities when only a few fields are needed.
- **Pagination**: All list endpoints MUST implement pagination. Use `take`/`skip` (limit/offset) or cursor-based pagination. Reject unbounded `.find()` calls.
- **Query Caching**: Frequently executed read queries should use `.cache(ttl)` or external Redis caching. Flag hot paths without caching.
- **`getRawMany()` for Read-Only**: When full entity hydration is not needed, use `getRawMany()` to avoid TypeORM's entity mapping overhead.

### Entity Design

- **Indexes on Query Columns**: Use `@Index()` decorator on columns used in WHERE, ORDER BY, or JOIN conditions. Reject entities without indexes on frequently queried columns.
- **Soft Deletes**: Use `@DeleteDateColumn()` for soft deletes. Reject hard deletes on business-critical entities without explicit architecture sign-off.
- **UUID Primary Keys**: Prefer `@PrimaryGeneratedColumn('uuid')` over auto-increment integers for distributed systems and security (non-guessable IDs).
- **`@CreateDateColumn()` / `@UpdateDateColumn()`**: Every entity MUST have timestamp columns.

### Security

- **QueryBuilder SQL Injection Vectors**: TypeORM's QueryBuilder has known SQL injection gaps in `useIndex()`, `setLock().lockTables()`, `select()`, `orderBy()`, `groupBy()`, and `where(object)` without entity metadata. Reject string interpolation in these methods. Use the high-level find options API (`.find()`, `.findOne()`) which is properly defended.
- **`synchronize: false` in Production**: NEVER use `synchronize: true` in production. It auto-syncs entity classes to the database without migrations — dangerous and non-reversible. Use migrations exclusively.
- **Parameterized Queries**: When using raw SQL via `getConnection().query()`, use parameterized queries (`WHERE id = $1`, not string concatenation).

### Connection & Configuration

- **Async Factory Configuration**: Use `TypeOrmModule.forRootAsync()` with `ConfigService` injection. Reject hardcoded connection parameters.
- **`autoLoadEntities: true`**: Prefer auto-loading entities over manual `entities: [...]` arrays to prevent missing entity registration.
- **Graceful Shutdown**: Database connections closed on application shutdown. Reject missing signal handlers.

### Migrations

- **Migration-Based Schema Changes**: All production schema changes via migration files. Reject direct entity modifications without corresponding migrations.
- **Migration Testing**: Migrations tested against production-sized datasets in staging before production application.