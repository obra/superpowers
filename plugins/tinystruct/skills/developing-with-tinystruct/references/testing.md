# tinystruct Testing Patterns

Use JUnit 5 for testing tinystruct applications. Since `ActionRegistry` is a singleton, ensure fresh state is maintained between tests.

## Unit Testing an Application

```java
import org.junit.jupiter.api.*;
import org.tinystruct.application.ActionRegistry;
import org.tinystruct.system.Settings;

class MyAppTest {

    private MyApp app;

    @BeforeEach
    void setUp() {
        app = new MyApp();
        // Set a minimal configuration to trigger init() and annotation processing
        Settings config = new Settings();
        app.setConfiguration(config);
        app.init();
    }

    @Test
    void testHello() throws Exception {
        // Direct invocation via the application object
        Object result = app.invoke("hello");
        Assertions.assertEquals("Hello, tinystruct!", result);
    }

    @Test
    void testGreet() throws Exception {
        // Invocation with arguments
        Object result = app.invoke("greet", new Object[]{"James"});
        Assertions.assertEquals("Hello, James!", result);
    }
}
```

## Testing via ActionRegistry

If you need to test the routing logic itself:

```java
@Test
void testRouting() {
    ActionRegistry registry = ActionRegistry.getInstance();
    // Verify a path matches an action
    Action action = registry.getAction("greet/James");
    Assertions.assertNotNull(action);
}
```

For more complex `ActionRegistry` unit tests, follow the pattern in:
`src/test/java/org/tinystruct/application/ActionRegistryTest.java`
