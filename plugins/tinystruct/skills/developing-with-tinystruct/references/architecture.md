# tinystruct Architecture and Configuration

## Core Architecture

### Key Abstractions

| Class/Interface | Role |
|---|---|
| `AbstractApplication` | Base class for all tinystruct applications. Extend this. |
| `@Action` annotation | Maps a method to a URI path (web) or command name (CLI). The single routing primitive. |
| `ActionRegistry` | Singleton that maps URL patterns to `Action` objects via regex. Never instantiate directly. |
| `Action` | Wraps a `MethodHandle` + regex pattern + priority + `Mode` for dispatch. |
| `Context` | Per-request state store. Access via `getContext()`. Holds CLI args and HTTP request/response. |
| `Dispatcher` | CLI entry point (`bin/dispatcher`). Reads `--import` to load applications. |
| `HttpServer` | Built-in Netty-based HTTP server. Start with `bin/dispatcher start --import org.tinystruct.system.HttpServer`. |

### Package Map

```
org.tinystruct/
├── AbstractApplication.java      ← extend this
├── Application.java              ← interface
├── ApplicationException.java     ← checked exception
├── ApplicationRuntimeException.java ← unchecked exception
├── application/
│   ├── Action.java               ← runtime action wrapper
│   ├── ActionRegistry.java       ← singleton route registry
│   └── Context.java              ← request context
├── system/
│   ├── annotation/Action.java    ← @Action annotation + Mode enum
│   ├── Dispatcher.java           ← CLI dispatcher
│   ├── HttpServer.java           ← built-in HTTP server
│   ├── EventDispatcher.java      ← event bus
│   └── Settings.java             ← reads application.properties
├── data/component/Builder.java   ← JSON serialization (use instead of Gson/Jackson)
└── http/                         ← Request, Response, Constants
```

## Templates

If `templateRequired` is `true` (the default), `toString()` looks for a `.view` file:
- Location: `src/main/resources/themes/<ClassName>.view` (on classpath)
- Variables are interpolated using `[%variableName%]`

```java
// In your action method:
setVariable("username", "James");
setVariable("count", String.valueOf(42));
// The template file uses: [%username%] and [%count%]
```

To skip templates and return data directly (e.g., for APIs):
```java
@Override
public void init() {
    this.setTemplateRequired(false);
}
```

## Configuration (`application.properties`)

Located at `src/main/resources/application.properties`:

```properties
# Database
driver=org.h2.Driver
database.url=jdbc:h2:~/mydb
database.user=sa
database.password=

# Server
default.home.page=hello        # default action for /?q= (root URL)
server.port=8080

# Locale
default.language=en_US
```

Access config values in your application:
```java
String port = this.getConfiguration("server.port");
```
