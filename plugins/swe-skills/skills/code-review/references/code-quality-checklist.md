# Code Quality Checklist

## Error Handling

### Anti-patterns to Flag

- **Swallowed exceptions**: Empty catch blocks or catch with only logging
  ```javascript
  try { ... } catch (e) { }  // Silent failure
  try { ... } catch (e) { console.log(e) }  // Log and forget
  ```
- **Overly broad catch**: Catching `Exception`/`Error` base class instead of specific types
- **Error information leakage**: Stack traces or internal details exposed to users
- **Missing error handling**: No try-catch around fallible operations (I/O, network, parsing)
- **Async error handling**: Unhandled promise rejections, missing `.catch()`, no error boundary

### Best Practices to Check

- [ ] Errors are caught at appropriate boundaries
- [ ] Error messages are user-friendly (no internal details exposed)
- [ ] Errors are logged with sufficient context for debugging
- [ ] Async errors are properly propagated or handled
- [ ] Fallback behavior is defined for recoverable errors
- [ ] Critical errors trigger alerts/monitoring

### Questions to Ask
- "What happens when this operation fails?"
- "Will the caller know something went wrong?"
- "Is there enough context to debug this error?"

---

## Interface design


Based on "Design It Twice" from "A Philosophy of Software Design": your first idea is unlikely to be the best. Generate multiple radically different designs, then compare.


### Evaluation Criteria

From "A Philosophy of Software Design":

**Interface simplicity**: Fewer methods, simpler params = easier to learn and use correctly.

**General-purpose**: Can handle future use cases without changes. But beware over-generalization.

**Implementation efficiency**: Does interface shape allow efficient implementation? Or force awkward internals?

**Depth**: Small interface hiding significant complexity = deep module (good). Large interface with thin implementation = shallow module (avoid).

Avoid:

**Information Leakage**: A design decision is reflected in multiple modules, creating a dependency where changes to that decision require modifying all affected modules.

**Temporal Decomposition**: The code structure is based on the execution order of operations rather than information hiding, which often leads to information leakage.

**Overexposure**: A commonly used feature’s API forces users to learn about rarely used features, increasing the cognitive load.

**Pass-Through Method**: A method does almost nothing except pass its arguments to another method with a similar or identical signature, indicating a poor division of responsibility

**Repetition**: A nontrivial piece of code (or code that is nearly identical) appears repeatedly, suggesting that the correct abstractions have not been found.

**Conjoined Methods**: Two pieces of code are physically separated but cannot be understood independently of one another.
