# Attack Surface Discovery

## Overview

You cannot protect what you haven't mapped. The attack surface is the sum of all points where an attacker can interact with the system.

## Mapping Entry Points

Search the codebase for these common entry point indicators:

### 1. Network / API Boundaries
- **HTTP/REST:** Look for route definitions (`app.get`, `@router.get`, `Express()`, `FastAPI()`).
- **WebSockets:** Look for `ws.on`, `SocketIO`.
- **gRPC / Proto:** Look for `.proto` files and service definitions.

### 2. User Input (CLI & UI)
- **CLI Flags:** `argparse`, `yargs`, `commander`, `click`.
- **Environment Variables:** `process.env`, `os.environ`, `getenv`.
- **Standard Input:** `stdin`, `input()`, `readline`.

### 3. Filesystem & Persistent Storage
- **Config Files:** `.yaml`, `.json`, `.toml`, `.env`.
- **File Uploads:** Directories where files are written by the application.
- **Database Reads:** Especially if the DB is shared with other systems.

### 4. Integration Points
- **Webhooks:** Incoming callbacks from third parties (GitHub, Stripe, etc.).
- **Message Queues:** `RabbitMQ`, `Kafka`, `Redis` pub/sub.

## Trust Boundary Analysis

For each entry point, ask:
1. **Who provides this data?** (Anonymous user, authenticated user, admin, external system).
2. **What permissions does the code have when handling this?** (Root, limited user, database-only).
3. **Does the data cross a boundary?** (e.g., from public internet to internal database).

## Identifying Sinks

Sinks are where data is used in a dangerous way. Trace data from entry points to these common sinks:

| Sink Type | Examples | Risk |
|-----------|----------|------|
| **Execution** | `eval()`, `exec()`, `spawn()`, `os.system()` | Remote Code Execution (RCE) |
| **Data Storage** | `db.execute()`, `Collection.find()` | SQL/NoSQL Injection |
| **Filesystem** | `fs.readFile()`, `open()`, `send_file()` | Path Traversal / LFI |
| **Identity** | `JWT.verify()`, `bcrypt.compare()` | Authentication Bypass |
| **Rendering** | `{{ data }}`, `innerHTML`, `document.write()` | Cross-Site Scripting (XSS) |

## The Discovery Checklist

- [ ] I have listed all HTTP/API endpoints.
- [ ] I have identified all CLI arguments and environment variables used.
- [ ] I have noted every location where the application reads from the filesystem.
- [ ] I have identified which data is "user-controlled" and which is "system-controlled."
- [ ] I have mapped the permissions associated with each major component.
