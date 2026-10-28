# Attack Classes

#### Attack classes — choose and split based on Phase 1

Select attack classes relevant to the application type. Not every class applies to every codebase. The list below is a starting point; add application-specific classes from Phase 1 and split large codebases per subsystem. Frame work as finding, validating, fixing, and prioritizing vulnerabilities. Keep validation to source review and bounded local fixtures; do not develop payload chains, test availability on live services, or take action in shared environments.

Use `confirmed` only when source evidence and bounded validation establish the full boundary and meaningful result. Use `needs_validation` when a specific deployment, provider, platform, identity, or runtime fact is unavailable; state the missing fact and the safe owner-observed or local check that resolves it.

> **Native / binary / kernel targets** (C/C++/Rust-unsafe, kernel modules, parsers and decoders, FFI, concurrent runtimes, binary loaders, JITs, firmware): use the memory-safety, integer/ABI, concurrency, binary-loader, and privileged-interface classes in [MEMORY-SAFETY-AND-BINARY.md](MEMORY-SAFETY-AND-BINARY.md).
>
> **AI / LLM / agent targets** (chatbots, RAG, persistent memory, tool-calling agents, MCP servers/clients, prompt assembly, or model-controlled actions): use the context, memory-poisoning, action-binding, tool-schema, MCP-identity, and output classes in [AI-AND-LLM.md](AI-AND-LLM.md).
>
> **HTTP, web, and identity targets** (ordinary web apps, APIs, reverse proxies, CDNs, gateways, custom HTTP parsers, sessions, CSRF, JWT, OAuth/OIDC, SAML, MFA, passkeys, account recovery/linking, API keys, or mTLS): use [WEB-PROTOCOL-AND-AUTH.md](WEB-PROTOCOL-AND-AUTH.md).
>
> **Client-side and browser targets** (SPAs, browser extensions, embedded webviews, service workers, browser storage, cross-window messaging, CORS, WebSockets, or DOM rendering): use [CLIENT-SIDE.md](CLIENT-SIDE.md).
>
> **Supply-chain and release targets** (dependency resolution, generated inputs, CI, release/signing/promotion, updates, plugins, or extensions): use [SUPPLY-CHAIN-AND-RELEASE.md](SUPPLY-CHAIN-AND-RELEASE.md).
>
> **Cloud and deployment targets** (IAM, infrastructure as code, containers/Kubernetes, service mesh, serverless/edge, ingress, provider events, or runtime configuration): use [CLOUD-AND-DEPLOYMENT.md](CLOUD-AND-DEPLOYMENT.md).
>
> **Protocol, RPC, and messaging targets** (gRPC, GraphQL transports, Protobuf/Cap'n Proto/Thrift, custom protocols, queues, brokers, pub/sub, webhooks, or streaming RPC): use [PROTOCOLS-RPC-AND-MESSAGING.md](PROTOCOLS-RPC-AND-MESSAGING.md).
>
> **Resource-exhaustion and availability targets** (untrusted work can consume shared CPU, memory, disk, connections, workers, queues, quotas, or operator-owned spend): use [RESOURCE-EXHAUSTION-AND-AVAILABILITY.md](RESOURCE-EXHAUSTION-AND-AVAILABILITY.md).
>
> **Data-isolation and lifecycle targets** (multi-tenant stores, caches/search, object links, analytics, export/backup, migration, deletion, retention, or restore): use [DATA-ISOLATION-AND-LIFECYCLE.md](DATA-ISOLATION-AND-LIFECYCLE.md).
>
> **Desktop, mobile, and local-IPC targets** (native apps, deep links, webview bridges, exported components, privileged helpers, local daemons, Unix sockets/XPC/Binder/D-Bus): use [DESKTOP-MOBILE-AND-LOCAL-IPC.md](DESKTOP-MOBILE-AND-LOCAL-IPC.md).

**Injection** (subagent_type: `general`)
Trace untrusted input from entry point to dangerous sink. What counts as a "dangerous sink" depends on the application:
- Web apps: SQL queries, HTML output, shell commands, template engines, file paths, HTTP redirects, deserialization
- Libraries: any function that processes caller-supplied data without validation — buffer operations, parsers, format strings
- CLI tools: shell command construction, file path handling, environment variable interpolation
- Services: query construction, message serialization, log injection, LDAP/XPATH queries
- Client-side (browser/JS): DOM XSS, prototype pollution, `postMessage`/origin trust, and other browser-side classes — covered by the [CLIENT-SIDE.md](CLIENT-SIDE.md) companion blocks when selected

Do not stop at the obvious direct paths. Look for indirect injection: data stored safely, then retrieved and used in a dangerous context by different code. Look for injection through field names, keys, headers, and metadata — not just values. Look for injection into secondary systems (logs, caches, search indexes, analytics).

**Access control** (subagent_type: `general`)
Verify that a caller cannot do something outside its authority. Go beyond checking whether permission checks exist — verify they check the *right* permission for the *right* resource via the *right* mechanism:
- Is there a path to the same state change that checks a different (weaker) permission?
- Can a field in the request body override what the permission system intended to restrict?
- Are there endpoints that gate on authentication but forget authorization?
- Does the same resource have multiple access paths with inconsistent checks?
- What about bulk/batch/export/import operations — do they enforce per-item permissions?

For complex access models, split into separate agents for auth bypass vs authorization logic.

**Resource and file handling** (subagent_type: `general`)
- Path traversal (reading/writing outside intended directories) — including through symlinks, encoded sequences, and null bytes
- SSRF (making the application fetch attacker-controlled URLs) — including through redirects, DNS rebinding, and URL parser differentials
- Unsafe deserialization, archive extraction (zip slip), temp file handling
- Memory safety (if applicable): buffer overflows, use-after-free, integer overflow
- Race conditions on file operations (TOCTOU between check and use)

**Cryptography and secrets** (subagent_type: `general`)
- Weak randomness for security-critical values (tokens, keys, nonces)
- Hardcoded secrets, secrets in logs, error messages, URLs, or client-visible responses
- Broken key derivation, missing HMAC verification, nonce reuse
- Timing side-channels on secret comparison
- Misuse of crypto primitives (ECB mode, unauthenticated encryption, static IVs, etc.)
- What happens when crypto operations fail? Does the error path fall back to no-crypto?

**Business logic** (subagent_type: `general`)
Hunt logic errors by hand: standard scanners cannot find them, and they yield high-impact findings. For each major workflow:
- **State machine violations**: Can you skip steps? Go backwards? Reach an invalid state? What happens if you replay a completed flow? What about partial failure — if step 2 of 3 fails, is step 1 rolled back?
- **Race conditions with business impact**: Concurrent operations that produce invalid states (double-spend, double-approve, lost updates). Focus on operations that check-then-act non-atomically.
- **Numeric/quantity manipulation**: Negative values, zero values, overflow, precision loss, type coercion between string and number.
- **Access boundary violations**: Not "does the permission check exist" but "is it the right check for the business rule?" Can input to one operation bypass a restriction enforced on a different operation for the same effect?
- **Implicit trust assumptions**: Data from storage, config, other components, or plugins assumed safe because "we validated it on the way in." What if a different code path wrote it?
- **Time-based logic**: Expiry checks, scheduling, rate windows, clock skew. What happens at exact boundary moments? What about timezone differences between components?
- **Default and fallback behavior**: What is the security posture when config is missing? When a feature flag is off? When a dependency is unavailable? When the system is mid-migration?

**Feature abuse and data leakage** (subagent_type: `general`)
Legitimate features used for unintended purposes. Look for bugs in the design, not only in the code:
- **Export/backup as exfiltration**: Can a low-privilege user trigger an export, snapshot, or backup that includes data above their access level? Can they export other users' data? Does the export include deleted/draft/private content? Revision history that was supposed to be pruned?
- **Import/restore as injection**: Can import overwrite existing data? Can it create records that bypass normal validation? Can it inject content into collections the user has no write access to? Does it respect the same permission model as the UI?
- **Search/filter/sort as oracle**: Can search queries reveal whether content exists that the user cannot directly access? Do filter parameters let users probe statuses, roles, or fields they should not know about? Does sorting by a hidden field reveal its values through result ordering?
- **Enumeration through side effects**: Do error messages differ between "does not exist" and "no access"? Do response times differ? Response sizes? HTTP status codes? Can you enumerate users through password reset, invite, or registration flows?
- **Preview/draft/staging leakage**: Are preview tokens scoped to one item or do they unlock broader access? Can draft content be discovered through search, RSS feeds, sitemaps, or API listing endpoints? Can cache headers cause a CDN to serve private content publicly?
- **Notification/webhook as SSRF**: Can a user set a notification URL, webhook URL, or callback URL that the server fetches? Is it validated against internal networks? What about after a redirect?

**Chained vulnerabilities and trust boundaries** (subagent_type: `general`)
Individually allowed or contained behavior can become a vulnerability when another component or lifecycle step relies on a stronger guarantee:
- **Multi-step boundary failures**: Map what a low-privilege principal may read, write, invoke, and retain, then connect only concrete outputs to later trust decisions. Confirm each prerequisite and do not assume a downstream effect.
- **Cross-component trust gaps**: Component A validates input and passes it to component B. Compare the exact guarantee A produces with what B assumes, including truncation, type coercion, normalization, tenant scope, and plugin/extension access.
- **Second-order use**: Data safe when stored may become dangerous in a later context. A field name becomes a JSON path, a slug becomes a file path, escaped text enters raw rendering, or a stored string becomes a URL, regex, template, or policy expression.
- **Scope and capability growth**: Token, API-key, plugin, OAuth, MCP, or AI capabilities become broader after delegation, refresh, caching, role change, or composition. Name the concrete operation the resulting principal should not have.
- **Timing and ordering**: Review setup, migration, soft-delete, revoke/cache expiry, check/use, and validate/consume windows. Confirm stale state is accepted before reporting.
- **Rollback and recovery**: Undelete, restore, revision rollback, and cancellation must apply current ownership, validation, and authorization. Confirm which invalid state is restored.

**Wildcard** (subagent_type: `general`)
You are not given a category. Find vulnerabilities outside the standard classes already assigned.

Read code that looks boring or disconnected from security. Follow incomplete, experimental, compatibility, and fallback features, but retain the same concrete boundary and validation requirements as every other class.

Use these starting points, but do not limit yourself to them:
- What is the strangest code in the codebase? Why does it exist? What happens if it is abused?
- Are there any features that feel half-finished, experimental, or bolted on? Those have the weakest security because they got the least review.
- What happens if you use the API in a way the frontend never would? The UI constrains users, but the API does not. What API calls are possible but never made by the client?
- Are there any hidden or undocumented endpoints, parameters, headers, or features? Look at route registrations, middleware, and config for things that are not in the docs.
- What happens when you mix features that were not designed to work together? Localization + preview + caching. Import + plugins + webhooks. OAuth + impersonation + API keys.
- Is there anything interesting in the git history? Reverted security fixes, commented-out auth checks, secrets that were committed then removed (still in history).
- Which valid-account actions affect other users, shared integrity, availability, or operator-owned cost? Verify containment, quotas, authorization, and recovery around those actions.
- Which operations are irreversible or require elevated confirmation? Bind authorization and approval to the final principal, action, and resource.
- What assumptions does the code make about the environment? That the database is local, that the clock is accurate, that DNS is trustworthy, that the filesystem is case-sensitive?
- Look at the test files — what are they **not** testing? Compare the edge cases the developer thought about (tests exist) with the ones they did not (no tests).

Pursue anomalies inside your assigned scope until the invariant is settled. If something looks strange, read it until you can state whether it is safe. If a function has a comment explaining why it is safe, verify the explanation. If a variable is named `temp` or `hack` or `legacy`, read it closely.

**Obvious things** (subagent_type: `general`)
Other agents hunt subtle bugs. This agent checks the basic exposures that are easy to overlook because everyone assumes someone else already checked them:
- Are there any hardcoded passwords, API keys, tokens, or secrets in the source? (grep for `password`, `secret`, `apikey`, `token`, `Bearer`, `-----BEGIN`, common default passwords)
- Are there any TODO/FIXME/HACK/XXX comments that reference security? (`TODO: add auth`, `FIXME: validate input`, `HACK: skip permission check`)
- Is debug mode / dev mode properly gated? Can it be enabled in production via environment variable, query parameter, or header?
- Are there test/example/seed credentials that work in production?
- Is there a `/debug`, `/admin`, `/test`, `/status`, `/health`, `/metrics`, `/env`, `/.env`, `/config` endpoint that is unprotected?
- Are there any `.env`, `.env.local`, `credentials.json`, `*.pem`, `*.key` files checked into the repo?
- Does the `.gitignore` actually cover secrets, uploads, and local config?
- Are dependencies pinned? Are there known CVEs in the dependency tree? (check lockfiles)
- Are there any `eval()`, `exec()`, `child_process`, `Function()`, `vm.runInContext`, `import()` with dynamic input?
- Are CORS headers set to `*` or overly permissive? Is `Access-Control-Allow-Credentials` combined with a wildcard origin?
- Are cookies missing `HttpOnly`, `Secure`, or `SameSite` attributes?
- Are there any open redirects? (parameters named `redirect`, `return`, `next`, `url`, `goto`, `continue` that feed into redirects without validation)
- Is TLS enforced? Are there any HTTP-only endpoints?
- Are error responses in production returning stack traces, internal paths, or SQL errors?

This agent does not need to be creative. It needs to be thorough and literal. Check every item. Report each result.

**Important**: For any finding this agent reports, it must verify the full code path, not just surface appearance. If a cookie is missing `HttpOnly`, check whether the cookie contains security-sensitive data and whether JS needs to read it by design. If an error message contains a field name, check whether the field is ever actually populated with sensitive data. A flag is not a finding — trace the impact before reporting.
