# tinystruct @Action Routing Reference

## @Action Annotation

```java
@Action(
    value = "path/subpath",          // required: URI segment or CLI command
    description = "What it does",    // shown in --help output
    mode = Mode.HTTP_POST,           // default: Mode.DEFAULT (both CLI + HTTP)
    options = {},                    // CLI option flags
    example = "bin/dispatcher path/subpath/42"
)
public String myAction(int id) { ... }
```

### Mode Values
| Mode | When it triggers |
|---|---|
| `DEFAULT` | Both CLI and HTTP (GET, POST, etc.) |
| `CLI` | CLI dispatcher only |
| `HTTP_GET` | HTTP GET only |
| `HTTP_POST` | HTTP POST only |
| `HTTP_PUT` | HTTP PUT only |
| `HTTP_DELETE` | HTTP DELETE only |
| `HTTP_PATCH` | HTTP PATCH only |

### Path Parameters
tinystruct automatically builds a regex from the method signature:

```java
@Action("user/{id}")
public String getUser(int id) { ... }
// → pattern: ^/?user/(-?\d+)$

@Action("search")
public String search(String query) { ... }
// → pattern: ^/?search/([^/]+)$
// → CLI: bin/dispatcher search/hello
// → HTTP: /?q=search/hello
```

Supported parameter types: `String`, `int/Integer`, `long/Long`, `float/Float`, `double/Double`, `boolean/Boolean`, `char/Character`, `short/Short`, `byte/Byte`, `Date` (parsed as `yyyy-MM-dd HH:mm:ss`).

### Accessing Request/Response

Include `Request` and/or `Response` as parameters — ActionRegistry automatically injects them from `Context`:

```java
@Action(value = "upload", mode = Mode.HTTP_POST)
public String upload(Request<?, ?> req, Response<?, ?> res) throws ApplicationException {
    // req.getParameter("file"), res.setHeader(...), etc.
    return "ok";
}
```
