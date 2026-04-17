---
name: developing-with-tinystruct
description: Use when developing with the tinystruct Java framework or working on framework internals. Trigger when creating Application classes, mapping routes with @Action, handling JSON with Builder, or debugging CLI/HTTP dual-mode dispatching.
---

# tinystruct Framework Developer Skill

This skill captures the architecture, conventions, and patterns of the **tinystruct** Java framework — a lightweight, high-performance framework that treats CLI and HTTP as equal citizens.

## Core Principle

**CLI and HTTP are equal citizens.** Every method annotated with `@Action` should ideally be runnable from both a terminal and a web browser without modification.

---

## Creating an Application

Extend `AbstractApplication` for all modules:

```java
package com.example;

import org.tinystruct.AbstractApplication;
import org.tinystruct.system.annotation.Action;

public class HelloApp extends AbstractApplication {

    @Override
    public void init() {
        this.setTemplateRequired(false); // skip .view template lookup for APIs
    }

    @Override public String version() { return "1.0.0"; }

    @Action("hello")
    public String hello() {
        return "Hello, tinystruct!";
    }
}
```

### `init()` Rules
- Called once when `setConfiguration()` is executed.
- Use for: DB setup, resource paths, calling `setTemplateRequired(false)`.
- **Do not** call `setAction()` here — use `@Action` annotations.

---

## Red Flags - STOP and Review

| Symptom | Reality |
|---|---|
| Using `Gson` or `Jackson` | **Violation.** Use `org.tinystruct.data.component.Builder` for native JSON. |
| `template not found` error | **Missing setting.** Call `setTemplateRequired(false)` in `init()` for data-only apps. |
| `@Action` on private method | **Ignored.** Actions MUST be `public` to be registered. |
| Hardcoding `main()` method | **Anti-pattern.** Use `bin/dispatcher` for execution. |
| Direct `ActionRegistry` usage | **Avoid.** Let the framework handle routing via annotations. |

---

## Common Pitfalls

- **CLI Arg Visibility**: Pass args as `--key value`; access via `getContext().getAttribute("--key")`.
- **Mode Disambiguation**: Use `mode = Mode.HTTP_POST` if a path handles different logic for GET vs POST.
- **Path Params**: Ensure method parameter types match the expected path segments (String, int, etc.).

---

## Technical Reference

Detailed guides are available in the `references/` directory:

- [Architecture & Config](references/architecture.md) — Abstractions, Package Map, Properties
- [Routing & @Action](references/routing.md) — Annotation details, Modes, Parameters
- [Data Handling](references/data-handling.md) — Using the native `Builder` for JSON
- [System & Usage](references/system-usage.md) — Context, Sessions, Events, CLI usage
- [Testing Patterns](references/testing.md) — JUnit 5 integration and ActionRegistry testing

---

## Reference Source Files (Internal)

- `src/main/java/org/tinystruct/AbstractApplication.java` — Core base class
- `src/main/java/org/tinystruct/system/annotation/Action.java` — Annotation & Modes
- `src/main/java/org/tinystruct/application/ActionRegistry.java` — Routing Engine
