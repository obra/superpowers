# tinystruct Data Handling (JSON)

## JSON Handling (use `Builder`, not Gson/Jackson)

The `org.tinystruct.data.component.Builder` class is the framework's native JSON library. It is lightweight and highly optimized for tinystruct's performance requirements.

### Serialization
```java
import org.tinystruct.data.component.Builder;

// Create and populate
Builder response = new Builder();
response.put("status", "success");
response.put("count", 42);
response.put("data", someList);

return response; // {"status":"success","count":42,...}
```

### Parsing
```java
import org.tinystruct.data.component.Builder;

// Parse a JSON string
Builder parsed = new Builder();
parsed.parse(jsonString);

String status = parsed.get("status").toString();
```

### Why use Builder?
- **Zero External Dependencies**: Keeps your application lean.
- **Native Integration**: Works seamlessly with `AbstractApplication` result handling.
- **Performance**: Optimized for the specific data structures used within the framework.
