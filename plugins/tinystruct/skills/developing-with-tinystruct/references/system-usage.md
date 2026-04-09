# tinystruct System and Usage Reference

## Context and CLI Arguments

```java
@Action("echo")
public String echo() {
    // CLI: bin/dispatcher echo --words "Hello World"
    Object words = getContext().getAttribute("--words");
    if (words != null) return words.toString();
    return "No words provided";
}
```

CLI flags passed as `--key value` are stored in `Context` as `"--key"` → value.

## Session Management (Web Mode)

```java
@Action(value = "login", mode = Mode.HTTP_POST)
public String login(Request request) {
    request.getSession().setAttribute("userId", "42");
    return "Logged in";
}

@Action("profile")
public String profile(Request request) {
    Object userId = request.getSession().getAttribute("userId");
    if (userId == null) return "Not logged in";
    return "User: " + userId;
}
```

## Event System

```java
// 1. Define an event
public class OrderCreatedEvent implements org.tinystruct.system.Event<Order> {
    private final Order order;
    public OrderCreatedEvent(Order order) { this.order = order; }

    @Override public String getName() { return "order_created"; }
    @Override public Order getPayload() { return order; }
}

// 2. Register a handler (typically in init())
EventDispatcher.getInstance().registerHandler(OrderCreatedEvent.class, event -> {
    CompletableFuture.runAsync(() -> sendConfirmationEmail(event.getPayload()));
});

// 3. Dispatch
EventDispatcher.getInstance().dispatch(new OrderCreatedEvent(newOrder));
```

## Running the Application

```bash
# CLI mode
bin/dispatcher hello
bin/dispatcher greet/James
bin/dispatcher echo --words "Hello" --import com.example.HelloApp

# HTTP server (listens on :8080 by default)
bin/dispatcher start --import org.tinystruct.system.HttpServer
# Then: http://localhost:8080/?q=hello

# Generate POJO from DB table
bin/dispatcher generate --table users

# Run SQL
bin/dispatcher sql-query "SELECT * FROM users"
```
